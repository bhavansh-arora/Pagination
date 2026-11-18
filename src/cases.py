"""Case-study data + template. build.py renders these into film-*.html."""
import json

CASES = [
    {
        "slug": "film-mary-lees-house",
        "vimeo": "1209681619", "runtime": "04:03", "iso": "PT4M3S",
        "img": "film-mary", "title_lines": ["Mary Lee’s", "<em>House.</em>"], "name": "Mary Lee’s House",
        "client": "Mary Lee’s House", "industry": "Nonprofit · Child advocacy", "location": "Tampa, FL", "format": "Brand anthem film",
        "lede": "A dedicated look inside a child advocacy and protection centre, told with the care its mission deserves.",
        "brief": "Show how a multidisciplinary team provides a safe, centralised environment for child abuse assessment, intervention and healing, and make the impact of that work felt.",
        "approach": "Interview-led storytelling with the people who do the work, soft natural light and restrained, respectful framing. The building itself becomes a character: calm, safe and welcoming.",
        "audience": "Donors, community partners and local families. One film that can open a fundraising gala, anchor the website and travel through partner networks.",
        "pull": "Compassion first. Every frame had to protect the people it was about.",
        "where": [("16:9", "Website hero", 16, 9), ("16:9", "Donor & gala screenings", 16, 9), ("1:1", "Partner newsletters", 1, 1), ("9:16", "Awareness campaigns", 9, 16)],
        "tags": ["Interviews", "Documentary B-roll", "Colour grade", "Licensed score"],
        "desc": "Brand film for Mary Lee’s House, a Tampa child advocacy centre: a compassionate, interview-led story made for donors, partners and families.",
    },
    {
        "slug": "film-fun-bike-center",
        "vimeo": "1210003802", "runtime": "01:07", "iso": "PT1M7S",
        "img": "film-funbike", "title_lines": ["Fun Bike", "<em>Center.</em>"], "name": "Fun Bike Center",
        "client": "Fun Bike Center Motorsports", "industry": "Retail · Powersports", "location": "Lakeland, FL", "format": "Promotional showcase",
        "lede": "A high-energy showcase for Central Florida’s premier powersports dealership, built to make you want to ride.",
        "brief": "Capture the scale, thrill and passion of the powersports lifestyle: the sprawling showroom, the service operation and an inventory that runs from motorcycles and dirt bikes to ATVs and watercraft.",
        "approach": "Kinetic camera movement, punchy pacing and tight detail shots of chrome, tread and engines, cut against the people who make the place run. Big-scale wides establish authority; close-ups bring the adrenaline.",
        "audience": "Riders across Central Florida. Edited to perform on social, on digital channels and on the showroom floor screens.",
        "pull": "Make the showroom feel like the starting line.",
        "where": [("9:16", "Reels & TikTok", 9, 16), ("16:9", "YouTube & web", 16, 9), ("16:9", "Showroom displays", 16, 9), ("4:5", "Paid social", 4, 5)],
        "tags": ["Showroom", "Service bay", "Inventory hero shots", "Team on camera"],
        "desc": "Promotional showcase film for Fun Bike Center, Lakeland’s powersports dealership: scale, thrill and brand authority for social, digital and showroom screens.",
    },
    {
        "slug": "film-teco-energy-audit",
        "vimeo": "1210011258", "runtime": "00:29", "iso": "PT29S",
        "img": "film-teco", "title_lines": ["TECO energy", "<em>audit.</em>"], "name": "TECO Energy Audit",
        "client": "Tampa Electric (TECO)", "industry": "Utility · Energy", "location": "Tampa Bay, FL", "format": "Field feature",
        "lede": "Turning the technical work of utility energy analysts into a clear, human story customers can act on.",
        "brief": "Demystify how energy analysts evaluate residential and commercial efficiency, translate raw consumption data into conservation strategies, and connect customers with smart energy programmes.",
        "approach": "On-site field capture with real analysts and real customers. Clean, informative visuals walk through the audit process step by step and land on what matters most: real-world cost savings.",
        "audience": "Homeowners and businesses across the Tampa Bay area, met where they already are: on the web and in their feeds.",
        "pull": "If people understand it, they sign up for it.",
        "where": [("16:9", "Programme web pages", 16, 9), ("9:16", "Social awareness", 9, 16), ("1:1", "Customer emails", 1, 1), ("16:9", "Training & internal", 16, 9)],
        "tags": ["Field capture", "Process explainer", "Customer story", "On-screen graphics"],
        "desc": "Field feature for Tampa Electric (TECO) showing how utility energy audits work and the real savings they deliver to Tampa Bay homes and businesses.",
    },
    {
        "slug": "film-the-dance-room",
        "vimeo": "1209998926", "runtime": "01:26", "iso": "PT1M26S",
        "img": "film-dance", "title_lines": ["The Dance", "<em>Room.</em>"], "name": "The Dance Room",
        "client": "The Dance Room", "industry": "Lifestyle · Dance studio", "location": "Sarasota, FL", "format": "Brand film · Client interview",
        "lede": "An elegant, dynamic spotlight on Sarasota’s premier ballroom and Latin dance studio.",
        "brief": "Capture the energy, technique and welcoming atmosphere created by champion instructors, across beginner social lessons, wedding choreography, competitive coaching and youth classes.",
        "approach": "Graceful movement meets lively social sequences. Interview moments give the studio a voice, while flowing camera work shows off the spacious floor and the joy of learning to dance.",
        "audience": "Future dancers of every level, from first-timers and engaged couples to competitors, reached through the studio’s website and social platforms.",
        "pull": "Make the first lesson feel like an invitation, not a risk.",
        "where": [("16:9", "Website", 16, 9), ("9:16", "Instagram Reels", 9, 16), ("4:5", "Facebook feed", 4, 5), ("1:1", "Promotions", 1, 1)],
        "tags": ["Client interview", "Movement", "Atmosphere", "Social edits"],
        "desc": "Brand film for The Dance Room, Sarasota’s ballroom and Latin studio: energy, technique and a welcoming atmosphere for new dancers.",
    },
]


