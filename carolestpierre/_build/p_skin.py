from csp import (cta_band, ic, img, menu_layout, note, page, phero, price_row, sec_head, team_strip)

WAX = [  # area, wax, sugar, threading
    ("Eyebrow clean-up", "$25", "", "$25"), ("Eyebrow line shaping", "$28", "", ""), ("Upper lip", "$20", "$23", "$18"),
    ("Upper lip &amp; chin", "$30", "$30", "$30"), ("Chin", "$20", "$25", ""), ("Full face", "", "$45", "$40"), ("Neck", "$18", "", ""),
    ("Underarm", "$25", "", ""), ("Forearm", "$25", "", ""), ("Full arms", "$40", "", ""), ("Torso", "$45", "$50", ""),
    ("Back", "$55", "$65", ""), ("Regular bikini", "$25", "$30", ""), ("Regular-extra bikini", "$35", "$45", ""),
    ("Full bikini", "$50", "$55", ""), ("Buttocks &amp; between", "$45", "$50", ""), ("Half legs", "$30", "", ""),
    ("Half legs &amp; regular bikini", "$45", "", ""), ("Thighs", "$35", "", ""), ("Full legs", "$60", "", ""), ("Full legs &amp; bikini", "$75", "", ""),
]


def groups():
    facials = f'''<div class="cards cards--3" style="margin-bottom:clamp(28px,3vw,44px)" data-stagger>
  <article class="card card--dark" data-reveal><figure>{img("facial-hands", "Signature facial", "(min-width: 1100px) 25vw, 50vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Signature</span></span><h3>Ultimate <em>Signature</em></h3><p>Tailor-made with organic ingredients and pure vitamins, plus anti-wrinkle eye and mouth care and a hand and foot massage.</p><div class="foot"><span class="price">$175</span><span class="mono" style="color:var(--on-dark-3)">All skin types</span></div></div></article>
  <article class="card" data-reveal><figure>{img("facial-white", "Glow facial", "(min-width: 1100px) 25vw, 50vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Bestseller</span></span><h3>Beauty <em>Glow</em></h3><p>Peel, antioxidant serum, two firming masks and the signature Éminence tightening massage. Seventh heaven.</p><div class="foot"><span class="price">$150</span><span class="mono muted">Anti-aging</span></div></div></article>
  <article class="card" data-reveal><figure>{img("aveda-jungle", "Pure Forest facial", "(min-width: 1100px) 25vw, 50vw")}</figure><div class="body"><span class="eyebrow"><span class="num">New</span></span><h3>Pure Forest <em>Cryo-Thermal</em></h3><p>Adaptogens and a hot-cold massage to calm stress, tone and lift. Up to 89% more elastin for firmer skin.*</p><div class="foot"><span class="price">$150</span><span class="mono muted">Dry skin</span></div></div></article>
</div>
<div class="price-list">
  {price_row("Anti-Aging Ultra-Firming", "$135", "Retinol alternative, Phytocell Tec and green apple stem cells to boost collagen for lifted, tightened skin.")}
  {price_row("Antioxidant Arctic Berry", "$130", "Arctic berries, enzymes and peptides: gentle deep exfoliation, then intense hydration. No downtime, just luminous results.")}
  {price_row("Kombucha Facial", "$130", "Pre-, pro- and post-biotics balance your microbiome and restore the moisture barrier for an even, healthy-looking glow.")}
  {price_row("Hydrating Plumping Facial", "$115", "Our classic: skin analysis, cleanse, two exfoliants, extractions, masks, serums, eye and day/night cream, and a relaxing massage.", tag="Classic")}
  {price_row("Soothe &amp; Restore", "$115", "For sensitive skin: chamomile, calendula, arnica and rosemary calm redness caused by dryness.")}
  {price_row("Acne Advanced", "$115", "An active salicylic peel that clears congestion inside the pores without irritation.")}
  {price_row("Organic Facial for Men", "$105", "For every men's skin type, including sun-damaged skin.")}
  {price_row("Teen Facial", "$100", "A first introduction to skin care: analysis, cleanse, light exfoliation, extractions and a mask.")}
  {price_row("Éminence On the Run", "$75", "Deep cleanse, exfoliation and mask for fresh, hydrated skin.", meta=["30 min"])}
  {price_row("Eye Quattro", "$40", "Targets fine lines, puffiness and dark circles. Add it to any facial for $20.", meta=["30 min"])}
  {price_row("Facial supplements", "From $20", "LED mask, paprika treatment, eye treatment, lip treatment.")}
</div>
{note("*Results reported by Éminence Organics. Every facial starts with a skin analysis so we can personalise it.")}'''

    rows = "".join(f"<tr><td>{a}</td><td>{w or '<span class=na>—</span>'}</td><td>{s or '<span class=na>—</span>'}</td><td>{t or '<span class=na>—</span>'}</td></tr>" for a, w, s, t in WAX)
    wax = f'''<div class="zone-tools"><label class="search"><span class="visually-hidden">Search an area</span>{ic("search")}<input type="search" placeholder="Search an area, e.g. brows, bikini…" data-search="wax-table"></label></div>
<div style="overflow-x:auto"><table class="ptable" id="wax-table"><thead><tr><th>Area</th><th>Wax</th><th>Sugar</th><th>Threading</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="empty-state" id="wax-table-empty" hidden>No match. Try another word, or call us.</p>
<div class="price-list mt-m">
  {price_row("Eyebrow clean-up, tweezers", "$20")}
  {price_row("Electrolysis", "$2 / min", sub="+$5 needle fee", desc="Permanent removal, one follicle at a time. Starts with a free consultation.")}
</div>
{note('Looking for laser hair removal? See our <a class="link-arrow" href="medispa.html#laser">Medispa</a>.')}'''

    nails = f'''<div class="price-cols">
  <div><h3 class="sub">Hands</h3><div class="price-list">
    {price_row("Classic manicure", "$50", "Filing, soak, cuticle care, hand massage with Aveda Hand Relief, polish of your choice.", meta=["45 min", "French +$5"])}
    {price_row("Gel polish manicure", "$60", "Lasts 10 to 14 days.", meta=["60 min", "Removal +$5"])}
    {price_row("Aroma Spa manicure", "$65", "Essence of your choice, paraffin or mask, for glowing, younger-looking hands.", meta=["60 min"], tag="Spa")}
    {price_row("Botanical gel with tips", "$80", sub="French $85")}
    {price_row("Gel on natural nails", "$70")}
    {price_row("Refill, colour gel or French", "$65")}
    {price_row("Repair", "$10", sub="per nail")}
  </div></div>
  <div><h3 class="sub">Feet</h3><div class="price-list">
    {price_row("Beauty feet", "$60", "Herbal salt soak, nail care, cuticles, cream and polish. No callus removal.", meta=["45 min"])}
    {price_row("Classic pedicure", "$78", "Herbal salt soak, nail and cuticle care, callus removal, massage and polish.", meta=["75 min"])}
    {price_row("Gel polish pedicure", "$90", "OPI or Shellac gel that lasts up to 5 weeks, no drying time.", meta=["90 min", "Removal +$5"])}
    {price_row("Aroma Spa pedicure", "$88", sub="Gel $95", desc="Callus removal, essential-oil massage cream and peach paraffin or mask. Our guests' favourite.", meta=["90 min"], tag="Favourite")}
  </div></div>
</div>'''

    lashes = f'''<div class="price-cols">
  <div><h3 class="sub">Extensions by Anna-Rose</h3><div class="price-list">
    {price_row("Classic, full set", "$100", sub="Refill $50 / $60", meta=["2-week / 3-week refill"])}
    {price_row("Hybrid, full set", "$125", sub="Refill $55 / $65", meta=["2-week / 3-week refill"])}
    {price_row("Volume, full set", "$150", sub="Refill $65 / $80", meta=["2-week / 3-week refill"])}
  </div></div>
  <div><h3 class="sub">Lift, tint &amp; more</h3><div class="price-list">
    {price_row("Lash lift &amp; tint", "$90")}
    {price_row("Lash tint", "$30")}
    {price_row("Ear piercing", "$40")}
  </div>
  <div class="rounded-img ratio-43 mt-m">{img("lashes", "Close-up of lash extensions", "(min-width: 860px) 40vw, 100vw")}</div></div>
</div>'''

    tan = f'''<div class="price-list">
  {price_row("Spray tan", "$60", "An Italian, anti-aging formula with Matrixyl that reaches the second layer of skin, so it fades evenly without blotches.")}
  {price_row("Spray tan express", "$65", "Rinse in 1 to 4 hours depending on your desired depth. Keeps developing for 24 hours.", tag="Fast")}
</div>
<div class="price-cols mt-m">
  <div class="callout"><h3>The night before</h3><ul class="checklist" role="list">
    <li>{ic("check")}<span>Exfoliate. Our coffee scrub gives the best results.</span></li>
    <li>{ic("check")}<span>Shave, then lightly apply a water-based moisturiser.</span></li>
    <li>{ic("check")}<span>Wax at least 24 hours before.</span></li>
    <li>{ic("check")}<span>Come without makeup or perfume, in dark, loose clothes.</span></li></ul></div>
  <div class="callout callout--lime"><h3>After your tan</h3><ul class="checklist" role="list">
    <li>{ic("check")}<span>No sweat or water for 8 to 12 hours.</span></li>
    <li>{ic("check")}<span>First shower: rinse only, then pat dry.</span></li>
    <li>{ic("check")}<span>Skip exfoliants and moisturise daily.</span></li>
    <li>{ic("check")}<span>Enjoy a golden glow for 5 to 10 days.</span></li></ul></div>
</div>'''

    return [
        ("facials", "Facials", "Éminence <em>facials</em>", "Organic, results-focused facials with an incredibly fresh aroma, delivered by estheticians with up to 20 years of experience.", None, facials),
        ("waxing", "Hair removal", "Wax, sugar <em>&amp; threading</em>", "", None, wax),
        ("nails", "Nails", "Manicures <em>&amp; pedicures</em>", "", "nails", nails),
        ("lashes", "Lashes", "Lashes <em>&amp; brows</em>", "", None, lashes),
        ("tan", "Spray tan", "Sunless <em>glow</em>", "", None, tan),
    ]


