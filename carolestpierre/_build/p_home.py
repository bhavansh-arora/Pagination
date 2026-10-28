from content import REVIEWS, RITUALS, TEAM
from csp import (phone_mock, ritual_title, BOOK, GIFT, APPLE, GOOGLE_PLAY, REVIEW_GOOGLE, SPARK, E, btn, book_btn, cta_band, ic, img, lines,
                  page, review_card, sec_head)


def hero():
    return f'''<section class="frame hero grain" data-parallax-root>
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <span class="eyebrow" data-reveal="fade"><span class="num">(01)</span> — Aveda Concept salon &amp; eco-spa · Vaudreuil-Dorion</span>
      <h1 class="hero-title" data-split>{lines("Naturally", "<em>yours.</em>")}</h1>
      <p class="hero-sub" data-reveal>Hair, skin, massage, medical aesthetics and bridal, <strong>under one roof and open 7 days</strong>. More than 100 treatments by 35+ specialists, powered by Aveda and Éminence Organics.</p>
      <div class="btn-row" data-reveal>{book_btn()}{btn("Find my treatment", "#finder", "ghost")}</div>
    </div>
    <div class="hero-media" aria-hidden="false">
      <div class="hero-ring" aria-hidden="true"></div>
      <figure class="hero-img hero-img--a" data-reveal="clip">{img("ritual-scalp", "A guest with eyes closed during an Aveda scalp ritual", "(min-width: 1024px) 34vw, 80vw", eager=True)}</figure>
      <figure class="hero-img hero-img--b" data-reveal="scale" style="--d:.25s">{img("botanical-leaf", "Glossy dark hair framed by a green leaf, Aveda Botanical Repair", "(min-width: 1024px) 16vw, 40vw", eager=True)}</figure>
      <div class="hero-card" data-reveal style="--d:.4s">
        <span class="mono"><span class="status" data-open-status="short"></span></span>
        <strong>Book in under a minute</strong>
        <a href="{BOOK}" target="_blank" rel="noopener">See today's availability →</a>
      </div>
    </div>
    <div class="hero-foot" data-reveal="fade" data-stagger>
      <div class="hero-stat"><strong><span data-count="45">45</span><sup>+</sup></strong><span>years of Carole's craft and care</span></div>
      <div class="hero-stat"><strong><span data-count="35">35</span><sup>+</sup></strong><span>stylists, estheticians &amp; therapists</span></div>
      <div class="hero-stat"><strong><span data-count="100">100</span><sup>+</sup></strong><span>hair, skin &amp; body treatments</span></div>
      <div class="hero-stat"><strong><span data-count="7">7</span><sup>days</sup></strong><span>a week, evenings until 8 PM</span></div>
    </div>
  </div>
</section>'''


def marquee():
    words = ['<span>Hair</span>', '<span class="o">Skin</span>', '<span><em>Massage</em></span>', '<span>Medispa</span>',
             '<span class="o">Bridal</span>', '<span><em>Rituals</em></span>']
    row = SPARK.join(words) + SPARK
    return f'<div class="marquee" aria-hidden="true"><div class="marquee-track">{row}{row}</div></div>'


def statement():
    pill = lambda n, cls="": f'<span class="pill-img {cls}">{img(n, "", "120px")}</span>'
    return f'''<section class="section">
  <div class="container">
    <div class="sec-rule" data-reveal="fade" style="margin-bottom:clamp(40px,5vw,72px)"><span class="eyebrow"><span class="num">(02)</span> — The Carole St-Pierre way</span><span class="eyebrow hide-sm">Naturellement vôtre</span></div>
    <p class="statement" data-scrub-words>For more than 45 years, Carole has believed one thing: {pill("platinum")} you deserve the best. Today a team of 35+ specialists brings it to life with plant-powered {pill("hand-cream", "round")} Aveda and Éminence organics, so you leave <em>lighter,</em> {pill("facial-white-2")} brighter and <em>naturally</em> more you.</p>
    <div class="btn-row mt-l" data-reveal><a class="link-arrow" href="about.html">Meet Carole {ic("arrow")}</a><span class="chips"><span class="chip">Aveda Concept salon</span><span class="chip">Eco-responsible spa</span><span class="chip">Cruelty-free beauty</span></span></div>
  </div>
</section>'''


