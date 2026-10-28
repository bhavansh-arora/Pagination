from csp import (btn, cta_band, ic, img, menu_layout, note, page, phero, price_row, ritual_steps, sec_head, team_strip)


def groups():
    cut = f'''<div class="price-list">
  {price_row("Women's haircut", "$60+", "Consultation, Aveda stress-relieving shampoo, precision cut and style.")}
  {price_row("Men's haircut", "$30–$45")}
  {price_row("Young girls, 11 to 17", "From $55")}
  {price_row("Boys, 6 to 17", "From $28", "Fades and other style requests may carry a small supplement.")}
  {price_row("Girls, 6 to 10", "$35")}
  {price_row("Babies &amp; toddlers, 0 to 5", "$25")}
  {price_row("Cut only", "$35–$50", "Shampoo and haircut without blow-dry. You'll leave with wet hair.")}
  {price_row("Bangs", "$7")}
</div>
{note("All haircuts are booked in 45-minute blocks. Thicker, longer or more textured hair may need extra time, reflected in the price. Want a flat iron or curls? Mention it when booking.")}'''
    style = f'''<div class="price-list">
  {price_row("Wash &amp; blow-dry, women", "$40–$60")}
  {price_row("Wash &amp; blow-dry, girls 6 to 11", "$30")}
  {price_row("Updo", "From $95", "Events, galas and graduations. For weddings, see our bridal menu.", tag="Event")}
</div>
{note("Teens 12 to 17 enjoy 10% off styling and updos.")}'''
    colour = f'''<div class="split" style="gap:clamp(24px,3vw,48px);margin-bottom:clamp(28px,3vw,44px)">
  <div class="callout callout--dark"><h3>Why Aveda colour?</h3>
    <ul class="checklist" role="list">
      <li>{ic("check")}<span>Plant-powered and environmentally friendly</span></li>
      <li>{ic("check")}<span>Optimal scalp comfort: no burning, no itching</span></li>
      <li>{ic("check")}<span>100% grey coverage, with high-performance results</span></li>
      <li>{ic("check")}<span>Enriched with oils for shine and healthier hair</span></li>
    </ul></div>
  <p class="lead" style="align-self:center">Whatever colour you'd love, your colour specialist will create a custom hue that's deep, rich and ultra-shiny. Prefer it? L'Oréal Inoa colour is available on request.</p>
</div>
<div class="price-list">
  {price_row("Colour", "From $75")}
  {price_row("Root colour", "From $75")}
  {price_row("Highlights, half head", "From $125")}
  {price_row("Highlights, full head", "From $150")}
  {price_row("Toner or lightening toner", "$25+", sub="$40 on its own", desc="Added to a colour service.")}
  {price_row("Bleach", "$80", "For a change of colour.")}
  {price_row("Colour correction", "Consultation", "Every correction starts with a consultation so we can plan the safest route.")}
</div>'''
    perm = f'''<div class="price-list">
  {price_row("Super-soft perm, women", "From $130")}
  {price_row("Super-soft perm, men", "From $100")}
</div>
{note("Depending on length and thickness, the price may be higher.")}'''
    care = f'''<div class="cards">
  <article class="card"><figure>{img("botanical-leaf", "Aveda Botanical Repair", "(min-width: 720px) 40vw, 100vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Aveda</span> Botanical Repair™</span><h3>Transform <em>your hair</em></h3><p>A bonding, plant-powered treatment for every hair type and texture: stronger, shinier, naturally vibrant hair.</p><div class="foot"><span class="price">$65+</span><span class="muted" style="font-size:.86rem">with styling · $35+ added to a service</span></div></div></article>
  <article class="card"><figure>{img("ritual-scalp", "Aveda scalp ritual", "(min-width: 720px) 40vw, 100vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Aveda</span> Scalp Solutions</span><h3>A facial, <em>for your scalp</em></h3><p>Stimulates, exfoliates and cleanses the scalp while repairing and strengthening hair from the inside out. Styling included.</p><div class="foot"><span class="price">$75+</span><span class="muted" style="font-size:.86rem">includes styling</span></div></div></article>
</div>'''
    makeup = f'''<div class="price-list">
  {price_row("Personalised event makeup", "$75–$85", "Galas, photos, parties. Add false lashes for $10.")}
  {price_row("Special &amp; artistic makeup", "From $125", "Halloween, costume parties and creative looks.")}
  {price_row("Wedding makeup", '<a class="link-arrow" href="weddings.html#menu">Bridal menu</a>')}
</div>
{note("Rates vary with the makeup artist's level of experience.")}'''
    return [
        ("cut", "Cut & style", "Cut <em>&amp; style</em>", "", "aveda-bob", cut),
        ("styling", "Styling", "Blow-dry <em>&amp; updos</em>", "", None, style),
        ("colour", "Colour", "Colour <em>by Aveda</em>", "", "hair-show", colour),
        ("perm", "Perms", "Soft <em>perms</em>", "", None, perm),
        ("treatments", "Treatments", "Hair <em>treatments</em>", "", None, care),
        ("makeup", "Makeup", "Makeup <em>for events</em>", "", "bridal-makeup-artist", makeup),
    ]