def build():
    hero = phero("Skin &amp; Esthetics", ["Skin that", "<em>glows.</em>"],
                 "Facials, nails, lashes and hair removal with the finest organic products for face, body, hands and feet. Indulge in nature's finest.",
                 "facial-wide", "A guest relaxing during a facial",
                 [("Facials from", "$75"), ("Skincare", "Éminence Organics"), ("Pedicures", "Up to 90 min"), ("Lashes", "Classic to volume")],
                 [("facials", "Facials"), ("waxing", "Hair removal"), ("nails", "Nails"), ("lashes", "Lashes"), ("tan", "Spray tan")],
                 tag="Éminence Organics")
    menu = f'''<section class="section" id="menu">
  <div class="container">
    {sec_head("01", "Esthetics menu", "Prices before taxes", "The skin <em class='accent'>menu.</em>", "From a 30-minute refresh to our signature facial, every treatment starts with listening to your skin.")}
    {menu_layout(groups())}
  </div>
</section>'''
    team = team_strip(["melanie", "rebecca", "anna-rose", "aarti", "mary", "maelie", "emma", "happy"], "02", "The hands <em class='accent'>your skin trusts.</em>")
    body = "\n".join([hero, menu, team, cta_band("Your glow, <em>booked.</em>")])
    return page("skin.html", "Facials, Nails, Lashes & Waxing in Vaudreuil-Dorion | Carole St-Pierre salon & spa",
                "Éminence Organics facials, manicures and pedicures, lash extensions, waxing, sugaring, threading and spray tans at Carole St-Pierre salon & spa in Vaudreuil-Dorion.", body)