def services():
    cards = [
        ("hair.html", "aveda-folk", "01 · Hair & makeup", "Hair, <em>reimagined</em>", "Precision cuts, Aveda colour with 100% grey coverage, Botanical Repair and event makeup.", "From $30"),
        ("skin.html", "facial-white", "02 · Skin & esthetics", "Skin that <em>glows</em>", "Éminence Organics facials, nails, lashes, waxing and spray tan.", "From $75"),
        ("massage.html", "massage-hands", "03 · Massage & body", "Let it <em>all go</em>", "Fifteen techniques, from Lomi Lomi to hot stones, plus wraps and balneotherapy.", "From $105"),
        ("medispa.html", "laser", "04 · Medispa & laser", "Results, <em>safely</em>", "Cynosure Elite+ laser, mesotherapy, photorejuvenation and clinical peels.", "From $45"),
        ("weddings.html", "bridal-curls", "05 · Bridal", "Your <em>big day</em>", "Trials, the whole party, and a team that comes to you.", "From $90"),
        ("rituals.html", "ritual-head-to-toe", "06 · Spa rituals", "Half-day <em>bliss</em>", "Curated packages for you, your mom or someone you love.", "From $109"),
    ]
    html = []
    for i, (href, im, tag, title, desc, frm) in enumerate(cards):
        html.append(f'''<a class="svc" href="{href}" data-reveal>
  {img(im, "", "(min-width: 1100px) 40vw, (min-width: 720px) 50vw, 100vw")}
  <div class="svc-top"><span class="mono">{tag}</span><span class="arrow">{ic("arrow")}</span></div>
  <div class="svc-body"><span class="from">{frm}</span><h3>{title}</h3><p>{desc}</p></div>
</a>''')
    html.append(f'''<a class="svc svc--text" href="{GIFT}" target="_blank" rel="noopener" data-reveal>
  <div class="svc-top" style="position:static"><span class="mono" style="background:var(--ink);color:var(--lime)">Gift cards</span><span class="arrow">{ic("arrow-up")}</span></div>
  <div class="svc-body" style="padding:0"><h3 style="color:var(--ink)">Give a <em style="color:var(--ink)">moment.</em></h3><p>Any amount, any service, never expires. Delivered by email in seconds.</p></div>
</a>''')
    return f'''<section class="section section--flush-top" id="services">
  <div class="container">
    {sec_head("03", "Services", "100+ treatments", "Everything you need, <em class='accent'>under one roof.</em>", "From a quick brow tidy to a four-hour ritual, every service is delivered by a specialist, never a generalist.")}
    <div class="bento" data-stagger>{"".join(html)}</div>
  </div>
</section>'''


def bridal():
    return f'''<section class="frame is-dark grain">
  <div class="container section">
    {sec_head("04", "Weddings", "Now booking wedding season", "Your wedding day, <em class='accent'>beautifully yours.</em>")}
    <div class="feature">
      <div class="collage" data-stagger>
        <figure class="c1" data-reveal="clip">{img("bridal-curls", "Bride with long, glossy cascading curls", "(min-width: 1000px) 30vw, 66vw")}</figure>
        <figure class="c2" data-reveal="clip">{img("bridal-updo", "Elegant low bridal chignon", "(min-width: 1000px) 16vw, 33vw")}</figure>
        <figure class="c3" data-reveal="clip">{img("bridal-jewel", "Bridal makeup with a jewelled headpiece", "(min-width: 1000px) 16vw, 33vw")}</figure>
        <figure class="c4" data-reveal="clip">{img("bridal-bouquet", "Bride holding a soft pink bouquet", "(min-width: 1000px) 16vw, 33vw")}</figure>
        <div class="c5" data-reveal><strong>15<span style="font-size:.5em">km</span></strong><span>Beauty in Action: our team comes to your home, hotel or venue.</span></div>
      </div>
      <div class="stack">
        <p class="lead" data-reveal>Carole and her team have styled and made up dozens of brides, always starting from your personality and your vision. Elegant updo, braids or natural waves: the look you have always pictured, made to last until the last dance.</p>
        <ul class="ticks" role="list" data-reveal>
          <li><span class="t">01</span><div><strong>A trial before the big day</strong><span>Hair and makeup trials at the salon, so nothing is left to chance.</span></div></li>
          <li><span class="t">02</span><div><strong>The whole wedding party</strong><span>Bridesmaids, mothers, flower girls, the groom and your guests.</span></div></li>
          <li><span class="t">03</span><div><strong>We come to you</strong><span>On-location within 15 km, for parties of 4 or more.</span></div></li>
        </ul>
        <div class="btn-row" data-reveal>{btn("Build your bridal quote", "weddings.html#quote", "lime")}{btn("See the bridal menu", "weddings.html#menu", "ghost")}</div>
      </div>
    </div>
  </div>
</section>'''


