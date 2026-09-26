# Lead Finder

Finds local businesses with bad websites, gets their contact emails, and writes your first outreach message for each one. You get a page listing every business with a weak website (grade C, D or F), worst first, each with:

- the email address to use (plus contact form, Facebook, Instagram and phone when found)
- a **personalized first message**, ready to copy and paste, that names the business, greets the owner by first name when the email address shows it, and mentions the real problems found on their site
- a **View audit report** button that opens the full audit: phone and laptop screenshots, every check passed or failed, and what to fix

It runs on your own computer.

## Where leads come from

| Source | What it finds | Needs |
|---|---|---|
| **Google** (Places API) | Google's own business listings: the most complete list there is. Includes star rating, review count, phone, and businesses with **no website at all**. Splits the city into smaller areas to get past Google's 60-results-per-search cap. | `GOOGLE_PLACES_API_KEY` |
| **Web search** (Brave Search API) | Business websites that give themselves away as outdated: an old "© 2017" footer, "under construction", "best viewed in", DIY site builders. These rarely show up in normal lead lists. | `BRAVE_API_KEY` |
| **OpenStreetMap** | Free public map data. Good in some cities, patchy in others. | nothing |

`run` uses every source you have a key for, and merges businesses found by more than one.

It also flags two kinds of lead that are the easiest to close:

- **Website down.** A business listed on Google whose website doesn't load or no longer exists. The message tells them, and offers to help.
- **No website.** A business on Google with good reviews but no website. You get a call script and a message offering a free mock-up.

Leads are sorted with these first, then the worst websites. Busy businesses (lots of Google reviews) move up, because they can afford a new site.

### Getting the keys

**Google Places key** (recommended):

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project, and add a billing account.
2. Open **APIs & Services → Library**, find **Places API (New)** and enable it.
3. Open **APIs & Services → Credentials → Create credentials → API key**.

Google includes a free monthly allowance for the Places API. Paid use is charged per search, so check the current prices on Google's pricing page. As a rough guide, one city with `--grid 2` is about 12 searches.

**Brave Search key:**

1. Sign up at [brave.com/search/api](https://brave.com/search/api/) and choose a plan. There's a free plan.
2. Copy the API key from the dashboard.

**Set them before running:**

```
# Mac / Linux
export GOOGLE_PLACES_API_KEY=your-google-key
export BRAVE_API_KEY=your-brave-key

# Windows (PowerShell)
$env:GOOGLE_PLACES_API_KEY="your-google-key"
$env:BRAVE_API_KEY="your-brave-key"
```

Pick sources yourself with `--sources google,web`. For a big city, use `--grid 3` or `--grid 4` to cover more of it with Google.

## What it does

1. **Finds businesses.** Give it a business type and a city, like `dentist` and `Austin, Texas`. It pulls matching businesses from Google, a web search for outdated sites, and OpenStreetMap (see "Where leads come from" above).
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

**The first time, add your details** so every message is signed with your name and website. They're remembered after that:

```
python leads.py run dentist "Austin, Texas" --name "Bhavansh" --studio "Bhavansh Studio" --portfolio bhavansh.com
```

**After that:**

```
python leads.py run dentist "Austin, Texas"
python leads.py run roofer "Tampa, Florida" --limit 60 --ai
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

Results are saved in `results/<search>-<date>/`. Open `report.html` in your browser.

**The lead list (`report.html`)** shows only businesses with a bad website, worst first. For each one:

1. The problems a customer would notice, and the email address.
2. **First message**, already written for the best way to reach them:
   - **Email** if the site lists one. Click **Open in Gmail** and it opens a new email with the address, subject and message filled in.
   - Otherwise their **contact form**, then **Facebook Messenger**, then **Instagram**, then a **phone call** script.
   - For forms and DMs, the button copies the message and opens the page, so you just paste.
   - You can edit the message in the box before copying.
3. A status menu (Not contacted, Message sent, Follow up, Replied, Not interested) to keep track. It's remembered in your browser. Use the filters at the top to see who still needs a message or a follow-up.

**The audit report** (click **View audit report**) has:

- screenshots of the first screen on a phone and a laptop, and the whole page on a phone
- all 14 checks grouped into Phone, Speed, Trust and Looks, each marked passed or failed, with the fix for each problem
- Claude's design scores, if you used `--ai`
- messages for every channel (email, contact form, Messenger, Instagram, call script) and all contact details found

**Also saved:**

- `leads.csv`: everything as a spreadsheet, including the first message and subject, ready for Google Sheets, Excel, or importing into Instantly or Smartlead.
- `audits/` and `screenshots/`: the audit pages and images.

Add `--show-all` to also list sites that already look good.

**About the greeting:** when the email is something like `maria@` or `joe.miller@`, the message starts "Hi Maria," or "Hi Joe,". Otherwise it says "Hi there,". The page tells you when a name was guessed, so check it before sending.

**Grades**

| Grade | Meaning |
|---|---|
| A | Looks good. Probably not worth pitching. |
| B | Decent, with a few things to fix. |
| C | Noticeable problems. Good prospect. |
| D | Looks poor on phones or dated. Strong prospect. |
| F | Needs a new website. Best prospect. |

## Good to know

- **OpenStreetMap doesn't list every business.** Add a Google key for much better coverage. You can also copy websites into a `.txt` file and run `emails` or `audit` on it.
- **It only collects emails that businesses publish on their own sites**, and it respects each site's `robots.txt`. It visits at most six pages per site.
- **Follow the email rules where you live.** In the US (CAN-SPAM), use your real name and business address and include a way to opt out. In the UK and EU (GDPR/PECR), cold email to a company's general address (info@, hello@) is usually fine if it's relevant to their business. Be more careful with a named person's email. Always stop when someone asks.
- **The grade is a guide.** Look at the screenshots before you pitch, and mention only problems you can see yourself.
