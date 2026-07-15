#!/usr/bin/env python3
"""
build.py — Render a finished realtor site from this template + a site.config.json.

The template files carry {{TOKENS}}. This script fills the scalar tokens (name,
phones, brand colors, …) and GENERATES the repeating sections (team cards,
listings seed, contact rows, community tiles, hero stats, areas, socials) from
config arrays, so producing a new realtor's site is "edit one JSON, run one
command" — no hand-editing HTML.

Usage:
    python3 build.py [--config site.config.json] [--out ./dist] [--inplace]

  --out      write the rendered site to a directory (default ./dist)
  --inplace  render the template files in place instead (use on a fresh copy)

The config schema is documented in site.config.example.json. Anything you leave
out falls back to a sensible default so a partial config still builds.
"""
import argparse
import json
import os
import re
import shutil
import sys

# Files that contain tokens (everything else is copied verbatim).
TOKEN_FILES = ["index.html", "listings.html", "admin.html",
               "css/style.css", "js/data.js", "js/admin.js", "js/main.js",
               "js/agent-config.js", "js/agent.js"]

SVG_PHONE = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 '
             '19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 '
             '2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91'
             '.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>')
SVG_PHONE18 = SVG_PHONE.replace('stroke-width="2"', 'stroke-width="1.8"')
SVG_MAIL = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/>'
            '<path d="m22 7-10 6L2 7"/></svg>')
SVG_MAIL18 = SVG_MAIL.replace('stroke-width="2"', 'stroke-width="1.8"')
SVG_PIN18 = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/>'
             '<circle cx="12" cy="10" r="3"/></svg>')
SVG_MOBILE18 = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" '
                'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/>'
                '<path d="M12 18h.01"/></svg>')


def first_name(n):
    return (n or "").split()[0] if n else ""


def phone_placeholder(phone):
    """A neutral example phone that matches the realtor's own area code, so the
    contact-form hint reads naturally (e.g. an 816 team sees '(816) 555-0123')."""
    m = re.match(r"\(?(\d{3})\)?", phone or "")
    return f"({m.group(1)}) 555-0123" if m else "(555) 123-4567"


def gen_team(team):
    out = []
    for m in team:
        img = m.get("image")
        avatar = (f'<img class="team-card__avatar team-card__avatar--photo" src="{img}" alt="{m.get("name","")}">'
                  if img else
                  f'<span class="team-card__avatar" aria-hidden="true">{(m.get("name") or "?")[0]}</span>')
        out.append(f'''
          <article class="team-card">
            <div class="team-card__top">
              {avatar}
              <div>
                <h3>{m.get("name","")}</h3>
                <p class="role">{m.get("role","Agent")}</p>
              </div>
            </div>
            <p class="bio">{m.get("bio","")}</p>
            <div class="team-card__contacts">
              <a class="contact-pill" href="tel:{m.get("phone_tel","")}">
                {SVG_PHONE}
                {m.get("phone","")}</a>
              <a class="contact-pill" href="mailto:{m.get("email","")}">
                {SVG_MAIL}
                Email</a>
            </div>
          </article>''')
    return "".join(out)


def gen_contact_rows(cfg):
    rows = [f'''
              <div class="row">
                <span class="ic">{SVG_PIN18}</span>
                <div><strong>Office</strong><span>{cfg.get("office_line","")}</span></div>
              </div>''']
    if cfg.get("office_phone"):
        rows.append(f'''
              <a href="tel:{cfg.get("office_phone_tel","")}">
                <span class="ic">{SVG_PHONE18}</span>
                <div><strong>Office phone</strong><span>{cfg.get("office_phone","")}</span></div>
              </a>''')
    for m in cfg.get("team", []):
        if not m.get("phone"):
            continue
        rows.append(f'''
              <a href="tel:{m.get("phone_tel","")}">
                <span class="ic">{SVG_MOBILE18}</span>
                <div><strong>{first_name(m.get("name"))} · Cell</strong><span>{m.get("phone","")}</span></div>
              </a>''')
    rows.append(f'''
              <a href="mailto:{cfg.get("primary_email","")}">
                <span class="ic">{SVG_MAIL18}</span>
                <div><strong>Email</strong><span>{cfg.get("primary_email","")}</span></div>
              </a>''')
    return "".join(rows)


