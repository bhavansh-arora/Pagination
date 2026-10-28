import json

from csp import (cta_band, ic, img, menu_layout, note, page, phero, price_row, sec_head, team_strip)

MASSAGES = [
    ("Swedish (relaxation)", "Relaxing, all-encompassing body massage. Deep rest for mind and body.", {"60": 105, "90": 140, "120": 190}, ""),
    ("Aromatic", "Relaxation massage with your choice of essential oils. The ultimate way to unwind.", {"60": 115, "90": 145}, "Favourite"),
    ("Therapeutic", "Focuses on specific tensions and discomforts felt throughout the body.", {"60": 120, "90": 150, "120": 200}, ""),
    ("Hot stone", "Relaxes and detoxifies, boosts circulation and soothes muscle tension. Not recommended for acute diabetes, serious cardiovascular disease or a weakened immune system.", {"60": 155, "90": 180}, ""),
    ("A little of both worlds", "Half Swedish, half hot stone: the classic you love, with something new.", {"60": 160, "90": 190, "120": 230}, ""),
    ("Swedish Kinetic®", "Significant muscle relaxation and greater joint range, from one muscle attachment to the next. Only with Geneviève Lemieux, certified at Kiné-Concept.", {"60": 115, "90": 150}, ""),
    ("Lomi Lomi", "The Hawaiian hot-oil massage: wide, flowing forearm movements that move like waves.", {"60": 115, "90": 145}, ""),
    ("Lymphatic drainage", "Soft, directional movements and rhythmic pumping to detoxify the body and support immunity.", {"60": 135, "90": 165}, ""),
    ("Masso-physiotherapy", "Manual therapy that looks for the cause of pain and restricted movement, often starting with a postural analysis.", {"60": 120, "90": 150}, ""),
    ("Reflexology", "Ancient acupressure on points of the hands and feet to release tension, balance the body and support better sleep.", {"60": 115, "90": 145}, ""),
    ("Prenatal", "Relieves the common aches of pregnancy and promotes deep relaxation. Available after 12 weeks of pregnancy.", {"60": 115, "90": 145}, "Moms-to-be"),
]


def groups():
    rows = []
    for name, desc, prices, tag in MASSAGES:
        tag_html = f' <span class="tag">{tag}</span>' if tag else ""
        first = list(prices.values())[0]
        rows.append(f'<div class="price-row"><h3>{name}{tag_html}</h3><div class="price" data-prices=\'{json.dumps(prices)}\'>${first}<small>60 min</small></div><p>{desc}</p>'
                    f'<div class="meta">{"".join(f"<span>{d} min</span>" for d in prices)}</div></div>')
    massage = f'''<div data-duration-group>
  <div class="zone-tools" style="justify-content:space-between"><span class="eyebrow">Show prices for</span>
    <div class="seg" role="group" aria-label="Duration"><button type="button" data-duration="60" aria-pressed="true">60 min</button><button type="button" data-duration="90" aria-pressed="false">90 min</button><button type="button" data-duration="120" aria-pressed="false">120 min</button></div></div>
  <div class="price-list">{"".join(rows)}</div>
</div>
{note("Massage therapy receipts are issued for your insurance at the end of every session.")}'''

    body = f'''<div class="price-cols">
  <div><h3 class="sub">Balneotherapy</h3>
    <p class="muted" style="margin-bottom:16px">Salud per aqua: discover the benefits of water. Choose what goes into your bath.</p>
    <div class="price-list">
      {price_row("Dead Sea mud", "$50", "Remineralises, improves blood flow, detoxifies and soothes sore muscles.")}
      {price_row("Seaweed", "$50", "Stimulates metabolism, nourishes skin and reduces water retention. Not for hyperthyroidism.")}
      {price_row("Milk, the Cleopatra bath", "$50", "An age-old ritual to deeply nourish the body.")}
      {price_row("Dead Sea salts", "$50", "Relaxing and healing, ideal for psoriasis, eczema and muscle pain.")}
      {price_row("Essential oils", "$50", "Balance for mind and body.")}
      {price_row("Chocolate", "$50", "Cocoa actives tone the skin and brush away fatigue.")}
    </div></div>
  <div><h3 class="sub">Wraps &amp; exfoliation</h3>
    <p class="muted" style="margin-bottom:16px">Classic and original treatments with the finest natural products available today.</p>
    <div class="price-list">
      {price_row("Dead Sea mud wrap", "$95", "Mineral-rich and therapeutic, the very best for rejuvenating the body.")}
      {price_row("Laminaria seaweed wrap", "$95", "Detoxifies, drains and firms.")}
      {price_row("Choco-slimming wrap", "$95", "Energising and slimming, for a peak wellness feeling.")}
      {price_row("Stonecrop restorative wrap", "$95", "Stonecrop and aloe to hydrate and brighten from head to toe.")}
      {price_row("Sugar scrub exfoliation", "$85", meta=["45 min"])}
    </div></div>
</div>'''

    wood = f'''<div class="split" style="gap:clamp(24px,3vw,48px)">
  <div class="stack" style="--stack:20px">
    <p class="lead">Specially designed wooden tools, like grooved rollers and the Swedish cup, sculpt and contour the silhouette while boosting blood and lymphatic circulation.</p>
    <ul class="checklist" role="list">
      <li>{ic("check")}<span>Supports lymphatic drainage and reduces puffiness</span></li>
      <li>{ic("check")}<span>Improves the appearance of cellulite</span></li>
      <li>{ic("check")}<span>Stimulates collagen and skin elasticity</span></li>
      <li>{ic("check")}<span>Helps sculpt and define the silhouette</span></li>
    </ul>
  </div>
  <div class="callout callout--dark"><span class="eyebrow"><span class="num">✦</span> Your plan</span>
    <h3 style="font-size:1.6rem">1 to 2 sessions a week, for 8 to 10 weeks.</h3>
    <p>Then roughly one maintenance session a month. Drink 1 to 1.5 L of water after each treatment and keep moving to extend the benefits. Frequency varies with your goals.</p>
  </div>
</div>'''
    return [
        ("massage", "Massages", "Massage <em>therapy</em>", "Fifteen-plus techniques, one for every need and personality. Toggle the duration to compare prices.", "massage-therapeutic", massage),
        ("body", "Body treatments", "Body <em>treatments</em>", "", "balneo", body),
        ("wood", "Wood therapy", "Wood <em>therapy</em>", "", "wood-therapy", wood),
    ]


