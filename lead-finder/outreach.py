"""Write the first outreach message for each lead, personalised from its audit.

Picks the best first channel (email, then the site's contact form, then
Facebook Messenger, Instagram, and finally a phone call) and writes a
message for it that names the business, greets the owner when their name
can be read from the email address, and mentions the real problems found.
"""

import datetime
import json
import re
from pathlib import Path
from urllib.parse import quote, urlparse

DETAILS_FILE = Path(__file__).with_name("my-details.json")

NOT_NAMES = {
    "info", "contact", "hello", "hi", "office", "admin", "mail", "email", "enquiries", "inquiries", "enquiry",
    "inquiry", "support", "sales", "booking", "bookings", "reception", "team", "appointment", "appointments",
    "help", "care", "frontdesk", "front", "desk", "service", "services", "billing", "accounts", "hr", "jobs",
    "careers", "marketing", "web", "webmaster", "manager", "owner", "dr", "doctor", "the", "general", "main",
    "orders", "order", "shop", "store", "studio", "clinic", "dental", "law", "legal", "hey", "reservations",
    "events", "press", "media", "news", "noreply", "welcome", "customer", "customers", "patient", "patients",
}

# Consonant pairs a first name can start with (Chris, Steve, Brad...). "jsmith" or "mlopez" can't.
NAME_ONSETS = {
    "bl", "br", "ch", "cl", "cr", "dr", "dw", "fl", "fr", "gl", "gr", "kl", "kr", "ph", "pl", "pr", "rh",
    "sc", "sh", "sk", "sl", "sm", "sn", "sp", "st", "sw", "th", "tr", "tw", "wh", "wr", "zh",
}

# Short words that are real words, not initials, when a name is written in capitals.
COMMON_SHORT_WORDS = {
    "THE", "AND", "INC", "CO", "FOR", "OUR", "ALL", "NEW", "BIG", "TOP", "ONE", "TWO", "PRO", "BAR", "SPA", "CAR",
    "MY", "YOU", "YOUR", "BY", "AT", "IN", "ON", "TO", "OF", "SUN", "SEA", "BAY", "OAK", "RED", "HOT", "FUN", "PET",
    "VET", "LAW", "TAX", "ART", "HAIR", "DAY", "WAY", "KEY", "JOY", "MAX", "ACE", "AIR", "FIT", "GYM", "INN", "PUB",
}

KNOWN_ACRONYMS = {"HVAC", "CPA", "DDS", "DMD", "LLC", "LLP", "PLLC", "PC", "PA", "USA", "BBQ", "MD", "RV", "IT", "AC"}

# Who a business's customers are, for the "why it matters" sentence.
AUDIENCE = {
    "dentist": "patients", "doctor": "patients", "clinic": "patients", "physiotherapist": "patients",
    "chiropractor": "patients", "pharmacy": "customers", "vet": "pet owners", "lawyer": "clients",
    "accountant": "clients", "real estate": "buyers and sellers", "insurance": "clients", "architect": "clients",
    "restaurant": "diners", "cafe": "customers", "bar": "customers", "hotel": "guests", "gym": "members",
    "yoga": "students", "hair salon": "clients", "beauty salon": "clients", "spa": "clients", "tattoo": "clients",
    "school": "families", "wedding venue": "couples",
}

WHY_IT_MATTERS = {
    "down": "Anyone who finds you on Google and clicks through to your website is hitting a dead end right now.",
    "cert": "Most people see that warning and go straight back to Google.",
    "mobile": "Most people searching for {a_niche} are on their phone, so some of them are probably leaving before they get in touch.",
    "cta": "People who are ready to book won't hunt for a phone number. They'll just pick the next result on Google.",
    "slow": "Most people give up on a page after about 3 seconds and go back to the search results.",
    "ssl": "That warning puts people off right when they're about to contact you.",
    "dated": "Little things like that can make new {audience} wonder if you're still open.",
    "images": "It's a small thing, but first impressions online are often what make new {audience} choose one {niche} over another.",
    "visual": "First impressions online are often what make new {audience} choose one {niche} over another.",
    "contrast": "If people have to squint, they usually don't stick around.",
    "fonts": "First impressions online are often what make new {audience} choose one {niche} over another.",
    "polish": "First impressions online are often what make new {audience} choose one {niche} over another.",
}


