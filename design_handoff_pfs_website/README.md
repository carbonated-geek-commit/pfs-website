# Handoff: Peninsula Fermentation Society — Website Redesign

## Overview
Full redesign of https://www.peninsulafermentation.org/ (currently a Google Sites page) for a homebrew/fermentation club in Silverdale, WA. Goals: consolidate scattered information under a logical IA, unify typography with the brand seal, close the open-Google-Drive-links security/metadata leak, reduce excess whitespace, add a footer site tree, and bake in analytics from day one.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior, not production code to copy directly. Your task is to **recreate these designs as a real website**. No existing codebase or framework is in place: choose the most appropriate stack for a small club site — a static site generator (Astro, Eleventy, Hugo) or plain HTML/CSS deployed to GitHub Pages / Netlify / Cloudflare Pages is recommended. Content (meeting programs, minutes, resources) should be editable by non-developers — favor markdown/JSON content files or a simple CMS.

- `PFS Redesign.dc.html` — desktop design, all pages (in-file navigation simulates the multi-page site)
- `PFS Mobile.dc.html` — mobile design (390px), single-page hybrid layout
- `assets/pfs-seal.png` — brand seal (1024×1024, transparent PNG)
- `image-slot.js` — prototype-only helper (drag-drop image placeholders); do NOT ship — replace slots with real photos

Note on the prototype format: each `.dc.html` contains the markup between `<x-dc>` tags (all styles inline) and a `<script data-dc-script>` logic class whose `renderVals()` holds the page data (schedules, library items, analytics event map). Read both to extract exact values.

**Production must be ONE responsive site** — the two files show the desktop and mobile expressions of the same design.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final unless noted. Recreate pixel-faithfully. Sample-data areas are flagged below.

## Information Architecture (new nav)
Top nav: Home · About · Meetings & Events · Competitions · Resources, plus an amber **Join Us** button (→ /join).

Migration from the current site (also rendered in the prototype's "Site & Data Map" screen, reachable from the footer's dashed "Site & Data Map (internal)" link):

| Current | New | Access |
|---|---|---|
| /home | / (Home) | Public |
| /home/executive-committee | /about#committee | Public |
| /by-laws | About › By-Laws (keep as own page /by-laws) | Public |
| /code-of-conduct | About › Code of Conduct (/code-of-conduct) | Public |
| /calendar (Google Calendar iframe) | /meetings — schedule + published `.ics` subscribe link | Public |
| Drive › Agendas and Minutes | /meetings#minutes | **Members** |
| /competitions | /competitions | Public |
| /competitions/results-2025-… | /competitions#results-2025 | Public |
| Drive › Forms and Training Aids | /resources (Forms & Training Aids) | **Members** |
| Drive › Member Recipes | /resources (Member Recipes) | **Members** |
| Drive › Presentations | /resources (Presentations) | **Members** |
| /contact-us | /join | Public |
| "Links" nav dropdown | Footer › Community column | Public |

**Security requirement:** no public Google Drive folder links anywhere. Files are gated behind member sign-in (simplest: Google Group–restricted Drive shares; the site links to files that require sign-in). Old Drive URLs should not be republished.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| ink | `#23241A` | Headings, dark buttons, text on amber |
| body text | `#34352A` (base), `#4A4B3C` (lede), `#55564A` (secondary), `#6A6B55` / `#8A8B72` (muted) | |
| cream (page bg) | `#F7F1E3` | Default background |
| cream deep | `#EFE6D0` | Alternate section bg, page headers |
| cream row | `#EFE7D2` | Table dividers, chips, past-meeting card |
| panel | `#FFFDF6` | Cards, table bodies |
| border | `#E3D8BC` (cards), `#DED3B8` (inputs/chips) | |
| forest (nav) | `#3C4A2E` | Sticky header |
| forest deep | `#333F27` | Dark bands, dark cards, table headers |
| forest row | `#3F4D2F` | Rows/cards inside dark bands |
| forest footer | `#2C3721` | Footer |
| amber | `#C08A34` (hover `#D49C44`) | Primary CTAs, venue banner, active-nav underline |
| amber dark | `#9A6D24` (hover `#7C561B`) | Links, eyebrows |
| amber light | `#C9A15C` / `#E4C98F` | Eyebrows/labels on dark, link color on dark |
| cream text on dark | `#F3ECD9` (primary), `#C9C4AC` (secondary) | |
| slate | `#4E6B7A` | Members-only banner/chips, PDF chips, step 2 badge |
| hop green | `#55703B` | Step 1 badge, DOC chips, success text |
| brick red | `#A93B2E` | Step 3 badge, PPT chips |

