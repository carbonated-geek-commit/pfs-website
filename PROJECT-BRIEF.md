# Peninsula Fermentation Society Website — Project Brief

Portable context document. Someone with no prior context should be able to pick up the project from this file alone. Last refreshed: July 2026.

## What this is

The redesigned website for the Peninsula Fermentation Society, a homebrew/fermentation club in Silverdale, WA — replacing a Google Sites page that leaked members-only Drive folder metadata. Built from a high-fidelity design handoff (`design_handoff_pfs_website/` — its README is the visual spec; two HTML prototypes cover desktop and 390px mobile).

- **Live site:** https://carbonated-geek-commit.github.io/pfs-website/
- **Admin (CMS):** https://carbonated-geek-commit.github.io/pfs-website/admin/
- **Mobile preview for desktop viewers:** `/mobile/` (phone-frame iframe; redirects to the real site on small screens)
- **Repo:** https://github.com/carbonated-geek-commit/pfs-website (`main`; every push deploys)
- **Local path:** `C:\Users\corba\Documents\PFS-Website`
- **Eventual domain:** peninsulafermentation.org (DNS cutover not done; see Path prefix below)

## Stack

- **Eleventy 3** (Nunjucks), hand-written CSS (design tokens as custom properties, single 900px breakpoint), vanilla JS. No frontend framework, no icon fonts (typed characters: → ↓ ▾ ◆ ×).
- **GitHub Pages** via `.github/workflows/deploy.yml`: deploys on push, weekly Monday cron (14:00 UTC) so computed schedule statuses roll over, `workflow_dispatch`, and `workflow_call` (see Sync workflow).
- **Sveltia CMS** at `/admin/` — a static, Git-backed CMS; content lives as JSON in the repo, the CMS is only an editing layer.
- **Google Drive ETL** (`scripts/sync-drive.js`) — Drive is the source of truth for member documents.
- Local dev: `npm install`, `npm start` (port 8080), `npm run build` → `_site/`, `npm run sync:drive` (needs `GDRIVE_SA_KEY` env var).

## Content architecture — who owns what

Everything under `src/_data/`. **Ownership is strict**: machine-owned files must never be hand-edited or CMS-edited.

| File | Owner | Notes |
|---|---|---|
| `meetings.json` | CMS (Meeting Schedule) | Past/Next/Upcoming computed at build time by `schedule.js` (Pacific TZ); also feeds the homepage next-meeting band and `/calendar.ics` |
| `minutes.json` | CMS (Agendas & Minutes) | Human synopses: `[{id, month, synopsis}]` — `id` is a Drive file id picked via a relation dropdown |
| `minutes_files.json` | **Drive sync** | `[{id, title, kind, access, url, modified}]` per minutes document |
| `library.json` | **Drive sync** | Full overwrite each sync; deliberately NOT in the CMS |
| `committee.json` | CMS | Current officers (role emails, vacancies) + past officers by year |
| `merch.json` | CMS | Products; photos pending |
| `site.json` | CMS (Site Settings) | Venue/meeting info, venue-move banner + show/hide toggle (verified working end-to-end), socials, community links, photo band. Three fields are `widget: hidden` — preserved on save, not editable: `analyticsId`, `memberSignInUrl`, `competition.entryUrl` |
| `schedule.js`, `minutesJoined.js` | Neither | Build-time compute. `minutesJoined.js` joins `minutes_files.json` ⟕ `minutes.json` by Drive file id, newest first; `meetings.njk` renders the join (empty state until the first successful sync) |

## The Drive ETL (`scripts/sync-drive.js`)

Enumerates four Drive folders and writes `library.json` + `minutes_files.json`. Service account: `pfs-website-sync@gen-lang-client-0935245991.iam.gserviceaccount.com` (read-only). Key: GitHub secret `GDRIVE_SA_KEY`; locally the same as an env var (the key JSON lives outside the repo; `.gitignore` blocks key-file patterns).