def gen_socials(socials):
    return "".join(
        f'\n            <a href="{s.get("url","#")}" target="_blank" rel="noopener">{s.get("label","")}</a>'
        for s in socials)


def gen_footer_reach(cfg):
    items = []
    for m in cfg.get("team", []):
        if m.get("phone"):
            items.append(f'\n            <li><a href="tel:{m.get("phone_tel","")}">{m.get("phone","")} · {first_name(m.get("name"))}</a></li>')
    if cfg.get("primary_email"):
        items.append(f'\n            <li><a href="mailto:{cfg["primary_email"]}">{cfg["primary_email"]}</a></li>')
    for s in cfg.get("socials", [])[:1]:
        items.append(f'\n            <li><a href="{s.get("url","#")}" target="_blank" rel="noopener">{s.get("label","")}</a></li>')
    return "".join(items)


def gen_hero_stats(stats):
    out = []
    for s in stats:
        sup = "<sup>+</sup>" if s.get("plus") else ""
        out.append(f'\n          <div class="hero__stat"><strong>{s.get("value","")}{sup}</strong><span>{s.get("label","")}</span></div>')
    return "".join(out)


def gen_areas(areas):
    spans = "".join(f"<span>{a}</span>" for a in areas)
    return spans + spans  # doubled for the seamless marquee loop


DEFAULT_VALUES = [
    {"title": "Responsive", "body": "Constant communication, so you're never left wondering where things stand."},
    {"title": "Honest", "body": "Straight advice and ethical service — even when it isn't the easy answer."},
    {"title": "Local", "body": "Deep, lived-in knowledge of the neighborhoods and the market that shapes them."},
]


def gen_values(values):
    out = []
    for i, v in enumerate(values, 1):
        out.append(f'''
          <div class="value-item reveal">
            <span class="num">— {i:02d}</span>
            <h3>{v.get("title", "")}</h3>
            <p>{v.get("body", "")}</p>
          </div>''')
    return "".join(out)


def gen_community(tiles):
    out = []
    for t in tiles:
        out.append(f'''
          <figure class="community-tile">
            <img src="{t.get("img","")}" alt="{t.get("alt","")}" loading="lazy">
            <figcaption><span>{t.get("side","")}</span><strong>{t.get("name","")}</strong></figcaption>
          </figure>''')
    return "".join(out)


def gen_brand_mark(logo, navy, brand, site_name):
    """Header/footer brand: the company's real logo if provided, else an SVG wordmark."""
    if logo:
        return f'<span class="brand__logo brand__logo--img"><img src="{logo}" alt="{site_name}"></span>'
    return (f'<span class="brand__logo" style="display:inline-flex;align-items:center;gap:.55rem">'
            f'<svg viewBox="0 0 100 100" width="38" height="38" aria-hidden="true">'
            f'<rect width="100" height="100" rx="22" fill="{navy}"/>'
            f'<path d="M50 20 80 46v34H59V62H41v18H20V46Z" fill="{brand}"/></svg>'
            f'<span style="font-family:var(--serif);font-weight:600;font-size:clamp(.92rem,.8rem+.35vw,1.12rem);'
            f'color:var(--ink);letter-spacing:-.01em;white-space:nowrap">{site_name}</span></span>')


def gen_welcome_sig(photo, names, sub):
    """Welcome signature: include the broker's real photo if we have one; otherwise
    show just the name/role (no broken placeholder image)."""
    img = f'<img src="{photo}" alt="{names}">' if photo else ""
    return (f'<div class="welcome__sig">{img}'
            f'<div><p class="name">{names}</p><p class="role">{sub}</p></div></div>')