def load_details(overrides=None):
    details = {"name": "", "studio": "", "portfolio": "", "offer": ""}
    try:
        details.update(json.loads(DETAILS_FILE.read_text(encoding="utf-8")))
    except (OSError, ValueError):
        pass
    changed = False
    for k, v in (overrides or {}).items():
        if v:
            details[k] = v
            changed = True
    if changed:
        DETAILS_FILE.write_text(json.dumps(details, indent=2), encoding="utf-8")
    return details


def _first_name(email, business):
    if not email:
        return ""
    local = email.split("@")[0].lower()
    parts = [p for p in re.split(r"[._\-+]", local) if p]
    if not parts:
        return ""
    token = parts[0]
    if len(parts) == 1 and len(token) > 8:
        return ""  # e.g. "brightsmile" - probably not a name
    if not token.isalpha() or not 3 <= len(token) <= 12 or token in NOT_NAMES:
        return ""
    if not re.search(r"[aeiouy]", token):
        return ""
    if len(parts) == 1:
        # "jsmith" or "drpatel" are an initial or title glued to a surname, not a first name.
        if token.startswith("dr") and len(token) > 4 and token[2] not in "aeiouy":
            return ""
        if token[0] not in "aeiouy" and token[1] not in "aeiouy" and token[:2] not in NAME_ONSETS:
            return ""
    biz = re.sub(r"[^a-z]", "", (business or "").lower())
    if token in biz and len(token) > 4:
        return ""
    return token.capitalize()


# Business types whose search keyword doesn't read naturally in a sentence.
NICHE_LABEL = {
    "real estate": "real estate agent", "yoga": "yoga studio", "hvac": "HVAC company", "car repair": "car repair shop",
    "car dealer": "car dealership", "insurance": "insurance agency", "tattoo": "tattoo studio", "spa": "spa",
    "vet": "vet clinic", "jeweller": "jeweller", "gym": "gym",
}


def _plural(word):
    if word.endswith("y") and not word.endswith(("ay", "ey", "oy")):
        return word[:-1] + "ies"
    return word + ("es" if word.endswith(("s", "sh", "ch")) else "s")


def _niche_words(lead):
    """(singular, plural, audience) for the lead's business type."""
    niche = (lead.get("type") or "").strip().lower()
    if not niche or "=" in niche:
        return "", "", "customers"
    label = NICHE_LABEL.get(niche, niche)
    return label, _plural(label), AUDIENCE.get(niche, "customers")


def _city(lead):
    area = lead.get("area") or ""
    return area.split(",")[0].strip()


def _business(lead):
    name = (lead.get("name") or "").strip()
    if not name:
        title = (lead.get("title") or "").strip()
        name = re.split(r"\s[|\-–—:]\s", title)[0].strip()[:60] if title else ""
    if not name:
        return urlparse(lead.get("website", "")).netloc.removeprefix("www.")
    if name.isupper():
        # "BERKSHIRE HATHAWAY INC." -> "Berkshire Hathaway Inc."
        small = {"AND": "and", "OF": "of", "THE": "the", "&": "&"}
        words = []
        for i, w in enumerate(name.split()):
            if i and w in small:
                words.append(small[w])
            elif w.strip(".,'S") in KNOWN_ACRONYMS:
                words.append(w[:-2] + "'s" if w.endswith("'S") else w)
            elif (w.isalpha() and len(w) <= 3 and w not in COMMON_SHORT_WORDS
                  and not re.fullmatch(r"[^AEIOU][AEIOU][A-Z]?", w)):
                words.append(w)  # initials like "ABC", "DDS" or "LLC" stay upper case
            else:
                words.append(w.capitalize())
        name = " ".join(words)
    return name


def _possessive(name):
    return name + ("'" if name.endswith("s") and not name.endswith("'s") else "'s")


