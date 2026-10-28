from content import FAQ_GENERAL
from csp import (ADDRESS, BOOK, CITY, EMAIL, HOURS, MAPS, PHONE, TEL, btn, cta_band, faq, ic, page, phero, sec_head)


def contact():
    hours = "".join(f'<li data-day="{d}"><span>{n}</span><span>{t}</span></li>' for n, d, t in HOURS)
    return f'''<section class="section" id="contact">
  <div class="container">
    <div class="contact-cards" data-stagger>
      <a class="ccard" href="{TEL}" data-reveal><span class="ico">{ic("phone")}</span><strong>{PHONE}</strong><span>Call to book, 7 days a week</span></a>
      <a class="ccard" href="mailto:{EMAIL}" data-reveal><span class="ico">{ic("mail")}</span><strong>{EMAIL}</strong><span>Questions, bridal and group bookings</span></a>
      <a class="ccard" href="{MAPS}" target="_blank" rel="noopener" data-reveal><span class="ico">{ic("pin")}</span><strong>Get directions</strong><span>{ADDRESS}, {CITY}</span></a>
    </div>
    <div class="split mt-xl">
      <div class="stack" style="--stack:28px" data-reveal>
        <span class="eyebrow"><span class="num">(01)</span> — Opening hours</span>
        <h2 class="h2">Open <em class="accent">7 days.</em></h2>
        <p class="status" data-open-status></p>
        <ul class="hours" data-hours role="list">{hours}</ul>
        <p class="muted" style="font-size:.92rem">Holiday hours may vary. The app always shows live availability.</p>
      </div>
      <div class="map" data-reveal>
        <a class="map-fallback" href="{MAPS}" target="_blank" rel="noopener">{ic("pin")}<strong>3210 boul. de la Gare, suite 170</strong><span>Open in Google Maps ↗</span></a>
        <iframe title="Map to Carole St-Pierre salon &amp; spa" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Carole+St-Pierre+salon+%26+spa,+3210+boulevard+de+la+Gare,+Vaudreuil-Dorion,+QC&output=embed"></iframe>
      </div>
    </div>
  </div>
</section>'''


def form():
    return f'''<section class="frame is-dark grain" id="message">
  <div class="container section">
    <div class="split split--wide-right">
      <div class="stack">
        <span class="eyebrow"><span class="num">(02)</span> — Write to us</span>
        <h2 class="h2" data-split><span class="ln">How can we</span><span class="ln"><em class="accent">help?</em></span></h2>
        <p class="lead">Questions about a treatment, a group booking or a gift? Send us a note and our guest services team will reply within one business day.</p>
        <div class="btn-row">{btn("Or book online now", BOOK, "lime", ext=True)}</div>
      </div>
      <form class="form-card is-dark" data-form data-subject="Website message">
        <div class="fields fields--2">
          <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" required autocomplete="name"></div>
          <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" required autocomplete="email"></div>
          <div class="field"><label for="c-phone">Phone</label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div>
          <div class="field"><label for="c-topic">Topic</label><select id="c-topic" name="topic"><option>A treatment question</option><option>Group or event booking</option><option>Gift cards</option><option>Bridal</option><option>Careers</option><option>Something else</option></select></div>
          <div class="field full"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
        </div>
        <div class="btn-row" style="justify-content:space-between"><button class="btn btn--lime" type="submit">Send message <span class="ic">{ic("arrow")}</span></button><p class="consent">We only use your details to reply to you.</p></div>
        <p class="form-status" role="status"></p>
      </form>
    </div>
  </div>
</section>'''


def faq_section():
    return f'''<section class="section" id="faq">
  <div class="container">
    <div class="split split--wide-right">
      <div class="sticky-col">{sec_head("03", "FAQ", "", "Good <em class='accent'>to know.</em>", "Everything our front desk is asked most, in one place.")}</div>
      <div data-reveal>{faq(FAQ_GENERAL)}</div>
    </div>
  </div>
</section>'''


def policies():
    return f'''<section class="section section--flush-top" id="policies">
  <div class="container">
    {sec_head("04", "Policies", "Etiquette &amp; cancellation", "So everyone <em class='accent'>can relax.</em>")}
    <div class="price-cols">
      <div class="callout"><h3>Etiquette</h3>
        <p>Whether you visit for a few minutes or a few hours, my team and I will do everything it takes to offer you a complete sensory experience.</p>
        <ul class="checklist" role="list">
          <li>{ic("check")}<span>Arrive 10 minutes before your treatment.</span></li>
          <li>{ic("check")}<span>Set your phone to vibrate, or switch it off and reconnect with yourself.</span></li>
          <li>{ic("check")}<span>Spa packages include a robe and slippers, and a changing room for your belongings.</span></li>
          <li>{ic("check")}<span>Gratuities are at your discretion.</span></li>
        </ul></div>
      <div class="callout callout--dark"><h3>Cancellation policy</h3>
        <p>A credit card is required to hold your booking. Cancellations with less than 24 hours' notice incur a 50% fee charged to that card. Same-day cancellations are charged in full for the reserved service.</p>
        <p>Plans change, we understand: let us know as early as you can so another guest can enjoy the time.</p></div>
    </div>
  </div>
</section>'''


def build():
    hero = phero("Visit", ["Come in,", "<em>breathe out.</em>"],
                 "Find us at 3210 boulevard de la Gare in Vaudreuil-Dorion, steps from the train station, with easy parking. Open 7 days, with evenings until 8 PM.",
                 "salon-exterior", "The Carole St-Pierre salon storefront",
                 [("Address", "3210 boul. de la Gare, suite 170"), ("Phone", PHONE), ("Today", '<span class="status" data-open-status="short"></span>'), ("Parking", "Easy, on site")],
                 [("contact", "Hours &amp; map"), ("message", "Write to us"), ("faq", "FAQ"), ("policies", "Policies")], tag="Vaudreuil-Dorion",
                 cta=f'<div class="btn-row">{btn("Get directions", MAPS, "lime", ext=True, icon="pin")}{btn("Call " + PHONE, TEL, "ghost", icon="phone")}</div>')
    body = "\n".join([hero, contact(), form(), faq_section(), policies(), cta_band()])
    faq_schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a.replace("<p>", "").replace("</p>", "")}} for q, a in FAQ_GENERAL]}
    return page("visit.html", "Contact, Hours & FAQ | Carole St-Pierre salon & spa, Vaudreuil-Dorion",
                "Visit Carole St-Pierre salon & spa at 3210 boul. de la Gare, Vaudreuil-Dorion. Open 7 days. Hours, directions, FAQ, gift card questions and our cancellation policy.", body,
                extra_schema=[faq_schema])