Folder map (ids in the script's `FOLDERS` array): Agendas & Minutes (members), Forms & Training Aids (public), Member Recipes (members), Presentations (public). ⚠️ The public/members split for Forms and Presentations is a **guess, not a club decision** — confirm before flipping GATED.

Two hard rules, enforced in code:
1. **Never emit a folder link** — individual files only (folder links leak metadata; closing that leak is why the redesign exists).
2. **Fail-closed leak probe**: a read-only service account can't read sharing settings, so the script tests ground truth — an unauthenticated fetch of each file. A members file that's anonymously readable **fails the whole run, names the file, and writes nothing**. Same for a folder it can't read: loud error, zero writes, never an emptied collection.

**`GATED` flag** (top of script, currently `false`): while false, members files publish "draped" — listed with `url: ""` so the site shows a *Members · Sign in* row instead of a link. Flip to `true` only after the Drive owner restricts the folders AND a clean verified run; then members files get real per-file links and Drive itself enforces the gate. The probe stays active either way as the second guard.

Current state: the folders are still "anyone with the link," so the sync **correctly fails**, listing 10 exposed members files (7 minutes agendas + 3 recipes).

## Sync workflow + chained deploy

`.github/workflows/sync-content.yml`: runs `npm run sync:drive`, verifies the build, commits `src/_data` changes as "PFS Content Bot". Manual only (`workflow_dispatch`); the weekly `schedule:` block is **commented out** until Drive permissions land — a failing weekly job nobody reads is worse than no job.

**The GITHUB_TOKEN gotcha**: commits pushed with the default `GITHUB_TOKEN` do *not* trigger other workflows (GitHub anti-recursion), so a sync commit would never fire `deploy.yml`'s `on: push` — the JSON would update and the live site never rebuild, which looks exactly like "the sync is broken." Fix: `deploy.yml` has `on: workflow_call:` and the sync chains a `deploy` job (`needs: sync`, gated on a `changed` output, with explicit `pages: write` + `id-token: write` permissions).

## The CMS (Sveltia)

`src/admin/index.html` (exact minimal file — no stylesheet link, no `type="module"`; Sveltia bundles everything) + `src/admin/config.yml` (validated against the official schema at `unpkg.com/@sveltia/cms/schema/sveltia-cms.json`). Eleventy ignores + passthrough-copies `src/admin/`.

- Root-array JSON files use a single list field with **`root: true`** — no wrapper keys were needed.
- File collections write **only configured fields**, so `site.json` etc. are modeled completely (any unconfigured key would be silently dropped on save).
- Minutes synopses use a **relation widget** — officers pick the document by title from a dropdown backed by `minutes_files.json`; the stored value is the Drive file id. Sveltia can't hide or lock collections, so that reference collection sits behind a divider labeled "Drive Files — DO NOT EDIT (auto-synced)".
- **Auth**: GitHub backend via the authorization-code flow through a Cloudflare Worker (sveltia-cms-auth) at `https://sveltia-cms-auth.corban-caudle-mi.workers.dev` (`base_url` in config.yml). Officers need GitHub accounts as repo collaborators (write); CMS commits are attributed to the signed-in user. `ALLOWED_DOMAINS` on the worker must include both hostnames during the transition. Developers can also "Sign In Using Access Token" (PAT) or use the local-repository workflow on localhost.
- Every CMS save pushes to `main` → normal deploy. Governance docs (by-laws, code of conduct) are deliberately repo-only for a review trail. `editorial_workflow` is off.

## Member gating model (site side)

`memberSignInUrl` in site.json (currently `mailto:info@peninsulafermentation.org`) is the target of every *Members · Sign in* affordance: the resources members banner, draped library rows (`file-list.njk` macro — three states: public link / members link / draped), and draped minutes rows. Real per-file links appear only when the sync emits them (post-GATED); the gate itself is Drive permissions, never JavaScript.

## Other functioning pieces

- **GA4** (`G-87NR82BFF4`): one gtag block rendered by the base layout when `analyticsId` is set (never add a second). Delegated `data-analytics` click handler; `newsletter_signup` fires only on real Mailchimp success (popover: no location param; /join/ form: `location: 'join_page'`). Key events to mark in GA4 admin: `newsletter_signup`, `nav_join_click`, `hero_join_click`, `contact_email_click`.
- **Mailchimp** (audience `25ebde4055cd3c9d70aca9f9b` / list `fe171e755e`, US12): classic JSONP `post-json` endpoint (no backend on Pages). Welcome popover (first visit, 900ms, localStorage-dismissed, fails open if storage is blocked) collects first/last/email; `/join/` form adds interest groups (`group[54348]`: 1=Beer 2=Cider 4=Mead 8=Wine) and `MMERGE3` referral, honeypot `b_<user>_<list>`, "already subscribed" treated as soft success. No `<form>` tags — button + JSONP.
- **Cache-busting**: CSS/JS links carry a build-time content hash (`?v=…`) because GitHub Pages' ~10-minute asset cache once served new HTML with a stale stylesheet.
- **`[hidden] { display: none !important; }`** global guard — author `display` rules otherwise beat the attribute (this bit us: success boxes visible on load).
- **Path prefix**: served under `/pfs-website/` via `HtmlBasePlugin` + `PATH_PREFIX` env in CI; flips automatically to `/` when a `src/CNAME` file lands with the custom domain.

## Still pending

1. **Drive permissions**: owner restricts the 4 folders + shares each to the service account (Viewer) → clean `npm run sync:drive` → flip `GATED = true` → verify → uncomment the workflow `schedule:` block. Also confirm the public/members folder mapping with the club, and the `GDRIVE_SA_KEY` GitHub secret must exist for CI runs.
2. **Photos**: committee headshots, homepage photo band, merch product photos (`src/assets/img/merch/`, filenames documented there).
3. **2025 competition winners table** — placeholder card on /competitions/ keeps the `#results-2025` anchor; source page had a redirect issue.
4. **Mailchimp confirmation email delivery** — a live test submission succeeded but no double-opt-in email was observed; check whether double opt-in is enabled for the audience and whether the success copy ("check your email") matches reality.
5. **By-laws Drive file links** (full PDF + 5 appendices) are public file links carried over from the old site — flagged for a gating review.
6. **DNS / custom domain** cutover (manual, out of scope until scheduled).
7. **Accessibility**: nav dropdown keyboard/ARIA work and a site-wide audit (in progress).

## Conventions

- Commits authored as *Corban Caudle* with a `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer; work is committed locally and pushed only on explicit go-ahead.
- Content edits happen in the CMS (or `src/_data/*.json` for developers) — except machine-owned files, which only the sync writes.
- The design handoff README wins over the prototypes where they disagree; changes beyond task text need explicit approval.