def _observation(lead):
    if lead.get("site_down"):
        return "When I tried to open it, I got an error. It looks like the site is down at the moment."
    ai = lead.get("ai") or {}
    if ai.get("pitch_line"):
        return ai["pitch_line"].strip()
    issues = []
    seen = set()
    for i in lead.get("issues") or []:
        if i["key"] not in seen:
            issues.append(i)
            seen.add(i["key"])
    if not issues:
        return ""
    if len(issues) == 1:
        return f"When I opened it on my phone, {issues[0]['pitch']}."
    return f"When I opened it on my phone, {issues[0]['pitch']}, and {issues[1]['pitch']}."


def _why(lead):
    issues = lead.get("issues") or []
    if not issues:
        return ""
    niche, _, audience = _niche_words(lead)
    if niche:
        # "an HVAC company", "an accountant", "a dentist"
        vowel_sound = niche[:2].isupper() and niche[0] in "AEFHILMNORSX" or niche[0].lower() in "aeiou"
        a_niche = ("an " if vowel_sound else "a ") + niche
    else:
        a_niche = "a business like yours"
    return WHY_IT_MATTERS.get(issues[0]["key"], WHY_IT_MATTERS["visual"]).format(
        niche=niche or "business", a_niche=a_niche, audience=audience)


def _signature(me, short=False):
    lines = [me.get("name") or "[your name]"]
    if not short:
        studio_line = " · ".join(x for x in [me.get("studio"), me.get("portfolio")] if x)
        if studio_line:
            lines.append(studio_line)
    return "\n".join(lines)


def _facebook_message_url(url):
    path = urlparse(url).path.strip("/")
    if not path or path.startswith(("profile.php", "people", "groups", "pages")):
        return url
    return "https://m.me/" + path.split("/")[0]


def _instagram_handle(url):
    path = urlparse(url).path.strip("/")
    return path.split("/")[0] if path else ""


def _compliment(lead):
    """A short, genuine opener from their best Google review, if there's one short enough to quote."""
    quote = (lead.get("review_quote") or "").strip()
    if not quote or len(quote) > 110:
        return ""
    return f'Your Google reviews are great. One customer wrote, "{quote}"'


def _extras(lead, most=2):
    """Extra sentences from signals most people never look at, strongest first, at most `most` of them."""
    extras = []
    dom = lead.get("domain") or {}
    days = dom.get("expires_in_days")
    if days is not None and 0 <= days <= 60:
        d = datetime.date.fromisoformat(dom["expires"])
        when = f"{d:%B} {d.day}, {d.year}"
        extras.append(f"Quick heads up: public records show {dom['domain']} expires on {when}. If it lapses, "
                      "your website and email stop working.")
    kinds = {c["kind"] for c in lead.get("review_complaints") or []}
    if "website" in kinds or "booking" in kinds:
        extras.append("One of your Google reviews also mentions trouble booking or using the website, so it's "
                      "costing you real customers.")
    marketing = lead.get("marketing") or []
    if "Google Ads" in marketing and not lead.get("site_down"):
        extras.append("I also noticed you're running Google Ads, so you're paying for clicks that land on this page.")
    elif "Facebook Pixel" in marketing and not lead.get("site_down"):
        extras.append("You're also set up to advertise on Facebook, so it's worth making sure the site turns those "
                      "clicks into customers.")
    return " ".join(extras[:most])


