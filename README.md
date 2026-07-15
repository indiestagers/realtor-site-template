# Realtor Site Template

A config-driven, **zero-build** static website template for real-estate agents and
boutique brokerages. Pure HTML/CSS/JS — no framework, no dependencies — so it
deploys to GitHub Pages, Netlify, or any static host by copying files.

Originally derived from a hand-built brokerage site, then generalized: every
brand-, person-, and listing-specific value lives in **one JSON file**, and a
small Python script renders a finished site from it.

## Make a site in two steps

```bash
cp site.config.example.json site.config.json   # then edit it for your realtor
python3 build.py --out dist                     # renders the finished site into ./dist/
```

Open `dist/index.html` (or serve it: `python3 -m http.server -d dist 8080`).

- `--out <dir>` renders into a directory (default `./dist`).
- `--inplace` renders the template files in place — use on a throwaway copy.

`build.py` fills the scalar tokens (name, phones, brand colors, …) **and generates**
the repeating sections from config arrays: team cards, listings seed (`js/data.js`),
contact rows, community tiles, hero stats, the area marquee, and social links.
Leave a field out and it falls back to a sensible default, so a partial config
still builds. It prints any unfilled tokens at the end.

## What's in `site.config.json`

| Key | Drives |
|---|---|
| `site_name`, `legal_name`, `tagline`, `meta_description` | titles, headers, footer, SEO |
| `region_short`, `office_line`, `office_location` | location copy throughout |
| `primary_phone`/`_tel`, `office_phone`/`_tel`, `primary_email` | nav, contact, footer |
| `brand` (`ink`, `cream`, `brand`, `brand_light`, `brand_dark`, `gold`, `navy`) | CSS color tokens + favicon |
| `hero` (`eyebrow`, `h1`, `sub`, `stats[]`) | hero section |
| `team[]` (`name`, `role`, `bio`, `phone`/`_tel`, `email`) | team grid + contact rows + footer |
| `listings[]` | the seed in `js/data.js` (status/address/price/beds/…) |
| `areas[]`, `community[]`, `socials[]` | marquee, neighborhood tiles, social links |
| `admin_passcode` | the back-office gate |
| `agent_tagline`, `agent_bubble_text` | optional overrides for the "Ramon" voice widget's on-page copy (see below) |
| `hero.before_image`, `hero.after_image` | optional overrides for the "empty room becomes home" hero photos (see below) |

See `site.config.example.json` for a complete, working example.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Hero, services, featured listings, sold showcase, team, community, contact |
| `listings.html` | Full portfolio with For-sale / Pending / Sold filters + price sort |
| `admin.html` | Passcode-gated back office to add/edit/feature listings (localStorage demo) |

## Hero: "an empty room becomes home"

The homepage hero is a scroll-driven wipe between two stacked photos of the
*same room* — one empty, one with people in it — with a glowing seam line that
tracks scroll progress (`hrInitHeroStage()` in `js/main.js`). It's sticky-pinned
(`.hero-stage` / `.hero--story`) so the wipe plays out over ~240px of extra
scroll before the page continues normally.

Defaults ship as local assets, `assets/img/hero/room-empty.png` /
`room-lived-in.png` — the original photo pair this effect was built around.
Override per realtor with `hero.before_image` / `hero.after_image` in
`site.config.json` if a matched before/after pair is scrapeable (a mismatched
pair — two different rooms — won't read as the same narrative, so leave the
defaults if you don't have a real matched pair).

Mobile (`<640px`) switches the photos to a letterboxed `object-fit: contain`
block near the top instead of full-bleed, so the wipe stays legible above the
folded text. `prefers-reduced-motion` skips the scroll listener entirely and
shows the "after" photo immediately via a CSS fallback — no motion, no story.

## "Ramon" — the voice AI concierge widget

Every built site ships with a floating voice-agent widget (`js/agent.js` +
`js/agent-config.js` + `css/agent.css`) powered by [Vapi](https://vapi.ai). It's
**one shared assistant reused across every site** — same `vapiPublicKey` +
`vapiAssistantId` on every build, hardcoded in `js/agent-config.js` (not part of
`site.config.json`, since it never changes per realtor). Only the on-page copy
adapts per site:

- the header tagline ("Your **{site_name}** concierge") — override with `agent_tagline`
- the greeting bubble text — override with `agent_bubble_text`
- the intro line's booking mention (auto-adapts to the team via `team_first_names`)
- the "line dropped, call us" fallback phone number (from `primary_phone`)
- the panel footer brand name (from `site_name`)

Ramon's own identity — avatar illustration, name, green/gold halo, panel accent
colors — stays constant by design; the surrounding chrome (`--ink`, `--cream`,
`--green-2`, etc.) still inherits each site's brand palette via the same CSS
custom properties the rest of the design uses. To rotate the Vapi key/assistant
or change the agent's name globally, edit `js/agent-config.js` directly — it's a
one-time change that applies to every future build.

## Design system

Fraunces (display) + Inter (body); warm, editorial palette driven by CSS tokens
at the top of `css/style.css`; scroll-reveal animations that respect
`prefers-reduced-motion`; WCAG-minded contrast, focus states, and 44px+ touch
targets.

## Notes

- Section/community imagery uses Unsplash placeholders — swap in the brokerage's
  own photography before launch (replace the URLs in the config). The hero's
  before/after photos are local assets, not Unsplash — see above.
- The contact form and admin panel are **front-end demos** (no backend). The
  admin persists to `localStorage`; wire the form to Formspree/Netlify Forms and
  swap the data layer for Supabase for production. The data shape is already
  Supabase-ready.
- Add a `logo.png` to `assets/img/` (the template ships without one so it stays
  brand-neutral; the header falls back to text if missing).