def finder():
    def opt(val, em, title, sub, final=False):
        f = " data-final" if final else ""
        return f'<button type="button" data-value="{val}"{f}><span class="em" aria-hidden="true">{em}</span><span><strong>{title}</strong><small>{sub}</small></span>{ic("arrow")}</button>'
    return f'''<section class="section" id="finder">
  <div class="container">
    {sec_head("05", "Treatment finder", "Three taps · 20 seconds", "Not sure where <em class='accent'>to start?</em>", "Tell us how you want to feel. We'll match you with the treatment our team would recommend in person.")}
    <div class="finder" data-finder data-reveal>
      <div class="finder-side">
        <div class="finder-progress" aria-hidden="true"><i class="is-on"></i><i></i><i></i><i></i></div>
        <div class="stack" style="--stack:18px">
          <h3 class="h3">Your perfect visit, <em>in three taps.</em></h3>
          <p>Every recommendation comes straight from our menu, with real prices and a direct link to book.</p>
        </div>
        <span class="mono">Prefer a human? Call 450 455-7999</span>
      </div>
      <div class="finder-main">
        <div class="finder-step is-active" data-key="need">
          <p class="eyebrow"><span class="num">Step 1 / 3</span></p>
          <p class="finder-q">What would feel amazing right now?</p>
          <div class="finder-opts">
            {opt("relax", ic("leaf"), "Melt the stress away", "Massage, warmth, quiet")}
            {opt("skin", ic("spark"), "Glowing skin", "Facials and skin care")}
            {opt("hair", ic("scissors"), "A fresh new look", "Cut, colour, care")}
            {opt("results", ic("shield"), "Visible results", "Laser and medical aesthetics")}
            {opt("bridal", ic("ring"), "I'm getting married", "Bridal hair and makeup", True)}
            {opt("gift", ic("gift"), "A gift for someone", "Gift cards and rituals", True)}
          </div>
        </div>
        <div class="finder-step" data-key="time">
          <p class="eyebrow"><span class="num">Step 2 / 3</span></p>
          <p class="finder-q">How much time can you give yourself?</p>
          <div class="finder-opts">
            {opt("short", ic("clock"), "Up to 90 minutes", "A lunch-break reset")}
            {opt("half", ic("sun"), "A couple of hours", "A proper escape")}
            {opt("day", ic("crown"), "Half a day or more", "The full ritual")}
          </div>
          <button class="finder-back" type="button" data-finder-back>{ic("left")} Back</button>
        </div>
        <div class="finder-step" data-key="who">
          <p class="eyebrow"><span class="num">Step 3 / 3</span></p>
          <p class="finder-q">Who is it for?</p>
          <div class="finder-opts">
            {opt("me", ic("user"), "Just me", "Me-time, finally")}
            {opt("two", ic("users"), "Me and someone", "Friend, partner, mom")}
            {opt("gift", ic("heart"), "It's a gift", "Make someone's day")}
          </div>
          <button class="finder-back" type="button" data-finder-back>{ic("left")} Back</button>
        </div>
        <div class="finder-step">
          <div class="finder-result" aria-live="polite"></div>
          <button class="finder-back" type="button" data-finder-restart>{ic("left")} Start over</button>
        </div>
      </div>
    </div>
  </div>
</section>'''