def ratio_box(w, h):
    scale = 64 / max(w, h)
    return f'<span class="ratio"><i style="width:{w*scale:.0f}px;height:{h*scale:.0f}px"></i></span>'


def render(i):
    c = CASES[i]
    nxt = CASES[(i + 1) % len(CASES)]
    lines = "\n".join(f'            <span class="line"><span>{l}</span></span>' for l in c["title_lines"])
    where = "\n".join(
        f'''          <div class="deliv__item" data-reveal>
            {ratio_box(w, h)}
            <div><p class="mono accent">{r}</p><p style="margin-top:6px">{label}</p></div>
          </div>''' for r, label, w, h in c["where"])
    tags = "".join(f'<span class="chip">{t}</span>' for t in c["tags"])
    schema = {
        "@context": "https://schema.org", "@type": "VideoObject", "name": c["name"], "description": c["desc"],
        "thumbnailUrl": f"https://www.asbmediagroup.com/assets/img/{c['img']}.webp", "uploadDate": "2026-08-01",
        "duration": c["iso"], "embedUrl": f"https://player.vimeo.com/video/{c['vimeo']}",
        "productionCompany": {"@type": "Organization", "name": "ASB Media Group"},
    }
    meta = {
        "title": f"{c['name']} — Case Study | ASB Media Group",
        "desc": c["desc"], "nav": "work", "og": f"assets/img/{c['img']}.webp",
        "schema": '<script type="application/ld+json">' + json.dumps(schema) + "</script>",
    }
    return f'''<!--meta {json.dumps(meta)} -->

    <section class="phero">
      <div class="wrap">
        <div class="phero__eyebrow">
          <a class="link-arrow" href="work.html">← All films</a>
          <span class="mono muted">Case {i+1:02d} / {len(CASES):02d}</span>
        </div>
        <h1 class="h1 phero__title" data-split>
{lines}
        </h1>
        <div class="phero__foot">
          <p class="lead phero__lede" data-hero-fade>{c["lede"]}</p>
          <dl class="phero__meta mono" data-hero-fade>
            <div class="meta-item"><dt>Client</dt><dd>{c["client"]}</dd></div>
            <div class="meta-item"><dt>Industry</dt><dd>{c["industry"]}</dd></div>
            <div class="meta-item"><dt>Location</dt><dd>{c["location"]}</dd></div>
            <div class="meta-item"><dt>Format · Runtime</dt><dd>{c["format"]} · {c["runtime"]}</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section class="section--flush-top">
      <div class="wrap">
        <div class="case-player" data-player="{c["vimeo"]}" data-title="{c["name"]}" data-cursor="Play" data-clip role="button" tabindex="0" aria-label="Play the {c["name"]} film">
          <img src="assets/img/{c["img"]}.webp" alt="Still from the {c["name"]} film">
          <div class="vf"><i></i><i></i><i></i><i></i></div>
          <span class="case-player__btn"><span>{{{{icon:play}}}}</span></span>
          <div class="case-player__hud mono"><span><span class="rec-dot"></span>&nbsp; Play film</span><span>{c["runtime"]}</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="cols3">
          <div data-reveal><p class="eyebrow eyebrow--plain accent" style="margin-bottom:18px">01 — The brief</p><p class="muted">{c["brief"]}</p></div>
          <div data-reveal><p class="eyebrow eyebrow--plain accent" style="margin-bottom:18px">02 — The approach</p><p class="muted">{c["approach"]}</p></div>
          <div data-reveal><p class="eyebrow eyebrow--plain accent" style="margin-bottom:18px">03 — Built for</p><p class="muted">{c["audience"]}</p></div>
        </div>
        <div class="finder__chips" style="margin-top:clamp(40px,5vw,72px)" data-reveal>{tags}</div>
      </div>
    </section>

    <section class="section section--light">
      <div class="wrap">
        <p class="eyebrow" style="margin-bottom:32px" data-reveal><span class="num">—</span> The idea in one line</p>
        <p class="pull" data-reveal>{c["pull"]}</p>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sec-head">
          <div class="sec-head__eyebrow"><span class="eyebrow"><span class="num">(04)</span> Where it works</span><span class="mono muted">One shoot · every screen</span></div>
          <h2 class="h2 sec-head__title" data-lines><span class="split-line"><span>Cut for every</span></span><span class="split-line"><span><em>screen.</em></span></span></h2>
          <p class="sec-head__aside" data-reveal>The master film is just the start. Each project is planned so the same footage can be re-cut for the channels your audience already uses.</p>
        </div>
        <div class="deliv">
{where}
        </div>
      </div>
    </section>

    <a class="next" href="{nxt["slug"]}.html" data-cursor="Next">
      <div class="next__img" aria-hidden="true"><img src="assets/img/{nxt["img"]}.webp" alt="" loading="lazy"></div>
      <div class="wrap">
        <p class="eyebrow eyebrow--plain" style="justify-content:center;margin-bottom:28px">Next film</p>
        <p class="h1">{nxt["title_lines"][0]} {nxt["title_lines"][1]}</p>
        <p class="mono muted" style="margin-top:28px">{nxt["industry"]} · {nxt["runtime"]}</p>
      </div>
    </a>

    <section class="section cta section--ink2">
      <div class="wrap">
        <h2 class="h1 cta__title" data-lines><span class="split-line"><span>Your story,</span></span><span class="split-line"><span><em>next.</em></span></span></h2>
        <div class="cta__row">
          <div class="cta__btn-wrap" data-reveal><a class="btn" href="contact.html" data-magnetic=".3">Start your film {{{{icon:arrow}}}}</a></div>
          <div class="cta__info">
            <div data-reveal><p class="mono muted">Email</p><a href="mailto:aramisbooker@asbmediagroup.com">aramisbooker@<br>asbmediagroup.com</a></div>
            <div data-reveal><p class="mono muted">Phone</p><a href="tel:+18136070444">(813) 607-0444</a></div>
            <div data-reveal><p class="mono muted">Based in</p><p style="margin-top:8px">Tampa Bay, FL</p></div>
          </div>
        </div>
      </div>
    </section>
'''


def generate(pages_dir):
    for i, c in enumerate(CASES):
        (pages_dir / f"{c['slug']}.html").write_text(render(i))