Default link CSS: `a { color:#9A6D24; text-decoration-color:#D9BD86 }`, hover `#7C561B`. Selection bg `#E4C98F`.

### Typography
Google Fonts: **Oswald** (400/500/600/700) + **Source Sans 3** (400/600/700 + italic).
- Oswald = display/UI: all headings, eyebrows, buttons, nav — always UPPERCASE. Eyebrows: 500, 13px, letter-spacing 0.24em, color `#9A6D24` (or `#C9A15C` on dark). Buttons: 600, 13–14px, letter-spacing 0.10–0.12em.
- Source Sans 3 = body: 14.5–19px, line-height 1.4–1.6.
- Scale (desktop): H1 48–62px/700, H2 30–40px/700, H3 20–24px/600, lede 18–19px, body 15–17px, meta 13–14px.
- Wordmark lockup (header/footer): seal 52px + two lines — "PENINSULA FERMENTATION" Oswald 600 17px ls 0.04em `#F3ECD9`; "SOCIETY · EST. 2023" Oswald 400 11px ls 0.42em `#C9A15C`.

### Other tokens
Radius: 3px (buttons/chips/inputs), 6px (cards/tables), 8px (modal), 50% (badges/avatars). Content max-width 1200px, side padding 24px. Section vertical padding: page headers 40/32px, sections 32–48px top, 64–80px bottom (home hero 80/72px). Card padding 24–32px. Shadows: modal `0 24px 64px rgba(35,36,26,0.4)`; card hover `0 4px 16px rgba(35,36,26,0.08)`; highlighted schedule row `0 6px 20px rgba(44,55,33,0.3)`.

## Screens / Views (desktop — `PFS Redesign.dc.html`)