def build_tokens(cfg):
    b = cfg.get("brand", {})
    team = cfg.get("team", [])
    solo = len(team) == 1
    _logo = cfg.get("logo")
    _navy = b.get("navy", "#180c44"); _brand = b.get("brand", "#2e7a3f")
    _name = cfg.get("site_name", "Realty Co.")
    _names = cfg.get("team_first_names", " & ".join(first_name(m.get("name")) for m in team))
    _sig_sub = f'{cfg.get("legal_name", _name)} · {cfg.get("office_location", "")}'
    _photo = cfg.get("welcome_photo") or (team[0].get("image") if team else None)
    t = {
        # Editorial copy — defaults are GENERIC; the build agent should override
        # these per realtor (their voice, their specialty). Team headings adapt to
        # solo-vs-team automatically so a single agent is never called a "team".
        "ABOUT_H2": cfg.get("about_h2", "Local expertise. <em>Personal</em> service."),
        "ABOUT_P2": cfg.get("about_p2", "Buying or selling a home is a major decision — the job is to make it smooth, clear, and genuinely worth it."),
        "SERVICES_H2": cfg.get("services_h2", "Buying or selling, <em>handled with care.</em>"),
        "SERVICES_SIDENOTE": cfg.get("services_sidenote", "Full-service representation for buyers and sellers — every step handled with care."),
        "TEAM_SIDENOTE": cfg.get("team_sidenote", "Buyer representation · Listing & marketing · Negotiation · Local market guidance"),
        "SOLD_H2": cfg.get("sold_h2", "Recent <em>sales</em>"),
        "TEAM_EYEBROW": cfg.get("team_eyebrow", "Your agent" if solo else "The team"),
        "TEAM_H2": cfg.get("team_h2", "Meet your <em>agent.</em>" if solo else "Meet the <em>team.</em>"),
        "QUOTE": cfg.get("quote", '"You deserve a <span>real advocate</span> — not a call center."'),
        "COMMUNITY_H2": cfg.get("community_h2", "Know the area like <em>a local</em>"),
        "FOOTER_CTA_H2": cfg.get("footer_cta_h2", "Let's get <em>started.</em>"),
        "VALUES": gen_values(cfg.get("values", DEFAULT_VALUES)),
        "SITE_NAME": cfg.get("site_name", "Realty Co."),
        "LEGAL_NAME": cfg.get("legal_name", cfg.get("site_name", "Realty Co.")),
        "SITE_TAGLINE": cfg.get("tagline", "Local Real Estate, Done Right"),
        "META_DESCRIPTION": cfg.get("meta_description", ""),
        "SLUG": cfg.get("slug", "realtor"),
        "REGION_SHORT": cfg.get("region_short", "the area"),
        "OFFICE_LINE": cfg.get("office_line", ""),
        "OFFICE_LOCATION": cfg.get("office_location", ""),
        "PRIMARY_PHONE": cfg.get("primary_phone", ""),
        "PRIMARY_PHONE_TEL": cfg.get("primary_phone_tel", ""),
        "PRIMARY_EMAIL": cfg.get("primary_email", ""),
        "PHONE_PLACEHOLDER": phone_placeholder(cfg.get("primary_phone", "")),
        # "Ramon" voice widget copy — the assistant itself (vapiPublicKey/
        # vapiAssistantId) is fixed/shared in js/agent-config.js, not per-config;
        # only the on-page tagline/bubble text is personalized per realtor.
        "AGENT_TAGLINE": cfg.get("agent_tagline", f'Your {_name} concierge'),
        "AGENT_BUBBLE_TEXT": cfg.get("agent_bubble_text", "Hi, I'm Ramon — talk to me!"),
        "BRAND_MARK": gen_brand_mark(_logo, _navy, _brand, _name),
        "WELCOME_SIG": gen_welcome_sig(_photo, _names, _sig_sub),
        "HERO_EYEBROW": cfg.get("hero", {}).get("eyebrow", ""),
        "HERO_H1": cfg.get("hero", {}).get("h1", ""),
        "HERO_SUB": cfg.get("hero", {}).get("sub", ""),
        # "Empty room becomes home" scroll wipe — two stacked photos + hrInitHeroStage()
        # in main.js. Defaults ship as local assets (assets/img/hero/); swap in the
        # realtor's own before/after photos via config when scrapeable.
        "HERO_BEFORE_IMAGE": cfg.get("hero", {}).get("before_image", "assets/img/hero/room-empty.png"),
        "HERO_AFTER_IMAGE": cfg.get("hero", {}).get("after_image", "assets/img/hero/room-lived-in.png"),
        "ABOUT_P1": cfg.get("about_p1", ""),
        "TEAM_FIRST_NAMES": cfg.get("team_first_names",
                                    " & ".join(first_name(m.get("name")) for m in cfg.get("team", []))),
        "SOLD_BLURB": cfg.get("sold_blurb", "A look at homes we've recently guided to the closing table."),
        "FOOTER_ABOUT": cfg.get("footer_about", ""),
        "YEAR": str(cfg.get("year", 2026)),
        "ADMIN_PASSCODE": cfg.get("admin_passcode", "demo2026"),
        "FAVICON_INK": b.get("navy", "180c44").lstrip("#"),
        "FAVICON_BRAND": b.get("brand", "68bd45").lstrip("#"),
        "COLOR_INK": b.get("ink", "#0f1611"),
        "COLOR_CREAM": b.get("cream", "#faf6ee"),
        "COLOR_BRAND": b.get("brand", "#2e7a3f"),
        "COLOR_BRAND_LIGHT": b.get("brand_light", "#84cf63"),
        "COLOR_BRAND_DARK": b.get("brand_dark", "#1f6030"),
        "COLOR_GOLD": b.get("gold", "#c9b078"),
        "COLOR_NAVY": b.get("navy", "#180c44"),
        # Generated blocks
        "HERO_STATS": gen_hero_stats(cfg.get("hero", {}).get("stats", [])),
        "AREA_MARQUEE": gen_areas(cfg.get("areas", [])),
        "TEAM_CARDS": gen_team(cfg.get("team", [])),
        "CONTACT_ROWS": gen_contact_rows(cfg),
        "SOCIAL_LINKS": gen_socials(cfg.get("socials", [])),
        "FOOTER_REACH": gen_footer_reach(cfg),
        "COMMUNITY_TILES": gen_community(cfg.get("community", [])),
        "LISTINGS_SEED": json.dumps(cfg.get("listings", []), indent=2),
    }
    return t


