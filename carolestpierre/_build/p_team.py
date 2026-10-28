from content import TEAM, TEAM_CATS
from csp import (BOOK, EMAIL, E, btn, cta_band, ic, img, lines, page, sec_head)

CAT_LABEL = dict(TEAM_CATS)


def leadership():
    by = {t[1]: t for t in TEAM}
    blocks = []
    for slug in ("carole", "julie"):
        name, _, role, _, bio, love, langs = by[slug]
        blocks.append(f'''<article class="split split--center" id="{slug}" style="gap:clamp(24px,4vw,64px)" data-reveal>
  <div class="rounded-img ratio-45" style="max-width:520px">{img("team/" + slug, "Portrait of " + name, "(min-width: 900px) 40vw, 100vw")}</div>
  <div class="stack" style="--stack:20px">
    <span class="eyebrow"><span class="num">{E(role)}</span></span>
    <h3 class="h2">{name}<em class="accent">.</em></h3>
    <p class="lead">{E(bio)}</p>
    <p class="prose">{E(love)}</p>
    <div class="chips">{"".join(f'<span class="chip">{E(l)}</span>' for l in langs)}</div>
  </div>
</article>''')
    return f'''<section class="section" id="leadership">
  <div class="container">
    {sec_head("01", "Leadership", "Since day one", "The women <em class='accent'>behind the name.</em>")}
    <div class="stack" style="--stack:clamp(56px,7vw,112px)">{"".join(blocks)}</div>
  </div>
</section>'''


def grid():
    cards = []
    for name, slug, role, cats, bio, love, langs in TEAM:
        if slug in ("carole", "julie"):
            continue
        first = cats.split()[0]
        cards.append(f'''<article class="member" id="{slug}" data-cat="{cats}" data-reveal>
  <figure>{img("team/" + slug, "Portrait of " + name, "(min-width: 1100px) 22vw, (min-width: 760px) 30vw, 50vw")}<span class="chip">{CAT_LABEL.get(first, "")}</span></figure>
  <div><h3>{E(name)}</h3><p class="role">{E(role)}</p></div>
  <details><summary>About {E(name)} <span class="pm">+</span></summary>
    <p>{E(bio)}</p><p><strong>Guests love:</strong> {E(love)}</p>
    <div class="langs">{"".join(f"<span>{E(l)}</span>" for l in langs)}</div>
  </details>
</article>''')
    filters = "".join(f'<button type="button" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t} <span class="c"></span></button>'
                      for k, t in TEAM_CATS if k != "lead")
    return f'''<section class="section is-paper2" id="specialists">
  <div class="container">
    {sec_head("02", "Specialists", "Filter by expertise", "Find <em class='accent'>your person.</em>", "Every guest is matched with the right specialist. Filter by what you need, then book by name online or by phone.")}
    <div class="filters" data-filter-group="team-grid" role="group" aria-label="Filter team" data-reveal>{filters}</div>
    <div class="team-grid mt-l" id="team-grid">{"".join(cards)}</div>
  </div>
</section>'''


def join():
    return f'''<section class="section">
  <div class="container">
    <div class="band" data-parallax-root data-reveal="fade">
      {img("salon-floor", "The salon floor at Carole St-Pierre", "100vw", parallax=12)}
      <div class="band-body">
        <span class="eyebrow" style="color:var(--on-dark-2)"><span class="num" style="color:var(--lime)">✦</span> Careers &amp; internships</span>
        <h2 class="h2">Love what you do? <em class="accent">Do it here.</em></h2>
        <p class="lead" style="color:var(--on-dark-2)">Competitive pay, flexible hours, perks beyond the norm, and real work-life balance. We also offer permanent internships for stylists, estheticians and massage therapists.</p>
        <div class="btn-row">{btn("Send your résumé", "mailto:" + EMAIL + "?subject=Career%20application", "lime")}{btn("Careers page", "about.html#careers", "ghost")}</div>
      </div>
    </div>
  </div>
</section>'''


def build():
    hero = f'''<section class="frame phero grain">
  <div class="phero-inner">
    <div class="crumbs" data-reveal="fade"><a href="index.html">Home</a><span>/</span><span>Team</span></div>
    <h1 class="phero-title" data-split>{lines("35+ specialists,", "<em>one standard.</em>")}</h1>
    <div class="phero-grid">
      <div class="phero-media" data-reveal="clip">{img("salon-reception", "The Carole St-Pierre reception", "(min-width: 900px) 55vw, 100vw", eager=True, parallax=8)}<span class="chip chip--lime tag mono">10 languages spoken</span></div>
      <div class="phero-meta" data-reveal>
        <p class="lead">Stylists, estheticians, massage therapists, laser technicians and a front-desk team that remembers your name. Many guests have followed their specialist for ten years or more.</p>
        <div class="btn-row">{btn("Book by name", BOOK, "lime", ext=True)}{btn("Filter the team", "#specialists", "ghost")}</div>
        <dl class="phero-facts"><div><dt>Leadership</dt><dd>45+ years</dd></div><div><dt>Professionals</dt><dd>35+</dd></div><div><dt>Disciplines</dt><dd>Hair · skin · body</dd></div><div><dt>Languages</dt><dd>FR · EN · +8</dd></div></dl>
      </div>
    </div>
  </div>
</section>'''
    body = "\n".join([hero, leadership(), grid(), join(), cta_band("Book with <em>your favourite.</em>")])
    return page("team.html", "Our Team | Stylists, Estheticians & Massage Therapists | Carole St-Pierre salon & spa",
                "Meet the 35+ specialists of Carole St-Pierre salon & spa in Vaudreuil-Dorion: Aveda stylists and colourists, estheticians, laser technicians and massage therapists.", body)
