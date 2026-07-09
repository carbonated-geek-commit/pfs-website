# Peninsula Fermentation Society Website — Project Brief

Portable context document. Everything needed to answer questions about this project without access to the original conversation.

## What this is

A full redesign of https://www.peninsulafermentation.org/ (currently a Google Sites page) for a homebrew/fermentation club in Silverdale, WA. Built as a responsive static site from a high-fidelity design handoff (`design_handoff_pfs_website/` in the repo — its README.md is the authoritative design spec, with two HTML prototypes: desktop and 390px mobile).

- **Live site:** https://carbonated-geek-commit.github.io/pfs-website/
- **Mobile preview (for desktop viewers):** https://carbonated-geek-commit.github.io/pfs-website/mobile/ — renders the site in a 390px phone frame; redirects to the regular site on actual mobile-size screens
- **Repo:** https://github.com/carbonated-geek-commit/pfs-website (public, `main` branch)
- **Local path:** `C:\Users\corba\Documents\PFS-Website`
- **Eventual domain:** peninsulafermentation.org (DNS not yet moved)

## Stack

- **Eleventy 3** (Nunjucks templates), plain hand-written CSS and vanilla JS — no framework, no icon library (arrows/symbols are typed characters: → ↓ ▾ ◆ ×)
- **GitHub Pages** via Actions (`.github/workflows/deploy.yml`): deploys on push to `main`, plus a **weekly Monday cron rebuild** so schedule statuses roll over without content pushes
- **Path prefix:** served from `/pfs-website/` on github.io. `HtmlBasePlugin` rewrites all internal URLs; CI sets `PATH_PREFIX=/<repo>/` unless `src/CNAME` exists (custom domain → prefix becomes `/`)
- Local dev: `npm install`, `npm start` (port 8080), `npm run build` → `_site/`

## Repo structure

```
eleventy.config.js        # input src/, output _site/, HtmlBasePlugin, filters: slugSafe, icsText
.github/workflows/deploy.yml
design_handoff_pfs_website/   # design spec + prototypes (reference only, not shipped)
src/
  _data/
    site.json             # venue/meeting info, banner toggle, GA4 id, sign-in URL, socials, photos
    meetings.json         # schedule content (editable by non-devs)
    schedule.js           # computes past/next/upcoming from meetings.json at BUILD TIME
    minutes.json          # agendas & minutes with per-month synopses
    library.json          # 3 library collections (sample data, urls are "#")
    committee.json        # exec committee (names are "Add name" placeholders)
    merch.json            # 4 products (photos pending)
  _includes/layouts/base.njk
  _includes/partials/{header,footer,popover}.njk
  assets/css/main.css     # entire design system, ~1300 lines
  assets/js/main.js       # menu, accordion, popover, delegated analytics
  assets/img/             # pfs-seal.png (1024 original), seal-192, seal-800, merch/ (empty)
  index.njk about.njk meetings.njk competitions.njk resources.njk join.njk merch.njk
  by-laws.md code-of-conduct.md 404.njk calendar.njk (→ /calendar.ics) mobile.njk (→ /mobile/)
```

## Pages / IA

Top nav: Home · About · Meetings & Events · Competitions · Resources · Merch + amber **Join Us** button (→ /join/).

| Route | Notes |
|---|---|
| `/` | Hero, next-meeting band (from computed schedule), Learn/Taste/Brew cards, photo band (placeholders), teaser cards |
| `/about/` | Mission, committee grid (placeholder names/photos), dark governance cards → by-laws & code of conduct |
| `/meetings/` | Schedule rows with past/next/upcoming states, `.ics` subscribe link, Agendas & Minutes table with synopses |
| `/competitions/` | Flagship dark card → entry site (external), 2025 results card → **old site page** (results content not yet migrated; anchor `#results-2025` reserved) |
| `/resources/` | "The Library": members-only banner, 3 collection cards; **accordion on mobile** (one open at a time) |
| `/join/` | Dark full-bleed section, mailto CTA, socials |
| `/merch/` | 4 products from merch.json, "Photo coming soon" placeholders, mail-order CTA |
| `/by-laws/`, `/code-of-conduct/` | Real text migrated from the old site (by-laws via automated extraction — **needs proofread before launch**) |
| `/calendar.ics` | Generated VCALENDAR from meetings.json (America/Los_Angeles VTIMEZONE, RFC 5545 escaping via `icsText` filter) |
| `/mobile/` | Phone-frame preview page, `noindex`, not in nav |

