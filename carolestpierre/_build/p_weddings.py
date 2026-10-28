from content import WEDDING_REVIEW
from csp import (EMAIL, PHONE, TEL, E, btn, faq, ic, img, lines, page, phero, price_row, sec_head)


def approach():
    return f'''<section class="section" id="approach">
  <div class="container">
    {sec_head("01", "Our approach", "Bridal by Carole St-Pierre", "Nothing but the best, <em class='accent'>for the best day.</em>",
              "My team and I have styled and made up dozens of brides, always taking their personality, preferences and vision into consideration, so each one looks and feels her absolute best.")}
    <div class="values" data-stagger>
      <article class="value value--dark" data-reveal><span class="ico">{ic("spark")}</span><h3>A look that's truly you</h3><p>An elegant updo, romantic braids or natural waves. We create the hairstyle you've always pictured, built to last until the last dance.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("calendar")}</span><h3>Trial first, peace of mind</h3><p>We recommend a hair and makeup trial at the salon before the big day, so every choice is confirmed and nothing is left to chance.</p></article>
      <article class="value value--lime" data-reveal><span class="ico">{ic("users")}</span><h3>Your whole party</h3><p>The groom, bridesmaids, flower girls, mothers and even your guests: one team, one timeline, one beautiful result.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("car")}</span><h3>Beauty in Action</h3><p>Our on-location team comes to your home, hotel or venue within 15 km, for a minimum of four people.</p></article>
    </div>
  </div>
</section>'''


def process():
    steps = [
        ("Inquire", "Tell us your date, venue and party size. Use the quote builder below to send us everything in one go."),
        ("Trial", "Book your hair and makeup trial at the salon. Bring inspiration photos, your veil or accessories."),
        ("Plan", "We build your chair schedule backwards from your ready-by time, so everyone is calm and on time."),
        ("Your day", "In the salon or on location, we arrive prepared and leave you camera-ready, with touch-up tips."),
    ]
    cards = "".join(f'<article class="step" data-reveal><span class="n">Step {i:02d}</span><h3>{t}</h3><p>{d}</p><span class="big" aria-hidden="true">{i:02d}</span></article>'
                    for i, (t, d) in enumerate(steps, 1))
    return f'''<section class="frame is-dark grain">
  <div class="container section">
    {sec_head("02", "How it works", "Four calm steps", "From first hello <em class='accent'>to first dance.</em>")}
    <div class="steps steps--4" data-stagger>{cards}</div>
  </div>
</section>'''