def rituals():
    cards = []
    for slug, name, kicker, im, dur, price, cats, inc in RITUALS[:8]:
        title = ritual_title(name)
        cards.append(f'''<article class="hs-card">
  <figure>{img(im, "", "420px")}<span class="chip">{dur}</span></figure>
  <div class="body"><h3>{title}</h3><p>{E(kicker)}.</p>
    <div class="foot"><div class="price"><small>Ritual</small>${price}</div>{btn("Details", "rituals.html#" + slug, "ghost", small=True)}</div>
  </div>
</article>''')
    return f'''<section class="frame is-night grain" id="rituals">
  <div class="section" style="padding-bottom:calc(var(--section)*.7)">
    <div class="container">{sec_head("06", "Spa rituals", "From $109", "Half a day <em class='accent'>that changes everything.</em>", "Our signature packages pair massage, skin and nail care into one seamless escape. Book one for yourself, or gift it.")}</div>
    <div class="hs" data-hscroll data-scroller>
      <div class="hs-track">
        {"".join(cards)}
        <article class="hs-card" style="background:var(--lime);color:var(--ink);justify-content:space-between;padding:clamp(22px,2.4vw,32px)">
          <span class="mono">10 rituals in total</span>
          <h3 style="font-size:clamp(2rem,3vw,2.8rem)">Find the one that <em style="color:var(--ink)">feels like you.</em></h3>
          <div class="btn-row">{btn("All spa rituals", "rituals.html", "")}{btn("Gift a ritual", GIFT, "ghost", ext=True)}</div>
        </article>
      </div>
      <div class="hs-progress"><i></i></div>
      <div class="container" style="margin-top:24px;display:flex;justify-content:flex-end"><div class="hs-nav"><button type="button" data-prev aria-label="Previous">{ic("left")}</button><button type="button" data-next aria-label="Next">{ic("arrow")}</button></div></div>
    </div>
  </div>
</section>'''


def promise():
    return f'''<section class="section">
  <div class="container">
    {sec_head("07", "Our promise", "Aveda · Éminence · Cruelty-free", "Beauty that's kind <em class='accent'>to the planet, too.</em>")}
    <div class="values" data-stagger>
      <article class="value value--dark" data-reveal><span class="ico">{ic("flower")}</span><h3>An Aveda Concept salon</h3><p>Plant-powered hair colour and care, crafted from flower and plant essences. Gentle on the scalp, brilliant on the hair.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("tree")}</span><h3>A tree for every product</h3><p>Éminence Organics plants a tree for every product sold, so every facial leaves a little more green behind.</p></article>
      <article class="value value--lime" data-reveal><span class="ico">{ic("rabbit")}</span><h3>Cruelty-free, always</h3><p>We choose brands that never test on animals. Beauty without compromise, and without cruelty.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("leaf")}</span><h3>An eco-responsible spa</h3><p>Organic ingredients, mindful protocols and a team that treats your wellbeing, and the earth's, as one.</p></article>
    </div>
  </div>
</section>'''


def stats():
    return f'''<section class="section section--flush-top">
  <div class="container">
    <div class="stats" data-stagger>
      <div class="stat" data-reveal><strong><span data-count="45">45</span><sup>+</sup></strong><span>years of experience behind Carole's name on the door</span></div>
      <div class="stat" data-reveal><strong><span data-count="200">200</span><sup>+</sup></strong><span>Google reviews from guests across Vaudreuil-Soulanges</span></div>
      <div class="stat" data-reveal><strong><span data-count="15">15</span><sup>+</sup></strong><span>massage techniques, one for every personality</span></div>
      <div class="stat" data-reveal><strong><span data-count="10">10</span><sup>langs</sup></strong><span>spoken by our team, from French and English to Punjabi and Greek</span></div>
    </div>
  </div>
</section>'''


