from csp import (BOOK, EMAIL, SPARK, btn, cta_band, ic, img, page, phero, sec_head)


def letter():
    return f'''<section class="section" id="story">
  <div class="container">
    <div class="split split--wide-right">
      <div class="sticky-col">{sec_head("01", "A note from Carole", "", "It's always been <em class='accent'>about you.</em>")}</div>
      <div class="letter" data-reveal>
        <p><span class="opener">Dear guest,</span></p>
        <p>It's always been very important for me to offer you the best. You deserve it.</p>
        <p>The finest team of hair stylists, estheticians, massage therapists, manicurists and laser specialists, paired with the most refined selection of organic products for your face, body and hair.</p>
        <p>Your beauty and wellness are our number-one priority, and my team and I are passionate about giving the attentive care that embodies our mission. Come discover the services and unique sensory experiences of our Aveda Concept salon and eco-responsible spa.</p>
        <p>We look forward to seeing you.</p>
        <div><p class="muted" style="font-size:1rem">Naturally yours,</p><p class="sig">Carole St-Pierre</p><p class="mono muted" style="margin-top:8px">Founder &amp; President</p></div>
      </div>
    </div>
  </div>
</section>'''


def pioneer():
    return f'''<section class="frame is-dark grain">
  <div class="container section">
    <div class="split split--center">
      <div class="rounded-img ratio-45" data-reveal="clip" style="max-width:560px">{img("carole-portrait", "Carole St-Pierre", "(min-width: 900px) 40vw, 100vw")}</div>
      <div class="stack">
        <span class="eyebrow"><span class="num">(02)</span> — A pioneer</span>
        <h2 class="h2" data-split><span class="ln">45 years.</span><span class="ln"><em class="accent">One motto.</em></span></h2>
        <p class="lead">Carole is a true pioneer of beauty, wellness and business, with more than 45 years of experience. Now semi-retired, she still practises the medical-esthetic treatments she cherishes, always first to embrace what's new.</p>
        <blockquote class="h3" style="font-weight:600">“Give to the next.”</blockquote>
        <p class="prose">Her motto is the generous, caring approach she brings to every guest and every member of a team she has grown to more than 35 professionals, led day to day by General Manager Julie, who has grown alongside her for 30 years.</p>
        <div class="btn-row">{btn("Meet the team", "team.html", "lime")}</div>
      </div>
    </div>
  </div>
</section>'''


def values():
    return f'''<section class="section">
  <div class="container">
    {sec_head("03", "What we stand for", "Naturally", "Beauty, <em class='accent'>with a conscience.</em>")}
    <div class="values" data-stagger>
      <article class="value value--dark" data-reveal><span class="ico">{ic("flower")}</span><h3>Aveda Concept salon</h3><p>The art and science of pure flower and plant essences, for hair colour and care that respects you and the planet.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("tree")}</span><h3>Éminence Organics</h3><p>Organic, results-driven skincare. Éminence plants a tree for every product sold.</p></article>
      <article class="value value--lime" data-reveal><span class="ico">{ic("rabbit")}</span><h3>Beauty without cruelty</h3><p>No animal testing, ever. A promise we make on every shelf and in every treatment room.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("users")}</span><h3>All under one roof</h3><p>Hair, skin, body, laser and massage, so your whole routine lives with a team that knows you.</p></article>
    </div>
  </div>
</section>'''


def space():
    figs = [("salon-exterior", "The salon on boulevard de la Gare"), ("salon-reception", "Reception and boutique"), ("hair-styling", "Hair &amp; makeup"),
            ("balneo", "The balneotherapy room"), ("head-massage", "Massage room"), ("hair-show", "Aveda creative work")]
    html = "".join(f'<figure data-reveal>{img(n, c, "(min-width: 900px) 33vw, 50vw")}<figcaption>{c}</figcaption></figure>' for n, c in figs)
    return f'''<section class="section section--flush-top">
  <div class="container">
    {sec_head("04", "The space", "3210 boul. de la Gare", "A calm place, <em class='accent'>close to home.</em>", "Steps from the Vaudreuil train station, with easy parking, a serene waiting lounge and dedicated rooms for every ritual.")}
    <div class="gallery" style="columns:2">{html}</div>
  </div>
</section>'''


def brands():
    names = ["Aveda", "Éminence Organics", "Image Skincare", "Gehwol", "OPI", "Cuccio", "COOLA", "Novoqueen", "Cynosure"]
    row = SPARK.join(f"<span>{n}</span>" if i % 2 == 0 else f"<span><em>{n}</em></span>" for i, n in enumerate(names)) + SPARK
    return f'''<section class="section section--tight">
  <div class="container"><div class="sec-rule" data-reveal="fade" style="margin-bottom:24px"><span class="eyebrow"><span class="num">(05)</span> — The brands we trust</span><span class="eyebrow hide-sm">In treatment &amp; in our boutique</span></div></div>
  <div class="marquee" aria-label="Brands: {", ".join(names)}"><div class="marquee-track" style="animation-duration:46s">{row}{row}</div></div>
</section>'''


def careers():
    return f'''<section class="section" id="careers">
  <div class="container">
    {sec_head("06", "Careers", "Hiring talent", "Grow with <em class='accent'>the best.</em>")}
    <div class="cards">
      <article class="card card--dark" data-reveal><figure>{img("salon-floor", "The salon floor", "(min-width: 720px) 45vw, 100vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Careers</span></span><h3>Stylists, estheticians, <em>therapists</em> &amp; front desk</h3><p>We're a thriving business always looking for skilled, passionate people who combine excellence with attentive care. Competitive salaries, flexible hours, perks beyond the norm and real work-life balance.</p><div class="foot">{btn("Apply by email", "mailto:" + EMAIL + "?subject=Career%20application", "lime", small=True)}</div></div></article>
      <article class="card" data-reveal><figure>{img("hair-show", "Aveda creative hair show", "(min-width: 720px) 45vw, 100vw")}</figure><div class="body"><span class="eyebrow"><span class="num">Internships</span></span><h3>You are <em>the future.</em></h3><p>We offer permanent internships for hair stylists, estheticians and massage therapists. Hone your skills with dedicated professionals in a quality environment.</p><div class="foot">{btn("Send your résumé", "mailto:" + EMAIL + "?subject=Internship%20application", "", small=True)}</div></div></article>
    </div>
  </div>
</section>'''


def build():
    hero = phero("About", ["Give to", "<em>the next.</em>"],
                 "Carole St-Pierre salon &amp; spa is an Aveda Concept hair salon and eco-responsible spa where your beauty and wellbeing come first, built on 45 years of Carole's craft.",
                 "aveda-blossom", "Aveda model surrounded by white blossoms",
                 [("Founded by", "Carole St-Pierre"), ("Experience", "45+ years"), ("Team", "35+ professionals"), ("Treatments", "100+")],
                 [("story", "Carole's note"), ("careers", "Careers")], tag="Naturellement vôtre",
                 cta=f'<div class="btn-row">{btn("Book a visit", BOOK, "lime", ext=True)}{btn("Meet the team", "team.html", "ghost")}</div>')
    body = "\n".join([hero, letter(), pioneer(), values(), space(), brands(), careers(), cta_band()])
    return page("about.html", "About Carole St-Pierre | Aveda Concept Salon & Eco-Spa in Vaudreuil-Dorion",
                "Founded by Carole St-Pierre, with 45+ years in beauty and wellness: an Aveda Concept salon and eco-responsible spa in Vaudreuil-Dorion with a team of 35+ professionals.", body)
