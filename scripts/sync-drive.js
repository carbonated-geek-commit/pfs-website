#!/usr/bin/env node
/**
 * sync-drive.js — enumerates the club's Google Drive folders and generates
 * per-file links for the website. The owner keeps working in Drive; the site
 * follows.
 *
 * TWO HARD RULES, enforced in code:
 *   1. Never emit a folder link. Individual files only.
 *   2. A file in a "members" folder that is anonymously reachable is a LEAK.
 *      The sync fails the build and names the file. It does not publish it.
 *
 * WHY WE PROBE INSTEAD OF READING PERMISSIONS:
 *   A read-only service account cannot view sharing info ("You do not have
 *   permission to view sharing information for this item"). So rather than
 *   ask Drive what the permissions say, we test what a stranger actually
 *   sees — an unauthenticated request to the file. That is the ground truth.
 *
 * OUTPUTS (machine-owned — never hand-edit, never edit in the CMS):
 *   src/_data/library.json        — collections + files, with access flags
 *   src/_data/minutes_files.json  — [{ id, title, url, modified }]
 *
 * HUMAN-OWNED (edited in the CMS; this script never touches it):
 *   src/_data/minutes.json        — [{ id, month, synopsis }]  joined by `id`
 *
 * SETUP (needs the Drive owner):
 *   1. Create a GCP project + service account; download its JSON key.
 *   2. Enable the Google Drive API on that project.
 *   3. In Drive, share EACH folder below with the service account's email
 *      (…iam.gserviceaccount.com) as Viewer.
 *   4. Store the key JSON as GitHub secret GDRIVE_SA_KEY.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// ---- gating state ------------------------------------------------------------
// Flip to true ONLY after the Drive owner restricts the folders AND we verify.
// While false, members files are published "draped": listed with url: "" so the
// site renders the sign-in state instead of a working link. The anonymous-reach
// probe below stays active either way as the second guard.
const GATED = true;

// ---- configure: folder id -> how it publishes -------------------------------
// Get an id from the folder URL: drive.google.com/drive/folders/<ID>
// Agendas & Minutes stay PUBLIC (PII removed; kept public for auditing).
// Member Recipes stay PUBLIC (no PII). Forms & Presentations are PUBLIC.
// The "Members Only" folder is the one restricted collection.
const FOLDERS = [
  { id: '115uK-KioxUFuSLYxMqz1lxY_1h_2-2es', kind: 'minutes',  access: 'public', title: 'Agendas & Minutes' },
  // A second, restricted minutes folder would go here once it exists:
  // { id: 'REPLACE_RESTRICTED_MINUTES_FOLDER_ID', kind: 'minutes', access: 'members', title: 'Restricted Minutes' },
  { id: '1ifq77v6Px6jPQqCMhFv_A3MBdcaMbEMU', kind: 'library',  access: 'public',  title: 'Forms & Training Aids',
    blurb: 'Scoresheets, style guidelines, and reference material.' },
  { id: '1D0YcXIDANh2brhDpLwwOAZCMGCchy-nu', kind: 'library',  access: 'public', title: 'Member Recipes',
    blurb: 'Award-winning and club-favorite recipes shared by members.' },
  { id: '1EqvDVBeAzrYlgGv7ifJyP18O7Jzv1dCW', kind: 'library',  access: 'public',  title: 'Presentations',
    blurb: 'Slides from past monthly education sessions.' },
  { id: 'REPLACE_MEMBERS_FOLDER_ID',         kind: 'library',  access: 'members', title: 'Members Only',
    blurb: 'Rosters, contact lists, and documents for current members.' },
];

const DATA_DIR = path.join(__dirname, '..', 'src', '_data');
const leaks = [];
const warnings = [];

// ---- auth -------------------------------------------------------------------
function driveClient() {
  const raw = process.env.GDRIVE_SA_KEY;
  if (!raw) {
    console.error('Missing GDRIVE_SA_KEY. The service account key is not configured.');
    process.exit(1);
  }
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

// ---- enumerate a folder (files only, no nesting, no folder links) -----------
async function listFiles(drive, folderId) {
  const files = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      orderBy: 'name',
      pageSize: 200,
      pageToken,
    }).catch(err => {
      console.error(`\nCannot read folder ${folderId}.`);
      console.error('Has it been shared with the service account as Viewer?\n');
      throw err;
    });
    files.push(...res.data.files);
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

// ---- the leak check: is this file reachable WITHOUT signing in? -------------
// Heuristic, deliberately conservative. Google serves a sign-in interstitial
// for restricted files; public files return the doc. We treat "can't tell" as
// "assume restricted" ONLY for public-folder files, and as a hard failure for
// members files (fail closed).
async function isAnonymouslyReachable(fileId) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return false;                       // 401/403/404 -> restricted
    const finalUrl = res.url || '';
    if (/accounts\.google\.com/.test(finalUrl)) return false;  // bounced to sign-in
    const body = await res.text();
    if (/Sign in|Request access|You need access/i.test(body.slice(0, 4000))) return false;
    return true;                                     // served content anonymously
  } catch {
    return null;                                     // network/unknown
  }
}

const fileUrl = (id) => `https://drive.google.com/file/d/${id}/view`;

const kindOf = (mimeType, name) => {
  if (/presentation|\.pptx?$/i.test(mimeType + name)) return 'PPT';
  if (/document|wordprocessing|\.docx?$/i.test(mimeType + name)) return 'DOC';
  return 'PDF';
};

// ---- main -------------------------------------------------------------------
(async () => {
  const unset = FOLDERS.filter(f => f.id.startsWith('REPLACE_'));
  if (unset.length) {
    console.error('Folder IDs not configured: ' + unset.map(f => f.title).join(', '));
    process.exit(1);
  }

  const drive = driveClient();
  const library = [];
  let minutesFiles = [];

  for (const folder of FOLDERS) {
    const files = await listFiles(drive, folder.id);
    console.log(`${folder.title}: ${files.length} file(s)`);

    const checked = [];
    for (const f of files) {
      const reachable = await isAnonymouslyReachable(f.id);

      if (folder.access === 'members') {
        if (reachable === true) {
          leaks.push(`${folder.title} / ${f.name} — publicly readable, must be Restricted`);
          continue; // never publish a leaking members file
        }
        if (reachable === null) {
          leaks.push(`${folder.title} / ${f.name} — could not verify; failing closed`);
          continue;
        }
      } else if (reachable === false) {
        warnings.push(`${folder.title} / ${f.name} — marked public but not anonymously reachable; link will 404 for visitors`);
      }

      checked.push({
        id: f.id,
        title: f.name.replace(/\.[a-z0-9]+$/i, ''),
        kind: kindOf(f.mimeType, f.name),
        access: folder.access,
        // Per-file link, never a folder link. Members files stay draped
        // (url: "") until GATED is flipped after the folders are restricted.
        url: folder.access === 'members' && !GATED ? '' : fileUrl(f.id),
        modified: f.modifiedTime,
      });
    }

    if (folder.kind === 'minutes') {
      // Concatenate across all kind:'minutes' folders, each keeping its own
      // per-file access flag. minutesJoined.js sorts newest-first at build time.
      minutesFiles.push(...checked);
    } else {
      library.push({ title: folder.title, blurb: folder.blurb, items: checked });
    }
  }

  if (leaks.length) {
    console.error('\n✖ PUBLISH BLOCKED — members-only files are exposed:\n');
    leaks.forEach(l => console.error('  • ' + l));
    console.error('\nIn Drive: Share → General access → Restricted, then add the PFS Members group as Viewer.');
    console.error('Nothing was written.\n');
    process.exit(1);
  }

  warnings.forEach(w => console.warn('⚠ ' + w));

  const write = (name, data) => {
    const file = path.join(DATA_DIR, name);
    const next = JSON.stringify(data, null, 2) + '\n';
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === next) {
      console.log(`unchanged: ${name}`);
      return false;
    }
    fs.writeFileSync(file, next);
    console.log(`updated:   ${name}`);
    return true;
  };

  write('library.json', library);
  write('minutes_files.json', minutesFiles);

  // Nudge: files with no synopsis yet (human-owned, joined by id)
  const humanPath = path.join(DATA_DIR, 'minutes.json');
  if (fs.existsSync(humanPath)) {
    const human = JSON.parse(fs.readFileSync(humanPath, 'utf8'));
    const haveSynopsis = new Set((human.minutes || human).map(m => m.id));
    const missing = minutesFiles.filter(m => !haveSynopsis.has(m.id));
    if (missing.length) {
      console.log(`\n${missing.length} minutes file(s) have no synopsis yet:`);
      missing.forEach(m => console.log('  • ' + m.title));
      console.log('Add a synopsis in the CMS under Agendas & Minutes.');
    }
  }

  console.log('\n✔ Drive sync complete.');
})().catch(err => { console.error(err.message || err); process.exit(1); });