def _build_no_website(lead, me):
    """For a business that's listed on Google but has no website at all."""
    biz = _business(lead)
    first = _first_name(lead.get("best_email"), biz)
    _, niches, audience = _niche_words(lead)
    city = _city(lead)
    rating = ""
    if lead.get("reviews") and lead.get("rating"):
        rating = f" You clearly do great work: {lead['rating']} stars from {lead['reviews']} reviews on Google."
    elif lead.get("reviews"):
        rating = f" You clearly do great work, judging by your {lead['reviews']} reviews on Google."
    search_where = f"{niches or 'businesses'} in {city}" if city else (niches or "local businesses")
    placeholder = lead.get("placeholder_site", "")
    if "shut down" in placeholder:
        found = ("your Google listing still links to your old Google website. Google shut those down in 2024, "
                 "so anyone who clicks it hits a dead end")
    elif placeholder:
        found = f"your Google listing links to {placeholder} rather than a website of your own"
    else:
        found = "I couldn't find a website for you"
    pitch = f"I came across {biz} on Google while looking at {search_where}, and {found}.{rating}"
    why = (f"Most new {audience} check a business's website before they call. Without one, they often pick "
           "a competitor who has one.")
    offer = me.get("offer") or ("I'm a web designer and I build simple, good-looking websites for local businesses. "
                                "Would you like to see a quick mock-up of what yours could look like? It's free.")
    email_body = "\n\n".join(x for x in [
        f"Hi {first}," if first else "Hi there,", pitch, why, offer, _signature(me),
        "P.S. If this isn't useful, just reply \"no\" and I won't follow up.",
    ] if x)
    call_script = (
        f"Hi, is this the owner or manager? My name's {me.get('name') or '[your name]'}, I'm a web designer. "
        f"I'll be quick. I found {biz} on Google{' and saw your great reviews' if lead.get('reviews') else ''}, "
        f"but {found.replace('your ', 'your ', 1)}. I'd love to put together a free mock-up of what a proper site could look like. "
        "What's the best email to send it to?"
    )
    dm_message = (f"Hi! I came across {biz} on Google{' and saw your reviews' if lead.get('reviews') else ''}. "
                  f"I noticed {found}. I'm a web designer. Would you like a free mock-up of what "
                  "a proper website could look like? No strings attached.")
    from urllib.parse import quote_plus
    lookup = quote_plus(f"{biz} {city}".strip())
    options = []
    if lead.get("best_email"):
        subject = f"Website for {biz}?"
        options.append({"channel": "email", "label": "Email", "to": lead["best_email"], "subject": subject,
                        "message": email_body,
                        "action_url": "https://mail.google.com/mail/?view=cm&fs=1&to=" + quote(lead["best_email"])
                        + "&su=" + quote(subject) + "&body=" + quote(email_body), "action_label": "Open in Gmail"})
    socials = lead.get("socials") or {}
    if socials.get("facebook"):
        options.append({"channel": "messenger", "label": "Facebook Messenger", "to": socials["facebook"], "subject": "",
                        "message": dm_message, "action_url": _facebook_message_url(socials["facebook"]),
                        "action_label": "Open Messenger"})
    if socials.get("instagram"):
        handle = _instagram_handle(socials["instagram"])
        options.append({"channel": "instagram", "label": "Instagram DM", "to": "@" + handle, "subject": "",
                        "message": dm_message, "action_url": f"https://ig.me/m/{handle}",
                        "action_label": "Open Instagram DM"})
    if lead.get("phone"):
        options.append({"channel": "call", "label": "Phone call", "to": lead["phone"], "subject": "",
                        "message": call_script, "action_url": lead.get("maps_url", ""),
                        "action_label": "Google listing" if lead.get("maps_url") else ""})
    if not socials.get("facebook"):
        options.append({"channel": "messenger", "label": "Facebook (find their page)", "to": biz, "subject": "",
                        "message": dm_message, "action_url": f"https://www.facebook.com/search/pages/?q={lookup}",
                        "action_label": "Search Facebook"})
    if not socials.get("instagram"):
        options.append({"channel": "instagram", "label": "Instagram (find their profile)", "to": biz, "subject": "",
                        "message": dm_message, "action_url": f"https://www.google.com/search?q={lookup}+instagram",
                        "action_label": "Search Instagram"})
    return {"first": options[0], "others": options[1:], "greeting_name": first}


