from csp import (btn, BOOK, TEL, PHONE, cta_band, ic, img, menu_layout, note, page, phero, price_row, sec_head, team_strip)

LASER = [  # zone, price, group
    ("Upper lip", 70, "Face"), ("Chin", 70, "Face"), ("Lip &amp; chin", 100, "Face"), ("Cheeks", 85, "Face"), ("Face &amp; cheeks", 135, "Face"),
    ("Ears", 65, "Face"), ("Neck", 70, "Face"), ("Beard", 145, "Face"),
    ("Underarm, women", 80, "Upper body"), ("Underarm, men", 90, "Upper body"), ("Forearm, women", 100, "Upper body"), ("Forearm, men", 110, "Upper body"),
    ("Full arms, women", 135, "Upper body"), ("Full arms, men", 145, "Upper body"), ("Hands &amp; fingers", 65, "Upper body"), ("Fingers", 50, "Upper body"),
    ("Shoulders", 100, "Upper body"), ("Décolleté", 125, "Upper body"), ("Breasts &amp; nipples", 70, "Upper body"), ("Men's chest", 225, "Upper body"),
    ("Torso", 225, "Upper body"), ("Abdomen, complete", 125, "Upper body"), ("Navel line", 65, "Upper body"),
    ("Back", 225, "Back"), ("Back &amp; shoulders", 250, "Back"), ("Lower back", 95, "Back"),
    ("Regular bikini", 90, "Bikini"), ("Brazilian bikini", 100, "Bikini"), ("Full bikini", 145, "Bikini"), ("Full bikini &amp; buttocks", 195, "Bikini"),
    ("Buttocks", 100, "Bikini"), ("Between buttocks", 75, "Bikini"),
    ("Inner thighs", 130, "Legs"), ("Thighs", 200, "Legs"), ("Half legs", 200, "Legs"), ("Full legs", 350, "Legs"), ("Full legs &amp; feet", 375, "Legs"),
    ("Feet &amp; toes", 65, "Legs"), ("Toes", 45, "Legs"),
]