def menu():
    salon = f'''<div class="price-cols">
  <div>
    <h3 class="sub">For the bride · hair</h3>
    <div class="price-list">
      {price_row("Updo hairstyle", "$90–$125", "Your wedding-day style, from sleek chignon to romantic braids.")}
      {price_row("Hair trial", "$75–$100", "Test and perfect your look before the big day.")}
    </div>
    <h3 class="sub mt-l">For the bride · makeup</h3>
    <div class="price-list">
      {price_row("Bride makeup, day of wedding", "$85–$100")}
      {price_row("Makeup trial", "$75–$100")}
      {price_row("Add false lashes", "$10")}
    </div>
  </div>
  <div>
    <h3 class="sub">Bridesmaids, guests &amp; groom · hair</h3>
    <div class="price-list">
      {price_row("Half-up hairstyle", "$85–$95")}
      {price_row("Blow-dry, short hair", "$55–$65")}
      {price_row("Blow-dry, long hair", "$65–$85")}
      {price_row("Flower girls", "$55", sub="12 and under")}
      {price_row("Groom", "$45")}
      {price_row("Extra-long hair", "+$25")}
      {price_row("Early start, 7–8 AM", "+$25")}
    </div>
    <h3 class="sub mt-l">Bridesmaids, guests &amp; groom · makeup</h3>
    <div class="price-list">
      {price_row("Bride's guests", "$75", sub="+$10 lashes")}
      {price_row("Flower girl", "$35")}
      {price_row("Groom", "$45")}
    </div>
  </div>
</div>'''
    location = f'''<div class="price-cols">
  <div>
    <h3 class="sub">For the bride</h3>
    <div class="price-list">
      {price_row("Hair &amp; makeup on location", "$350", "$175 hair and $175 makeup, wherever you're getting ready.", tag="Signature")}
      {price_row("Hair and makeup trials", "$75–$100", "Trials are held at the salon.")}
    </div>
    <div class="callout callout--lime mt-m">
      <h3>Good to know</h3>
      <ul class="checklist" role="list">
        <li>{ic("check")}<span>We travel within a <strong>15 km radius</strong> for a minimum of <strong>4 people</strong>.</span></li>
        <li>{ic("check")}<span>Beyond 15 km, a <strong>$100 team travel fee</strong> applies.</span></li>
        <li>{ic("check")}<span>Hair, makeup, or both: you choose for every member of your party.</span></li>
      </ul>
    </div>
  </div>
  <div>
    <h3 class="sub">Bridesmaids &amp; guests</h3>
    <div class="price-list">
      {price_row("Updo hairstyle", "$150")}
      {price_row("Stylized or half-up hairstyle", "$125")}
      {price_row("Blow-dry styling", "$85")}
      {price_row("Makeup", "$125")}
      {price_row("Makeup with false lashes", "$145")}
    </div>
  </div>
</div>'''
    return f'''<section class="section" id="menu">
  <div class="container">
    {sec_head("03", "Bridal menu", "Prices before taxes", "Clear pricing, <em class='accent'>no surprises.</em>", "Choose the salon, or let our Beauty in Action team come to you. Ranges reflect hair length, thickness and the specialist's level.")}
    <div data-tabs data-reveal>
      <div class="tabs-list" role="tablist" aria-label="Where you get ready">
        <button type="button" role="tab" id="t-salon" aria-selected="true" aria-controls="p-salon">In the salon</button>
        <button type="button" role="tab" id="t-loc" aria-selected="false" aria-controls="p-loc" tabindex="-1">Beauty in Action · on location</button>
      </div>
      <div class="mt-l" role="tabpanel" id="p-salon" aria-labelledby="t-salon">{salon}</div>
      <div class="mt-l" role="tabpanel" id="p-loc" aria-labelledby="t-loc" hidden>{location}</div>
    </div>
  </div>
</section>'''


def quote():
    return f'''<section class="section is-paper2" id="quote">
  <div class="container">
    {sec_head("04", "Quote builder", "Live estimate", "Build your bridal quote <em class='accent'>in 60 seconds.</em>", "Add your party, set your ready-by time, and we'll estimate your total and suggest a start time. Send it to us in one tap.")}
    <div class="qb" data-quote>
      <div class="qb-panel" data-reveal>
        <div class="qb-mini" aria-hidden="true"><span class="mono">Estimate</span><strong data-qb-total-mini>$0</strong><a href="#qb-summary">See details ↓</a></div>
        <div class="qb-block">
          <span class="eyebrow"><span class="num">01</span> Where are you getting ready?</span>
          <div data-tabs data-qb-mode>
            <div class="tabs-list" role="tablist" aria-label="Location">
              <button type="button" role="tab" data-value="salon" aria-selected="true">In the salon</button>
              <button type="button" role="tab" data-value="location" aria-selected="false" tabindex="-1">On location</button>
            </div>
          </div>
        </div>
        <div class="qb-block"><span class="eyebrow"><span class="num">02</span> The bride</span><div data-qb-list="bride"></div></div>
        <div class="qb-block"><span class="eyebrow"><span class="num">03</span> Your party</span><div data-qb-list="party"></div></div>
        <div class="qb-block"><span class="eyebrow"><span class="num">04</span> Extras &amp; timing</span>
          <div data-qb-list="extras"></div>
          <div class="qb-row"><div><strong>Early start, 7–8 AM</strong><small>+$25 per person in the chair</small></div><label class="switch"><input type="checkbox" id="qb-early" aria-label="Early start"><span></span></label></div>
          <div class="qb-row"><div><strong>Everyone ready by</strong><small>We'll suggest when to start</small></div><div class="field" style="min-width:140px"><input type="time" id="qb-ready" value="11:00" aria-label="Ready by time"></div></div>
        </div>
      </div>
      <aside class="qb-summary" id="qb-summary" aria-live="polite" data-reveal>
        <span class="eyebrow"><span class="num">✦</span> Your estimate</span>
        <div class="qb-total"><strong data-qb-total>$0</strong><span class="muted" data-qb-people>0 people</span></div>
        <p class="qb-alert" data-qb-min hidden>{ic("info")} On-location bookings are for 4 people or more. Add your party, or choose the salon.</p>
        <ul class="qb-lines" data-qb-lines></ul>
        <div class="qb-schedule"><span class="mono">Suggested start time</span><strong data-qb-start>—</strong><span>Based on a team of 2 to 3 artists. We confirm your exact schedule after your inquiry.</span>
          <span class="qb-alert" data-qb-early-note hidden>{ic("clock")} Starts before 8 AM include the early-start supplement.</span></div>
        <button class="btn btn--lime" type="button" data-qb-send style="justify-self:start">Send this quote to Carole <span class="ic">{ic("arrow")}</span></button>
        <p class="qb-fine">Estimate before taxes, based on the published wedding menu. Final pricing depends on hair length and thickness and is confirmed by our team.</p>
      </aside>
    </div>
  </div>
</section>'''