def reviews():
    variants = ["", "lime", "", "dark", "", "", "lime", "", "dark", "", "", ""]
    cards = "".join(review_card(n, d, t, variants[i % len(variants)]) for i, (n, d, t) in enumerate(REVIEWS))
    return f'''<section class="section is-paper2" id="reviews">
  <div class="container">
    {sec_head("08", "Kind words", "Real Google reviews", "Loved by <em class='accent'>Vaudreuil-Dorion.</em>")}
    <div class="review-head" data-reveal style="margin-bottom:28px">
      <div class="score"><strong>200+</strong><span>Google reviews and counting, in French and English</span></div>
      <div class="btn-row"><div class="round-btns"><button type="button" data-prev aria-label="Previous reviews">{ic("left")}</button><button type="button" data-next aria-label="Next reviews">{ic("arrow")}</button></div>{btn("Read all reviews", REVIEW_GOOGLE, "ghost", ext=True, small=True)}</div>
    </div>
  </div>
  <div data-scroller><div class="reviews-track" data-reveal="fade">{cards}</div></div>
</section>'''


def team():
    pick = ["carole", "jeff", "christelle", "melanie", "anna-rose", "genevieve", "rebecca", "mila", "dorianne", "aarti"]
    by = {t[1]: t for t in TEAM}
    people = "".join(
        f'<a class="person" href="team.html#{s}"><figure>{img("team/" + s, "Portrait of " + by[s][0], "280px")}</figure><div><strong>{E(by[s][0])}</strong><span>{E(by[s][2])}</span></div></a>'
        for s in pick)
    return f'''<section class="section">
  <div class="container">
    {sec_head("09", "The team", "35+ specialists", "The hands <em class='accent'>behind the magic.</em>", "Every guest is matched with a specialist trained for exactly what they need, and many of our guests have followed theirs for a decade.", extra="")}
  </div>
  <div data-scroller><div class="people" data-reveal="fade">{people}</div></div>
  <div class="container mt-l" data-reveal><div class="btn-row" style="justify-content:space-between"><a class="link-arrow" href="team.html">Meet all 26 featured specialists {ic("arrow")}</a><div class="round-btns"><button type="button" data-prev aria-label="Previous">{ic("left")}</button><button type="button" data-next aria-label="Next">{ic("arrow")}</button></div></div></div>
</section>'''


def promo():
    return f'''<section class="section section--flush-top">
  <div class="container">
    <div class="promo" data-stagger>
      <article class="promo-card promo-card--gift" data-reveal>
        <div class="copy"><span class="eyebrow" style="color:var(--ink-2)"><span class="num" style="color:var(--ink)">✦</span> Gift cards</span><h2 class="h3">The gift that's <em>never the wrong size.</em></h2><p>Any amount or any ritual. Emailed instantly, and it never expires.</p></div>
        <div class="btn-row">{btn("Buy a gift card", GIFT, "", ext=True)}</div>
        <div class="giftcard" aria-hidden="true"><img src="assets/img/logo-mark.png" alt=""><div><span class="mono">Gift card</span><br><strong>Naturally yours.</strong></div></div>
      </article>
      <article class="promo-card promo-card--app on-dark" data-reveal>
        <div class="copy"><span class="eyebrow"><span class="num">✦</span> The CSP app</span><h2 class="h3">Your spa, <em class="accent">in your pocket.</em></h2><p class="muted" style="color:var(--on-dark-2)">See live availability, book and rebook, and get exclusive app-only promotions.</p></div>
        <div class="store-badges"><a href="{APPLE}" target="_blank" rel="noopener">{ic("apple")}<span><small>Download on the</small>App Store</span></a><a href="{GOOGLE_PLAY}" target="_blank" rel="noopener">{ic("play")}<span><small>Get it on</small>Google Play</span></a></div>
        {phone_mock()}
      </article>
    </div>
  </div>
</section>'''


def build():
    body = "\n".join([hero(), marquee(), statement(), services(), bridal(), finder(), rituals(), promise(), stats(), reviews(), team(), promo(),
                      cta_band()])
    return page("index.html", "Carole St-Pierre salon & spa | Aveda hair salon & spa in Vaudreuil-Dorion",
                "Aveda Concept hair salon and eco-responsible spa in Vaudreuil-Dorion: hair, facials, massage, laser, medical aesthetics and bridal styling. Open 7 days. Book online.",
                body, loader=True)
