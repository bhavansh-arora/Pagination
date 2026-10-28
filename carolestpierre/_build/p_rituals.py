from content import RITUALS, RITUAL_CATS
from csp import (BOOK, GIFT, btn, cta_band, ic, img, page, phero, ritual_title, sec_head)


def rituals():
    cards = []
    for i, (slug, name, kicker, im, dur, price, cats, inc) in enumerate(RITUALS):
        dark = " ritual--dark" if i % 3 == 1 else ""
        items = "".join(f"<li>{ic('check')}<span>{x}</span></li>" for x in inc)
        cards.append(f'''<article class="ritual{dark}" id="{slug}" data-cat="{cats}" data-reveal>
  <figure>{img(im, "", "(min-width: 1000px) 45vw, 100vw")}<span class="chip">{dur}</span></figure>
  <div class="body">
    <span class="kicker">{kicker}</span>
    <h3>{ritual_title(name)}</h3>
    <ul role="list">{items}</ul>
    <div class="foot">
      <div class="price"><strong>${price}</strong><span>{dur} · before taxes</span></div>
      <div class="btn-row">{btn("Book", BOOK, "lime" if dark else "", ext=True, small=True)}{btn("Gift it", GIFT, "ghost", ext=True, small=True, icon="gift")}</div>
    </div>
  </div>
</article>''')
    filters = "".join(f'<button type="button" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t} <span class="c"></span></button>' for k, t in RITUAL_CATS)
    return f'''<section class="section" id="rituals">
  <div class="container">
    {sec_head("01", "Spa rituals", "10 signature packages", "Choose <em class='accent'>your escape.</em>", "The virtues of essential oils and the best organic ingredients, applied by professionals who have mastered every protocol. Treat yourself to the best, without compromise.")}
    <div class="filters" data-filter-group="ritual-list" role="group" aria-label="Filter rituals" data-reveal>{filters}</div>
    <div class="rituals mt-m" id="ritual-list">{"".join(cards)}</div>
    <p class="price-note">{ic("info")}<span>Prices exclude taxes. WAYSPA cards can't be used to purchase spa packages.</span></p>
  </div>
</section>'''


def gift():
    return f'''<section class="frame is-lime">
  <div class="container section">
    <div class="split split--center">
      <div class="stack">
        <span class="eyebrow" style="color:var(--ink-2)"><span class="num" style="color:var(--ink)">(02)</span> — Gift cards</span>
        <h2 class="h2" data-split><span class="ln">Give them</span><span class="ln"><em>a whole afternoon.</em></span></h2>
        <p class="lead" style="color:var(--ink-2)">Any ritual, or any amount, delivered by email in seconds. Our gift cards never expire, and a lost card is never lost: it's saved in our system.</p>
        <div class="btn-row">{btn("Buy a gift card", GIFT, "", ext=True)}{btn("Read the gift card FAQ", "visit.html#faq", "ghost")}</div>
      </div>
      <div class="promo-card promo-card--gift" style="min-height:420px;background:var(--forest);color:var(--on-dark)" data-reveal>
        <span class="eyebrow"><span class="num">✦</span> Most gifted</span>
        <div class="stack" style="--stack:12px"><h3 class="h3">Thank You <em class="accent">Mom</em></h3><p style="color:var(--on-dark-2)">Manicure, pedicure, a 60-minute massage and makeup. Four hours, $325.</p></div>
        <div class="giftcard" aria-hidden="true" style="background:var(--lime);color:var(--ink)"><img src="assets/img/logo-mark.png" alt=""><div><span class="mono" style="color:var(--ink-2)">Gift card</span><br><strong>Naturally yours.</strong></div></div>
      </div>
    </div>
  </div>
</section>'''


def etiquette():
    return f'''<section class="section">
  <div class="container">
    {sec_head("03", "Spa etiquette", "For a perfect visit", "Make the most <em class='accent'>of every minute.</em>")}
    <div class="values" data-stagger>
      <article class="value" data-reveal><span class="ico">{ic("clock")}</span><h3>Arrive 10 minutes early</h3><p>Settle in, breathe, and start your treatment on time.</p></article>
      <article class="value value--dark" data-reveal><span class="ico">{ic("phone")}</span><h3>Disconnect to reconnect</h3><p>Set your phone to silent, or better yet, switch it off.</p></article>
      <article class="value" data-reveal><span class="ico">{ic("heart")}</span><h3>Robe &amp; slippers waiting</h3><p>For packages, change in comfort and leave your things in our changing room.</p></article>
      <article class="value value--lime" data-reveal><span class="ico">{ic("spark")}</span><h3>Gratuities</h3><p>Always at your discretion, by cash, credit or debit.</p></article>
    </div>
  </div>
</section>'''


def build():
    hero = phero("Spa rituals", ["Half a day,", "<em>whole new you.</em>"],
                 "Exclusive massage and spa packages for a unique sensory experience, on your own or with someone you love. Book one for yourself, or give it as a gift.",
                 "aveda-gazebo", "An Aveda campaign image of a woman in a lakeside pavilion",
                 [("Rituals from", "$109"), ("Duration", "1 h 30 to 4 h"), ("Products", "Aveda &amp; Éminence"), ("Gift cards", "Never expire")],
                 [("rituals", "All rituals"), ("the-express", "Express"), ("queen-for-a-day", "Queen for a Day"), ("mom-to-be", "Mom-To-Be"), ("for-men", "For Men")],
                 tag="Gift-ready",
                 cta=f'<div class="btn-row">{btn("Book a ritual", BOOK, "lime", ext=True)}{btn("Gift a ritual", GIFT, "ghost", ext=True, icon="gift")}</div>')
    body = "\n".join([hero, rituals(), gift(), etiquette(), cta_band("You deserve <em>this.</em>")])
    return page("rituals.html", "Spa Packages & Rituals in Vaudreuil-Dorion | Carole St-Pierre salon & spa",
                "Ten signature spa packages in Vaudreuil-Dorion, from the 90-minute Express to Queen for a Day: massage, Éminence facials, manicures and pedicures. Gift cards that never expire.", body)