def gallery():
    items = [("bridal-look-5", "Soft glam"), ("bridal-updo", "Low chignon"), ("bridal-brunette", "Bridal makeup"), ("bridal-curls", "Hollywood curls"),
             ("bridal-jewel", "Jewelled look"), ("bridal-look-2", "Natural glow"), ("bridal-bouquet", "The details"), ("bridal-look-4", "By Carole"),
             ("bridal-brunette-2", "Timeless"), ("bridal-look-1", "Smoky eye"), ("bridal-robe", "Getting ready"), ("bridal-look-3", "Classic")]
    figs = "".join(f'<figure data-reveal>{img(n, "Bridal look: " + c, "(min-width: 1240px) 25vw, (min-width: 900px) 33vw, 50vw")}<figcaption>{c}</figcaption></figure>' for n, c in items)
    return f'''<section class="section" id="gallery">
  <div class="container">
    {sec_head("05", "Real brides", "Styled by our team", "Looks we're <em class='accent'>proud of.</em>")}
    <div class="gallery">{figs}</div>
  </div>
</section>'''


def testimonial():
    n, d, t = WEDDING_REVIEW
    return f'''<section class="section section--flush-top">
  <div class="container">
    <figure class="band" data-parallax-root data-reveal="fade">
      {img("bridal-bouquet", "Bride holding her bouquet", "100vw", parallax=12)}
      <div class="band-body">
        <span class="eyebrow" style="color:var(--on-dark-2)"><span class="num" style="color:var(--lime)">✦</span> From a bride</span>
        <blockquote class="h3" style="font-weight:600">“{E(t)}”</blockquote>
        <figcaption class="mono" style="color:var(--on-dark-2)">{E(n)} · Google review</figcaption>
      </div>
    </figure>
  </div>
</section>'''


def bridal_faq():
    items = [
        ("When should we book?", "<p>As soon as your date is set. Wedding season fills quickly, and booking early lets us plan your trial and reserve the right team for your party.</p>"),
        ("Do you really come to us?", "<p>Yes. Our Beauty in Action team travels to your home, hotel or venue within 15 km, for a minimum of 4 people, for hair, makeup or both. Beyond 15 km we add a $100 travel fee for the team.</p>"),
        ("Is a trial necessary?", "<p>We highly recommend it. Hair and makeup trials take place at the salon and let you confirm every choice before the big day.</p>"),
        ("What if we need to start very early?", "<p>We can. Services starting between 7:00 and 8:00 AM include a $25 supplement. Use the quote builder to see a suggested start time for your party.</p>"),
        ("I have very long or thick hair. Does it change the price?", "<p>Extra-long hair adds $25. Ranges on the menu also reflect length, thickness and the stylist's experience level.</p>"),
        ("Can you take care of the groom and the kids?", "<p>Of course. Groom hair or makeup is $45, and flower girls (12 and under) are $55 for hair and $35 for makeup in the salon.</p>"),
    ]
    return f'''<section class="section section--flush-top" id="faq">
  <div class="container">
    <div class="split split--wide-right">
      <div class="sticky-col">{sec_head("06", "Bridal FAQ", "", "Questions, <em class='accent'>answered.</em>", "Something else on your mind? Call us at " + PHONE + ".")}</div>
      <div data-reveal>{faq(items)}</div>
    </div>
  </div>
</section>'''


