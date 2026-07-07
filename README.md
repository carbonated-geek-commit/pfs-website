# Peninsula Fermentation Society — Website

Static site for [peninsulafermentation.org](https://www.peninsulafermentation.org), built with [Eleventy](https://www.11ty.dev/) from the design in `design_handoff_pfs_website/`. One responsive site: desktop and mobile are breakpoints of the same pages.

## Local development

```bash
npm install
npm start        # dev server at http://localhost:8080
npm run build    # output to _site/
```

## Editing content (no code required)

All club content lives in JSON files under `src/_data/`:

| File | What it controls |
|---|---|
| `meetings.json` | Meeting schedule. Add a month with its ISO `date`, education topic, style, and challenge. Past/Next/Upcoming states are computed automatically at build time (the deploy workflow also rebuilds weekly so they roll over). The `.ics` calendar feed is generated from this too. |
| `minutes.json` | Agendas & Minutes list with per-month synopses. Set each item's `url` to the gated file link. |
| `library.json` | The three library collections (Forms & Training Aids, Member Recipes, Presentations). `kind` is `PDF`, `DOC`, or `PPT`; set `url` to the gated file link. **Currently sample data.** |
| `committee.json` | Executive committee roles, names, and photo paths. **Names are placeholders.** |
| `site.json` | Venue/meeting details, venue-move banner (`venueBanner.show`), GA4 id (`analyticsId`), member sign-in URL, social/community links, home photo-band images. |

Photos: drop files into `src/assets/img/` and reference them from `site.json` (`photos`) and `committee.json`.

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`. To use the custom domain, add `src/CNAME` containing `www.peninsulafermentation.org`, configure the domain in the repo's Pages settings, and point DNS at GitHub Pages.

## Launch checklist (from the design handoff)

- [ ] **GA4**: create the property and put its `G-…` id in `src/_data/site.json` → `analyticsId`. The delegated `data-analytics` click handler is already wired (see `src/assets/js/main.js`). Mark `hero_join_click`, `nav_join_click`, `contact_email_click`, and `newsletter_signup` as key events in GA4.
- [ ] **Newsletter backend**: the welcome popover form currently only confirms locally. Point it at Mailchimp/Buttondown/etc. in `src/assets/js/main.js` (see TODO).
- [ ] **Member auth + gated files**: restrict the Drive folders to the members Google Group, then set file `url`s in `minutes.json` / `library.json` and `memberSignInUrl` in `site.json`. **No public Drive folder links anywhere.**
- [ ] **Real content**: committee names/photos, meeting photos for the home photo band, real library file lists.
- [ ] **2025 competition results**: currently links to the old site page; migrate the results content into `/competitions/` when available.
- [ ] **By-Laws text**: `src/by-laws.md` was migrated from the current site via automated extraction — have the Secretary proofread it against the official ratified document before launch.
- [ ] **Minutes auto-synopsis flow**: when publishing minutes each month, generate a 2–3 line synopsis (LLM summarization) and add it to `minutes.json`.
- [ ] **Redirects**: once DNS moves, map old Google Sites URLs where possible (see the migration table in `design_handoff_pfs_website/README.md`).
- [ ] **DNS**: point `peninsulafermentation.org` at GitHub Pages.