def build(lead, me):
    """Return the first outreach message plus alternates for other channels."""
    if lead.get("no_website"):
        return _build_no_website(lead, me)
    biz = _business(lead)
    first = _first_name(lead.get("best_email"), biz)
    hello = f"Hi {first}," if first else "Hi there,"
    _, niches, _ = _niche_words(lead)
    city = _city(lead)
    if niches and city:
        where = f"{niches} in {city}"
    elif city:
        where = f"businesses in {city}"
    else:
        where = niches or "local businesses"
    observation = _observation(lead)
    why = _why(lead)
    if lead.get("site_down"):
        offer = ("I'm a web designer and I can help get it back online, or build you a fresh one if it's time. "
                 "Want me to take a quick look at what's wrong? No charge for that.")
    else:
        offer = me.get("offer") or (
            "I'm a web designer, and I recorded a quick 2-minute video showing what I'd change and why. "
            "Want me to send it over? It's free, no strings attached."
        )

    email_subject = f"Quick question about {_possessive(biz)} website"
    compliment = _compliment(lead)
    extras = _extras(lead)
    email_body = "\n\n".join(x for x in [
        hello,
        f"I came across {biz} while looking at {where}. {compliment}".strip() if compliment else "",
        (f"I checked out your website. {observation}" if compliment else
         f"I came across {biz} while looking at {where} and checked out your website. {observation}").strip(),
        why,
        extras,
        offer,
        _signature(me),
        "P.S. If this isn't useful, just reply \"no\" and I won't follow up.",
    ] if x)

    form_message = "\n\n".join(x for x in [
        f"Hi {first or 'there'}, I was looking at {_possessive(biz)} website and wanted to flag something. {observation}".strip(),
        why,
        extras,
        offer,
        f"{me.get('name') or '[your name]'}"
        + (f" ({me['portfolio']})" if me.get("portfolio") else ""),
    ] if x)

    top_issue = (lead.get("issues") or [{}])[0].get("pitch", "a couple of things on your site")
    noticed = f"I noticed on your website that {top_issue}."
    dm_ask = "Mind if I send you a quick 2-minute video with a few fixes? Free, no sales pitch."
    call_ask = "I recorded a short video showing how I'd fix it. What's the best email to send it to?"
    if lead.get("site_down"):
        top_issue = "it isn't loading. I got an error when I tried to open it"
        noticed = "I tried to visit your website but it isn't loading right now."
        dm_ask = "I can help get it back up. Want me to take a quick look at what's wrong? No charge."
        call_ask = "I can help get it back up. Would you like me to take a quick look? There's no charge for that."
    dm_message = f"Hi! I came across {biz} and love what you do. {noticed} I'm a web designer. {dm_ask}"
    call_script = (
        f"Hi, is this the owner or manager? My name's {me.get('name') or '[your name]'}, I'm a web designer. "
        f"I'll be quick. I was looking at {_possessive(biz)} website and {top_issue}. {call_ask}"
    )

    socials = lead.get("socials") or {}
    phones = [lead["phone"]] if lead.get("phone") else (lead.get("phones") or [])
    options = []
    if lead.get("best_email"):
        to = lead["best_email"]
        gmail = ("https://mail.google.com/mail/?view=cm&fs=1&to=" + quote(to) + "&su=" + quote(email_subject)
                 + "&body=" + quote(email_body))
        options.append({"channel": "email", "label": "Email", "to": to, "subject": email_subject,
                        "message": email_body, "action_url": gmail, "action_label": "Open in Gmail"})
    if lead.get("contact_page"):
        options.append({"channel": "form", "label": "Contact form", "to": lead["contact_page"], "subject": "",
                        "message": form_message, "action_url": lead["contact_page"], "action_label": "Open their form"})
    if socials.get("facebook"):
        options.append({"channel": "messenger", "label": "Facebook Messenger", "to": socials["facebook"], "subject": "",
                        "message": dm_message, "action_url": _facebook_message_url(socials["facebook"]),
                        "action_label": "Open Messenger"})
    if socials.get("instagram"):
        handle = _instagram_handle(socials["instagram"])
        options.append({"channel": "instagram", "label": "Instagram DM", "to": "@" + handle if handle else socials["instagram"],
                        "subject": "", "message": dm_message,
                        "action_url": f"https://ig.me/m/{handle}" if handle else socials["instagram"],
                        "action_label": "Open Instagram DM"})
    if phones:
        options.append({"channel": "call", "label": "Phone call", "to": phones[0], "subject": "",
                        "message": call_script, "action_url": "", "action_label": ""})
    if not options:
        options.append({"channel": "form", "label": "Website", "to": lead.get("website", ""), "subject": "",
                        "message": form_message, "action_url": lead.get("website", ""),
                        "action_label": "Open their website"})

    return {"first": options[0], "others": options[1:], "greeting_name": first}