def build():
    hero = phero("Massage &amp; Body", ["Let it", "<em>all go.</em>"],
                 "Slow down, release tension and take a true moment for yourself. Our male and female massage therapists tailor every technique to your needs, 7 days a week.",
                 "hot-stones", "Hot stones placed along a guest's back",
                 [("Massages from", "$105"), ("Techniques", "15+"), ("Therapists", "Women &amp; men"), ("Receipts", "For insurance")],
                 [("massage", "Massages"), ("body", "Body treatments"), ("wood", "Wood therapy")],
                 tag="Open 7 days")
    good = f'''<section class="section section--tight is-paper2">
  <div class="container"><div class="values" data-stagger>
    <article class="value" data-reveal><span class="ico">{ic("users")}</span><h3>Choose your therapist</h3><p>Male and female therapists: tell us your preference and any needs when booking.</p></article>
    <article class="value" data-reveal><span class="ico">{ic("heart")}</span><h3>Children welcome</h3><p>Under 14, a parent or guardian stays in the room for the whole massage.</p></article>
    <article class="value value--dark" data-reveal><span class="ico">{ic("shield")}</span><h3>Insurance receipts</h3><p>An official receipt from your therapist after every session.</p></article>
    <article class="value value--lime" data-reveal><span class="ico">{ic("calendar")}</span><h3>7 days a week</h3><p>Weekday evenings until 8 PM and weekend mornings.</p></article>
  </div></div>
</section>'''
    menu = f'''<section class="section" id="menu">
  <div class="container">
    {sec_head("01", "Massage &amp; body menu", "Prices before taxes", "Find <em class='accent'>your</em> massage.")}
    {menu_layout(groups())}
  </div>
</section>'''
    team = team_strip(["genevieve", "christine", "gisela", "mila", "myriam", "yadira", "happy"], "02", "Strong hands, <em class='accent'>gentle souls.</em>")
    body = "\n".join([hero, good, menu, team, cta_band("Book your <em>moment of calm.</em>")])
    return page("massage.html", "Massage Therapy in Vaudreuil-Dorion | Swedish, Hot Stone, Lomi Lomi | Carole St-Pierre",
                "Massage therapy in Vaudreuil-Dorion, 7 days a week: Swedish, therapeutic, hot stone, Lomi Lomi, prenatal, reflexology and lymphatic drainage, plus wraps, balneotherapy and wood therapy.", body)