def render(text, tokens):
    for k, v in tokens.items():
        text = text.replace("{{" + k + "}}", str(v))
    return text


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=os.path.join(here, "site.config.json"))
    ap.add_argument("--out", default=os.path.join(here, "dist"))
    ap.add_argument("--inplace", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.config):
        sys.exit(f"config not found: {args.config} (copy site.config.example.json)")
    cfg = json.load(open(args.config))
    tokens = build_tokens(cfg)

    if args.inplace:
        target = here
    else:
        target = args.out
        if os.path.abspath(target) != here:
            shutil.rmtree(target, ignore_errors=True)
            shutil.copytree(here, target, ignore=shutil.ignore_patterns(
                "build.py", "site.config*.json", "dist", ".git", "README.md"))

    for rel in TOKEN_FILES:
        p = os.path.join(target, rel)
        if os.path.exists(p):
            with open(p) as f:
                s = f.read()
            with open(p, "w") as f:
                f.write(render(s, tokens))

    leftover = set(re.findall(r"\{\{([A-Z_]+)\}\}",
                              "".join(open(os.path.join(target, r)).read() for r in TOKEN_FILES
                                      if os.path.exists(os.path.join(target, r)))))
    print(f"Built site for '{cfg.get('site_name')}' -> {target}")
    if leftover:
        print(f"  ⚠ unfilled tokens (add to config): {sorted(leftover)}")
    else:
        print("  all tokens filled ✓")


if __name__ == "__main__":
    main()