Footer = 5-column site tree (About / Meetings / Competitions+Resources+Shop / Community) + bottom bar (©, email, socials). 2-column on mobile.

## Design system (from the handoff spec)

- **Fonts:** Oswald (display/UI, always UPPERCASE) + Source Sans 3 (body), via Google Fonts
- **Key colors (CSS custom props in main.css):** ink `#23241A`, cream bg `#F7F1E3`, cream-deep `#EFE6D0`, panel `#FFFDF6`, forest nav `#3C4A2E`, forest deep `#333F27`, footer `#2C3721`, amber `#C08A34` (hover `#D49C44`), amber-dark links `#9A6D24`, slate `#4E6B7A` (members/PDF), hop green `#55703B` (DOC), brick `#A93B2E` (PPT)
- **Radii:** 3px buttons/chips, 6px cards, 8px modal. Content max-width 1200px
- **Single breakpoint at 900px** switches to the mobile design (hamburger→× menu, condensed venue banner, centered hero with location card, stacked schedule cards, format cards as horizontal rows, library accordion). Extra tweaks at 420px and 320px
- Deliberate choice per spec: venue banner has **no map link** (venue has multiple locations)

## Behaviors

- **Schedule statuses are computed at build time** (`schedule.js`, Pacific timezone): dates before today = past, first ≥ today = next, rest = upcoming. Homepage next-meeting band and the .ics feed derive from the same data. Weekly CI cron keeps it fresh
- **Welcome popover** (all pages): appears 900ms after load on first visit; any action sets `localStorage['pfs-welcome-dismissed']='1'`; email regex `.+@.+\..+`; success box then auto-close 1.4s. **No newsletter backend yet — submit only confirms locally** (TODO in main.js)
- **Analytics:** GA4 loads only if `site.json → analyticsId` is set (currently empty). One delegated click listener reads `data-analytics` attributes; extra `data-*` attrs become snake_case event params; outbound links get `link_url`. Events: nav_join_click, hero_join_click, hero_calendar_click, contact_email_click, directions_click, minutes_download, resource_download, member_signin_click, competition_enter_click, outbound_click, newsletter_signup, popover_join_click, popover_signin_click, merch_order_click. Key events to mark in GA4: hero_join_click, nav_join_click, contact_email_click, newsletter_signup
- **Members-only gating is UI-only so far:** sign-in button falls back to a mailto; file `url`s in minutes.json/library.json are `"#"`. Plan per spec: Google Group–restricted Drive shares; **no public Drive links anywhere** (this was a security/metadata-leak requirement)

## Known issues / recent fixes

- Fixed: horizontal overflow below ~285px (format cards, fixed-width hero halo, nowrap buttons, unbreakable email-address buttons — now wrap/ellipsize; verified zero overflow at 240–1280px on all pages)
- Fixed: hamburger overlapped header wordmark below ~285px (lockup now truncates with ellipsis)
- Untracked local files (intentionally not committed): `header-fixed.png`, `merch-preview-desktop.png`, `merch-preview-mobile.png` (review screenshots), the original design zip, root copies of the prototype HTML files

## Outstanding launch checklist

1. GA4 property → set `analyticsId` in site.json; mark key events
2. Newsletter backend (Mailchimp/Buttondown) for the popover form
3. Member auth + gated file delivery; set real `url`s in minutes.json/library.json and `memberSignInUrl`
4. Real content: committee names/photos, home photo band images, merch product photos (`src/assets/img/merch/`, filenames documented there), real library file lists
5. Migrate 2025 competition results content into /competitions/ (currently links to old site)
6. Proofread by-laws.md against the ratified document (auto-extracted)
7. Minutes publishing flow: add 2–3 line synopsis per month (spec suggests LLM summarization)
8. Custom domain: add `src/CNAME` with the domain, configure Pages settings, point DNS; set up redirects from old Google Sites URLs where possible
9. © year in site.json (`copyrightYear`) is static "2026"

## Conventions

- Content edits happen in `src/_data/*.json` — designed so non-developers can edit
- Commits are authored as Corban Caudle with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- The design handoff README is the source of truth for visuals; where the two prototypes disagreed, the README note won