### Global chrome (all pages)
- **Sticky nav**, bg `#3C4A2E`: seal+wordmark (links home), right-aligned nav links (Oswald 500 13.5px ls 0.1em; inactive `#D8D2BC`, active `#E4C98F` with 2px `#C08A34` underline, hover `#E4C98F`), amber "Join Us" button.
- **Venue banner** under nav (site-wide, dismissible in CMS): amber bg, ink text, centered: "Starting October 6, 2026, monthly meetings move to Rainy Daze Brewing." (Rainy Daze links to rainydazebrewing.com; deliberately NO map link — multiple locations.)
- **Footer**, bg `#2C3721`: 5 columns — seal + one-line mission; About (Mission, Executive Committee, By-Laws, Code of Conduct); Meetings (2026 Schedule, Agendas & Minutes, Visit a Meeting); Competitions (All-American HBC, 2025 Results) + Resources (Forms & Training Aids, Member Recipes, Presentations); Community (AHA, WA Homebrew Assoc., BJCP, Moment Brewing, Olympic Homebrew Supply — external). Bottom bar: © 2026, email, Facebook, Instagram. (The dashed "Site & Data Map (internal)" link is a prototype artifact — this doc replaces it; don't ship.)

### Home (/)
1. **Hero** (grid 1.15fr/0.85fr): eyebrow "A HOMEBREW & FERMENTATION CLUB"; H1 62px "The craft & science of fermentation, shared."; mission paragraph; meta row "First Tuesday, monthly ◆ 6:30 – 8:30 PM ◆ Moment Brewing" (◆ in `#C9A15C`) with address line "10876 Myhre Pl NW, Suite 112, Silverdale, WA · Get directions →" (Google Maps link); CTAs: dark "Become a Member" (mailto:info@peninsulafermentation.org) + outlined "See the Calendar" (→ /meetings). Right: seal at 380px on a subtle radial cream circle, drop-shadow.
2. **Next Meeting band** (bg `#333F27`): left — eyebrow "NEXT MEETING", H2 40px date ("Tuesday, July 7"), location card (bg `#3F4D2F`: time + "Moment Brewing · 10876 Myhre Pl NW, Silverdale" + amber "Map →" button), outlined "Full Schedule" button. Right — 3 program rows (bg `#3F4D2F`, 180px label column): Education / Style Discussion / Brew Challenge. Style names link to bjcp.org (on dark, links are `#E4C98F`).
3. **Learn. Taste. Brew.** — eyebrow "EVERY MEETING", 3 cards each with numbered circle badge (1 green, 2 slate, 3 red), title (Educational Topic / Style Discussion / Ferment-to-Style), short description.
4. **Photo band** (bg `#EFE6D0`): two 340px photos side by side (club supplies real photos; prototype uses drop slots).
5. **Teaser cards** (2-up, clickable, hover border `#C9A15C` + shadow): Competitions → /competitions; Member Resources → /resources. Each: eyebrow, title, one-liner, "Explore →".

### About (/about)
Page header (bg `#EFE6D0`, tight): eyebrow "ABOUT", H1 "The Society", founding/mission paragraph. Then **Executive Committee**: 4 cards (photo circle 108px, role in Oswald caps, name) — roles/names are PLACEHOLDERS; get real ones from the club. Then two dark cards (bg `#333F27`, hover `#3F4D2F`): By-Laws and Code of Conduct, eyebrow "GOVERNANCE", linking to the respective pages (migrate text content from current site).

### Meetings & Events (/meetings)
Header: eyebrow, H1 "2026 Schedule", meta line with venue links. **Schedule rows** (one per month): 150px date column (date 26px + status tag) + 3 program columns (Education / Style Discussion / Ferment-to-Style). Row states — past: bg `#EFE7D2`, 80% opacity, gray tag; next: bg `#333F27` cream text, amber "Next meeting" tag, shadow; upcoming: bg `#FFFDF6` + border, cream tag. Data for Jun 2 / Jul 7 / Aug 4 2026 is real (in `renderVals()`); extend as the club publishes. **Agendas & Minutes**: intro "Each month's minutes get an auto-generated synopsis so you can catch up at a glance."; table (bg `#FFFDF6`): rows = slate PDF chip, month (16px/700) + "Agenda & Minutes" label, **2–3 line synopsis** (14.5px `#55564A`), "Download ↓" link. June 2026 synopsis is representative; May/April are placeholders. Synopses are auto-generated when minutes are uploaded (LLM summarization step in the publishing flow — topics covered, styles tasted, challenge results, votes/announcements). Members-only section. Add a published read-only calendar + `.ics` subscribe link (replaces the current embedded personal Google Calendar iframe).

### Competitions (/competitions)
Header: H1 "Put your brew to the test". Grid 1.2fr/0.8fr: dark card (bg `#333F27`) — eyebrow "OUR FLAGSHIP EVENT", H2 "All-American Homebrew Competition", description, amber "Enter the Competition" → https://pfsamericanhbc.brewingcompetitions.com/ (external). Light card: "2025 All-American HBC" results (migrate results content from current site; prototype links to the old page).

### Resources (/resources)
Header: H1 "The Library" + intro. **Members-only banner** (bg `#4E6B7A`): "MEMBERS ONLY" chip, "Downloads require a member sign-in — file links are no longer public, and folder metadata stays private.", cream "Member Sign-In" button. Then 3 collection cards (dark header bg `#333F27` with title + blurb; file rows: type chip [PDF slate / DOC green / PPT red, monospace 10px], filename, ↓ link): Forms & Training Aids, Member Recipes, Presentations. **All file items are SAMPLE data** — wire to the real gated document store.

### Join / Contact (/join)
Full dark section (bg `#333F27`): eyebrow "JOIN THE SOCIETY", H1 54px "Come ferment with us.", paragraph, amber mailto button labeled "info@peninsulafermentation.org", Facebook/Instagram links; seal at 320px on the right.

### Welcome popover (first visit, all pages)
Overlay `rgba(35,36,26,0.55)`; card `#FFFDF6`, 500px, radius 8, centered, shadow. Contents: × close (top-right), seal 96px, H2 "Stay in the loop", copy "Get the monthly meeting program, competition announcements, and club news — one email a month, no spam.", email input (bg `#F7F1E3`, border `#DED3B8`, focus border `#C08A34`) + amber "Sign Up"; divider "OR"; two half-width buttons — dark "Join the Society" (→ /join) and outlined "Member Sign-In" (→ sign-in); "Maybe later" text link.
Behavior: appears ~900ms after load on first visit only; ANY action (sign-up, join, sign-in, ×, maybe-later) sets `localStorage['pfs-welcome-dismissed']='1'` and it never auto-shows again. On valid email submit (regex `.+@.+\..+`): swap form for success box "Thanks — you're on the list!" (bg `#EFE7D2`, green text), auto-close after 1.4s. **Needs a real newsletter backend** (Mailchimp/Buttondown/etc.).

## Mobile (`PFS Mobile.dc.html`, 390px design width)
Production = responsive breakpoint of the same site, hybrid single-page home: compact sticky header (seal 40px, smaller lockup, hamburger 44×44 that animates to ×) → slide-down menu (bg `#333F27`; anchors: Next Meeting, 2026 Schedule, About the Society, Member Resources, Competitions, Join / Contact; amber Join Us) with smooth-scroll offset ~62px; condensed venue banner; centered hero (seal 220px, H1 34px, stacked full-width CTAs, location card with amber "Map →"); next-meeting section with location card + stacked program rows; schedule as stacked cards (same three states); Learn/Taste/Brew as horizontal icon rows; Library as **accordion** (dark headers, chevron rotates 180°, one collection open at a time, first open by default); competitions dark section with stacked CTAs; join section; 2-column footer. All tap targets ≥44px. For deep pages (About, full Resources) on mobile, the hamburger routes to pages styled like these sections.

## Interactions & Behavior
- Nav: active page indicated by amber underline + lighter text. Sticky top.
- Card hovers: border → `#C9A15C` + soft shadow. Button hovers per token table. Transitions ~0.2s.
- All internal navigation scrolls to top; external links open in new tab.
- Maps links: `https://www.google.com/maps/search/?api=1&query=Moment+Brewing+10876+Myhre+Pl+NW+Suite+112+Silverdale+WA+98383`.
- Member sign-in: prototype only routes to the library — implement real auth (Google sign-in checked against the members Google Group is the low-maintenance option).

## Analytics (GA4)
One GA4 property, gtag in `<head>`, IP anonymization on, no ads features. `page_view` auto per page. Custom events are wired via `data-analytics` attributes already present on elements in both prototypes — bind one delegated click listener that reads the attribute and fires the event.

| Event | Trigger | Params | Answers |
|---|---|---|---|
| `nav_join_click` | Header "Join Us" | page | Which pages drive joins |
| `hero_join_click` | "Become a Member" (home hero) | location: hero | Homepage conversion |
| `contact_email_click` | Email CTA on /join | — | Join funnel completion |
| `hero_calendar_click` | "See the Calendar" | — | Interest in meetings |
| `directions_click` | Maps links | venue | Planned attendance |
| `minutes_download` | Minutes downloads | file_name, month | Which records get read |
| `resource_download` | Library downloads | collection, file_name | Most valuable resources |
| `member_signin_click` | Library gate sign-in | — | Gate friction |
| `competition_enter_click` | Competition entry (outbound) | link_url | Competition reach |
| `outbound_click` | Footer community links, socials | link_url | Referral value |
| `newsletter_signup` | Popover email submit | — | List growth |
| `popover_join_click` / `popover_signin_click` | Popover buttons | — | Popover effectiveness |

Mark `hero_join_click`/`nav_join_click`, `contact_email_click`, and `newsletter_signup` as GA4 key events.

## State Management
Minimal: welcome-popover dismissed flag (localStorage), mobile menu open, accordion open-collection, newsletter form (email, submitted). Content (schedule, minutes+synopses, library files, committee) from content files/CMS. Auth session for members area.

## Assets
- `assets/pfs-seal.png` — the club's existing seal (only brand asset). Used at 52/40px (header), 96px (popover), 220–380px (heroes), 64–88px (footer). Favicon + og:image should derive from it.
- Photos: none included — the club supplies meeting/competition photos for the home photo band.
- No icon library needed: chips are text, arrows are typed characters (→ ↓ ▾ ◆ ×).

## Files
- `PFS Redesign.dc.html` — desktop, all screens + welcome popover + Site & Data Map reference screen
- `PFS Mobile.dc.html` — mobile single-page hybrid
- `assets/pfs-seal.png` — brand seal
- `image-slot.js` — prototype helper, do not ship

## Implementation checklist (beyond the UI)
1. Static site + hosting (GitHub Pages/Netlify/Cloudflare), DNS for peninsulafermentation.org
2. Newsletter backend for the popover form
3. Member auth + gated file delivery (Google Group–restricted Drive is fine); remove all public Drive links
4. Published club calendar + `.ics` subscribe link
5. Minutes publishing flow with auto-synopsis (LLM summary) per month
6. GA4 property + delegated `data-analytics` click handler
7. Redirects from old site URLs where possible
8. Real content: committee names/photos, By-Laws & Code of Conduct text, 2025 competition results, actual library files