def inquiry():
    return f'''<section class="frame is-dark grain" id="inquiry">
  <div class="container section">
    <div class="split split--wide-right">
      <div class="stack">
        <span class="eyebrow"><span class="num">(07)</span> — Bridal inquiry</span>
        <h2 class="h2" data-split><span class="ln">Let's plan</span><span class="ln"><em class="accent">your day.</em></span></h2>
        <p class="lead">Share a few details and we'll come back with availability, your trial options and a confirmed quote.</p>
        <ul class="ticks" role="list">
          <li><span class="t">{ic("mail")}</span><div><strong><a href="mailto:{EMAIL}">{EMAIL}</a></strong><span>Bridal inquiries &amp; availability</span></div></li>
          <li><span class="t">{ic("phone")}</span><div><strong><a href="{TEL}">{PHONE}</a></strong><span>Open 7 days</span></div></li>
        </ul>
      </div>
      <form class="form-card is-dark" data-form data-subject="Bridal inquiry" data-success="Thank you! Carole's team will reply within one business day.">
        <div class="fields fields--2">
          <div class="field"><label for="bi-name">Your name</label><input id="bi-name" name="name" required autocomplete="name"></div>
          <div class="field"><label for="bi-email">Email</label><input id="bi-email" name="email" type="email" required autocomplete="email"></div>
          <div class="field"><label for="bi-phone">Phone</label><input id="bi-phone" name="phone" type="tel" autocomplete="tel"></div>
          <div class="field"><label for="bi-date">Wedding date</label><input id="bi-date" name="wedding_date" type="date"></div>
          <div class="field"><label for="bi-where">Getting ready at</label><select id="bi-where" name="location"><option>The salon</option><option>Home or hotel (within 15 km)</option><option>Venue beyond 15 km</option><option>Not sure yet</option></select></div>
          <div class="field"><label for="bi-size">People needing services</label><input id="bi-size" name="party_size" type="number" min="1" max="30" value="4"></div>
          <div class="field full"><label for="bi-msg">Tell us about your day</label><textarea id="bi-msg" name="message" placeholder="Your vision, inspiration, timing..."></textarea></div>
        </div>
        <div class="btn-row" style="justify-content:space-between">
          <button class="btn btn--lime" type="submit">Send my inquiry <span class="ic">{ic("arrow")}</span></button>
          <p class="consent" style="max-width:24em">We only use your details to answer your inquiry.</p>
        </div>
        <p class="form-status" role="status"></p>
      </form>
    </div>
  </div>
</section>'''


def build():
    hero = phero("Weddings", ["Your wedding,", "<em>beautifully</em> yours."],
                 "Bridal hair and makeup by Carole St-Pierre's team: trials at the salon, the whole wedding party, and a Beauty in Action crew that comes to you.",
                 "bridal-look-5", "A bride with soft glam makeup and loose waves",
                 [("Bride from", "$90"), ("Trials", "At the salon"), ("On location", "Within 15 km"), ("Party minimum", "4 people")],
                 [("approach", "Approach"), ("menu", "Bridal menu"), ("quote", "Quote builder"), ("gallery", "Gallery"), ("faq", "FAQ"), ("inquiry", "Inquire")],
                 tag="Now booking wedding season",
                 cta=f'<div class="btn-row">{btn("Build my quote", "#quote", "lime")}{btn("Ask about my date", "#inquiry", "ghost")}</div>')
    body = "\n".join([hero, approach(), process(), menu(), quote(), gallery(), testimonial(), bridal_faq(), inquiry()])
    return page("weddings.html", "Wedding Hair & Makeup in Vaudreuil-Dorion | Carole St-Pierre salon & spa",
                "Bridal hair and makeup in Vaudreuil-Dorion: trials, the whole wedding party, and on-location Beauty in Action within 15 km. Build your quote online.", body)
