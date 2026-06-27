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

See `site.config.example.json` for a complete, working example.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Hero, services, featured listings, sold showcase, team, community, contact |
| `listings.html` | Full portfolio with For-sale / Pending / Sold filters + price sort |
| `admin.html` | Passcode-gated back office to add/edit/feature listings (localStorage demo) |

## Design system

Fraunces (display) + Inter (body); warm, editorial palette driven by CSS tokens
at the top of `css/style.css`; scroll-reveal animations that respect
`prefers-reduced-motion`; WCAG-minded contrast, focus states, and 44px+ touch
targets.

## Notes

- Hero/section/community imagery uses Unsplash placeholders — swap in the
  brokerage's own photography before launch (replace the URLs in the config and
  the few hero `<img>` tags in `index.html`).
- The contact form and admin panel are **front-end demos** (no backend). The
  admin persists to `localStorage`; wire the form to Formspree/Netlify Forms and
  swap the data layer for Supabase for production. The data shape is already
  Supabase-ready.
- Add a `logo.png` to `assets/img/` (the template ships without one so it stays
  brand-neutral; the header falls back to text if missing).
