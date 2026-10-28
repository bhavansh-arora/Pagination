from csp import (BOOK, EMAIL, PHONE, ADDRESS, CITY, btn, lines, page)


def privacy():
    body = f'''<section class="frame phero grain">
  <div class="phero-inner">
    <div class="crumbs"><a href="index.html">Home</a><span>/</span><span>Privacy</span></div>
    <h1 class="phero-title" data-split>{lines("Your privacy,", "<em>respected.</em>")}</h1>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="letter prose" style="max-width:860px;font-size:1.05rem">
      <p class="mono muted">Last updated: October 2026</p>
      <h2 class="h3">What we collect</h2>
      <p>When you use a form on this site (contact, bridal inquiry, newsletter) we receive only what you type: typically your name, email, phone number, birthday (day and month, for your birthday offer) and your message. Online booking and gift cards are handled by our booking provider, Zenoti, under its own privacy policy.</p>
      <h2 class="h3">Why we collect it</h2>
      <p>To answer you, plan your appointments and, if you subscribed, send you our promotions. We never sell or rent your personal information.</p>
      <h2 class="h3">Cookies</h2>
      <p>This site doesn't use advertising cookies. Your browser may store small preferences, such as whether the intro animation has already played, which never leave your device. The map on our Visit page is provided by Google Maps, which may set its own cookies when it loads.</p>
      <h2 class="h3">Your rights</h2>
      <p>Under Quebec's Act respecting the protection of personal information in the private sector (Law 25), you may access, correct or ask us to delete your information, or withdraw your consent at any time.</p>
      <h2 class="h3">Person in charge</h2>
      <p>Carole St-Pierre, President, is responsible for the protection of personal information. Write to <a class="link-arrow" href="mailto:{EMAIL}">{EMAIL}</a>, call {PHONE}, or visit us at {ADDRESS}, {CITY}.</p>
    </div>
  </div>
</section>'''
    return page("privacy.html", "Privacy Policy | Carole St-Pierre salon & spa",
                "How Carole St-Pierre salon & spa collects, uses and protects your personal information, in line with Quebec's Law 25.", body)


def not_found():
    body = f'''<section class="frame hero grain" style="min-height:calc(100svh - var(--frame)*2)">
  <div class="hero-inner" style="align-content:center">
    <div class="hero-copy" style="align-self:center">
      <span class="eyebrow"><span class="num">(404)</span> — Page not found</span>
      <h1 class="hero-title">{lines("Take a", "<em>deep breath.</em>")}</h1>
      <p class="hero-sub">This page has wandered off for a massage. Let's get you somewhere relaxing.</p>
      <div class="btn-row">{btn("Back to home", "index.html", "lime")}{btn("Book online", BOOK, "ghost", ext=True)}</div>
    </div>
  </div>
</section>'''
    return page("404.html", "Page not found | Carole St-Pierre salon & spa", "This page could not be found.", body)


def build():
    return privacy() + ", " + not_found()