def build():
    hero = phero("Hair &amp; Makeup", ["Hair, <em>naturally</em>", "brilliant."],
                 "Our Aveda Lifestyle specialists deliver the hair you want: contemporary, romantic, modern, an updo, a bob, braided and more, always respecting the look you came for.",
                 "aveda-folk", "Model with sleek, glossy hair in an Aveda campaign",
                 [("Women's cut", "From $60"), ("Colour", "From $75"), ("Products", "Aveda"), ("Grey coverage", "100%")],
                 [("cut", "Cut &amp; style"), ("styling", "Styling"), ("colour", "Colour"), ("perm", "Perms"), ("treatments", "Treatments"), ("makeup", "Makeup")],
                 tag="Aveda Concept salon")
    steps = ritual_steps("01", "Every visit", "The Aveda ritual", "Every visit <em class='accent'>begins with you.</em>", [
        ("A real consultation", "We start by listening: your routine, your hair's history and the look you're dreaming of."),
        ("Stress-relieving shampoo", "An Aveda shampoo ritual with aromas and a scalp massage that resets your whole day."),
        ("The perfect cut &amp; style", "Precision work, finished with plant-powered styling products and advice to recreate it at home."),
    ])
    menu = f'''<section class="section" id="menu">
  <div class="container">
    {sec_head("02", "Hair menu", "Prices before taxes", "The hair <em class='accent'>menu.</em>", "Prices vary with the stylist's level of training and experience, and with your hair's length and thickness. Not sure what to book? Call us and we'll guide you.")}
    {menu_layout(groups())}
  </div>
</section>'''
    levels = f'''<section class="section section--flush-top">
  <div class="container">
    <div class="split split--center">
      <div class="rounded-img ratio-43" data-reveal="clip">{img("hair-styling", "A stylist at work in the hair studio", "(min-width: 900px) 45vw, 100vw")}</div>
      <div class="stack" style="--stack:24px" data-reveal>
        <span class="eyebrow"><span class="num">✦</span> Stylist levels</span>
        <h2 class="h3">Matched to your hair, <em class="accent">priced with care.</em></h2>
        <p class="prose">Our stylists are grouped in levels based on training, education and experience, from rising talent to master stylists with 20 years at the chair. Every level delivers the Aveda standard; higher levels bring deeper specialisation in colour correction, creative cuts and bridal work.</p>
        <div class="btn-row">{btn("Book online", "https://carolestpierre.zenoti.com/webstoreNew/services", "lime", ext=True)}{btn("Find your stylist", "team.html", "ghost")}</div>
      </div>
    </div>
  </div>
</section>'''
    team = team_strip(["jeff", "christelle", "vivian", "dorianne", "thea", "heidi", "kim"], "03", "Stylists guests <em class='accent'>follow for years.</em>")
    body = "\n".join([hero, steps, menu, levels, team, cta_band("Ready for <em>your new look?</em>")])
    return page("hair.html", "Aveda Hair Salon in Vaudreuil-Dorion | Cuts, Colour & Treatments | Carole St-Pierre",
                "Aveda Concept hair salon in Vaudreuil-Dorion: women's, men's and kids' cuts, plant-powered colour with 100% grey coverage, highlights, Botanical Repair and event makeup.", body)
