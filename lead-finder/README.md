# Lead Finder

Finds local businesses, gets the contact emails listed on their websites, and grades how good each website looks to a customer (A to F). You get a visual report with the weakest websites first. Those businesses are your best prospects.

It runs on your own computer.

## What it does

1. **Finds businesses.** Give it a business type and a city, like `dentist` and `Austin, Texas`. It pulls every matching business that lists a website from OpenStreetMap, a free public map.
2. **Finds emails.** It visits each website's homepage and up to five contact, about and team pages. It reads email links, plain-text emails, hidden (Cloudflare-protected) emails, and disguised ones like `info [at] site [dot] com`. It also picks up phone numbers, Facebook, Instagram and LinkedIn pages, and whether there's a contact form.
3. **Grades the website's looks.** It opens each site in a real browser as an iPhone and as a laptop, takes screenshots, and checks what a customer would notice:
   - Is it built for phones, or does it show a shrunk desktop page?
   - Does it run off the side of the phone screen?
   - Is the text big enough to read, and dark enough against its background?
   - Are the buttons big enough to tap?
   - Is there a "Call", "Book" or "Contact" button on the first screen?
   - Are photos sharp, or blurry, stretched or broken?
   - Does the first screen have a strong photo, or is it just text?
   - Does it mix too many fonts?
   - Does the footer say © 2017, or was it built with very old techniques?
   - Is it slow, or does the browser warn "Not secure"?
4. **Optional: a designer's opinion from Claude.** Add `--ai` and Claude looks at the screenshots. It rates the design out of 10 for overall look, modern feel, phone experience, trust and clarity. It lists the biggest problems in plain words and writes an opening line for your cold email.

## One-time setup

You need Python 3.10 or newer ([python.org/downloads](https://www.python.org/downloads/)). Then open a terminal in this `lead-finder` folder and run:

```
pip install -r requirements.txt
python -m playwright install chromium
```

For the `--ai` rating, get an API key from [console.anthropic.com](https://console.anthropic.com) and set it before running:

```
# Mac / Linux
export ANTHROPIC_API_KEY=sk-ant-...

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."
```

Each site costs a few cents to rate. Everything else is free.

## Use it

**All three steps at once:**

```
python leads.py run dentist "Austin, Texas"
python leads.py run "hair salon" "Leeds, UK" --limit 60 --ai
```

**Only emails, for sites you already have** (for example from Google Maps):

```
python leads.py emails brightsmiledental.com joesplumbing.com
python leads.py emails --file my-list.csv
```

**Only the looks check:**

```
python leads.py audit brightsmiledental.com --ai
python leads.py audit --file my-list.csv
```

`--file` takes a `.csv` with a `website` column (a `name` column is used if there is one) or a `.txt` file with one website per line.

**See the business types you can search:**

```
python leads.py types
```

For anything not in the list, use an OpenStreetMap tag like `"shop=bicycle"`.

## What you get

Results are saved in `results/<search>-<date>/`:

- `report.html`: open it in your browser. It has one card per business with phone and laptop screenshots, a grade, the problems a customer would notice, the email to use, and an opening line you can copy.
- `leads.csv`: the same data as a spreadsheet, ready for Google Sheets, Excel or a mail-merge tool.
- `screenshots/`: the phone and laptop screenshots.

**Grades**

| Grade | Meaning |
|---|---|
| A | Looks good. Probably not worth pitching. |
| B | Decent, with a few things to fix. |
| C | Noticeable problems. Good prospect. |
| D | Looks poor on phones or dated. Strong prospect. |
| F | Needs a new website. Best prospect. |

## Good to know

- **OpenStreetMap doesn't list every business.** Coverage is good in most cities but not complete. For more leads, copy websites from Google Maps into a `.txt` file and run `emails` or `audit` on it.
- **It only collects emails that businesses publish on their own sites**, and it respects each site's `robots.txt`. It visits at most six pages per site.
- **Follow the email rules where you live.** In the US (CAN-SPAM), use your real name and business address and include a way to opt out. In the UK and EU (GDPR/PECR), cold email to a company's general address (info@, hello@) is usually fine if it's relevant to their business. Be more careful with a named person's email. Always stop when someone asks.
- **The grade is a guide.** Look at the screenshots before you pitch, and mention only problems you can see yourself.