def groups():
    rows = "".join(f'<tr><td>{z}</td><td class="muted" style="font-weight:500">{g}</td><td>${p}</td></tr>' for z, p, g in LASER)
    laser = f'''<div class="split" style="gap:clamp(24px,3vw,48px);margin-bottom:clamp(28px,3vw,44px)">
  <div class="stack" style="--stack:18px">
    <p class="lead">Cynosure Elite+® is one of the most advanced systems available, designed for every skin type, with a large tip for faster sessions and a cooling system that numbs the skin with cold air for comfort.</p>
    <div class="chips"><span class="chip chip--solid">755 nm Alexandrite</span><span class="chip chip--solid">1064 nm Nd:YAG</span><span class="chip chip--solid">All skin types</span><span class="chip chip--solid">Built-in cooling</span></div>
  </div>
  <div class="callout callout--dark"><h3>Two wavelengths, one session</h3><p>Alexandrite suits most skin and hair types, while Nd:YAG safely and effectively treats darker skin tones. Your technician can combine both in a single visit for permanent results.</p></div>
</div>
<div class="zone-tools"><label class="search"><span class="visually-hidden">Search a zone</span>{ic("search")}<input type="search" placeholder="Search a zone, e.g. underarm, legs, face…" data-search="laser-table"></label><span class="chip">{len(LASER)} zones</span></div>
<div style="overflow-x:auto"><table class="ptable" id="laser-table"><thead><tr><th>Zone</th><th>Area</th><th>Per session</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="empty-state" id="laser-table-empty" hidden>No match. Call us at {PHONE} and we'll price your zone.</p>
<div class="price-cols mt-l">
  <div class="callout"><h3>Before you book</h3><ul class="checklist checklist--x" role="list">
    <li>{ic("x")}<span>Not during pregnancy or breastfeeding, or within 6 months of giving birth.</span></li>
    <li>{ic("x")}<span>Wait 12 days after your last antibiotic, and 6 months after Accutane.</span></li>
    <li>{ic("x")}<span>No sun, tanning beds or self-tanner for 2 weeks before.</span></li>
    <li>{ic("x")}<span>No tattoos, skin lesions, infection or herpes on the treated area.</span></li></ul></div>
  <div class="callout callout--lime"><h3>Your first visit</h3><p>Every laser and electrolysis journey starts with a <strong>free consultation</strong> and health check with a licensed esthetician, who builds your treatment plan with you.</p>
    <div class="btn-row">{btn("Book a consultation", BOOK, "", ext=True, small=True)}</div></div>
</div>'''

    photo = f'''<div class="price-list">
  {price_row("Photorejuvenation, skin rejuvenation", "$250", "Intense pulsed light to even tone, smooth and firm the skin and rebuild collagen. No downtime.")}
  {price_row("Redness, couperose &amp; rosacea", "$225", "One session targeting diffuse redness.")}
  {price_row("Face &amp; neck series", "$1,000–$1,350", "4 to 6 treatments for a smoother, firmer, more even complexion.", tag="Series")}
  {price_row("Facial telangiectasias, ruby spots", "Consultation", "Nd:YAG laser absorbed by haemoglobin to fade small dilated vessels, with a follow-up 2 to 3 weeks later.")}
  {price_row("Pigment spots &amp; lentigos", "Consultation", "Alexandrite laser breaks up melanin; spots darken, crust and flake away, usually within two weeks.")}
</div>
{note("Protect treated skin daily with a mineral SPF 50, before and after your sessions.")}'''

    meso = f'''<div class="cards" style="margin-bottom:clamp(28px,3vw,44px)">
  <article class="card card--dark"><figure>{img("microneedling", "Innopen microneedling device", "(min-width: 720px) 40vw, 100vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Innopen</span> Mesotherapy</span><h3>Exosomes <em>&amp; peptides</em></h3><p>Micro-perforations deliver peptide serums and lab-made exosomes (PDRN and hyaluronic acid) to firm, refine pores and fade marks, with less redness and faster healing. Also used for scalp and hair regrowth.</p><div class="foot"><span class="price">$400</span><span class="mono" style="color:var(--on-dark-3)">$350 each in a 4–6 series</span></div></div></article>
  <div class="stack" style="--stack:0">
    <div class="price-list">
      {price_row("Mesotherapy with peptides", "$300", sub="$225 in a series", desc="Visible results from the first session.")}
      {price_row("Targeted facial area", "$175", "Without exosomes.")}
      {price_row("Microdermabrasion", "$175", sub="4 for $600 · 6 for $900", desc="Refines texture and softens fine lines, spots and imperfections.")}
      {price_row("Microdermabrasion &amp; O2 oxygen", "$250", "Two complementary treatments for texture, radiance and hydration.")}
    </div>
    {note("Plan 4 to 6 sessions for the face and 6 to 8 for the body, 2 to 3 weeks apart.")}
  </div>
</div>'''

    peels = f'''<div class="price-cols">
  <div><h3 class="sub">Image Skincare designer peels</h3><div class="price-list">
    {price_row("Signature Facelift", "Rosacea · toning", "Vitamin C, fruit enzymes and centella stem cells to renew skin and calm redness. Suitable for sensitive skin.")}
    {price_row("Lightening Lift", "Pigment · spots", "Lactic and kojic acids with echinacea stem cells for brighter, even-toned skin.")}
    {price_row("Acne Lift", "Acne", "AHA and BHA with lilac stem cells to treat breakouts and post-inflammatory marks.")}
  </div>
  <div class="price-list mt-m">
    {price_row("Individual peel", "$175")}
    {price_row("Series of four", "$600")}
    {price_row("Series of six", "$900")}
  </div>
  {note("Prepare your skin with the Image starter kit for 2 to 4 weeks. We recommend 4 to 6 peels, two weeks apart. Consultation required.")}</div>
  <div id="o2"><h3 class="sub">Oxygen &amp; light</h3><div class="price-list">
    {price_row("O2 Lift", "$175", "Oxygen, plant stem cells, peptides and enzymatic botanicals for an instant, visible glow.", tag="Glow")}
    {price_row("LED light therapy add-on", "$25", "After oxygen, coloured light boosts active ingredients for acne, anti-aging or comfort.")}
  </div>
  <div class="rounded-img ratio-43 mt-m">{img("led", "LED light therapy", "(min-width: 860px) 40vw, 100vw")}</div></div>
</div>'''

    pmu = f'''<div class="price-list">
  {price_row("Eyebrow line", "From $550", "Varies with the work required and the result you want.")}
  {price_row("Lip contouring", "$550")}
  {price_row("Eye contour, thick", "$450")}
  {price_row("Intra-lash", "$375")}
  {price_row("Scar camouflage", "By project")}
  {price_row("Consultation", "$60", "Deducted from your first treatment.")}
</div>
{note("Permanent makeup by Sylvie Dallaire.")}'''
    return [
        ("laser", "Laser hair removal", "Laser <em>hair removal</em>", "", None, laser),
        ("photorejuvenation", "Photorejuvenation", "Light-based <em>skin care</em>", "", None, photo),
        ("mesotherapy", "Mesotherapy", "Mesotherapy <em>&amp; microdermabrasion</em>", "", None, meso),
        ("peels", "Peels & O2", "Clinical peels <em>&amp; oxygen</em>", "", None, peels),
        ("pmu", "Permanent makeup", "Permanent <em>makeup</em>", "", None, pmu),
    ]


def build():
    hero = phero("Medispa &amp; Laser", ["Results,", "<em>safely.</em>"],
                 "Exclusive treatments by our medical-aesthetics professionals: laser hair removal, photorejuvenation, mesotherapy, microdermabrasion and clinical peels. Every treatment starts with a consultation and health check.",
                 "laser", "A guest wearing protective eyewear during a laser treatment",
                 [("Laser", "Cynosure Elite+"), ("Zones from", "$45"), ("Consultation", "Free for laser"), ("Skin types", "All")],
                 [("laser", "Laser"), ("photorejuvenation", "Photorejuvenation"), ("mesotherapy", "Mesotherapy"), ("peels", "Peels &amp; O2"), ("pmu", "Permanent makeup")],
                 tag="Consultation first",
                 cta=f'<div class="btn-row">{btn("Book a consultation", BOOK, "lime", ext=True)}{btn("Call " + PHONE, TEL, "ghost", icon="phone")}</div>')
    menu = f'''<section class="section" id="menu">
  <div class="container">
    {sec_head("01", "Medispa menu", "Prices before taxes", "Clinical results, <em class='accent'>spa comfort.</em>", "These are therapeutic treatments, distinct from our pampering services, performed by licensed technicians on the latest equipment.")}
    {menu_layout(groups())}
  </div>
</section>'''
    team = team_strip(["carole", "karolyne", "maelie", "aarti", "mary"], "02", "Licensed hands, <em class='accent'>expert eyes.</em>")
    body = "\n".join([hero, menu, team, cta_band("Start with a <em>consultation.</em>", "Tell us your goals and we'll build a plan: the right technology, the right number of sessions, and honest expectations.")])
    return page("medispa.html", "Medispa & Laser Hair Removal in Vaudreuil-Dorion | Carole St-Pierre salon & spa",
                "Cynosure Elite+ laser hair removal for all skin types, photorejuvenation, mesotherapy with exosomes, microdermabrasion, Image peels and permanent makeup in Vaudreuil-Dorion.", body)
