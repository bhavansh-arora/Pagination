# Atelier — Interior Design Studio Website Template

A polished, fully responsive website template for interior design studios,
with a built-in multi-step **booking flow**. It is pure HTML/CSS/JS —
**no build step, no framework, no backend required.** Open `index.html` in
a browser (or serve the folder) and it works.

This template is designed to be resold or customized for a client as a
premium ("$1,500–$3,000 range") interior-design-studio website product.

---

## What's included

- **6 pages**: Home, Services, Portfolio, About, Pricing, Contact, plus the
  booking flow (`book.html`).
- **A real booking wizard** (`book.html` + `js/booking.js`): service
  selection → calendar date + live time-slot picker (respecting business
  hours) → client details form → review → confirmation with a downloadable
  `.ics` calendar file. No backend needed — it's a self-contained demo that
  uses `localStorage` to prevent double-booking a slot within the same
  browser, so the flow feels real end-to-end.
- **Portfolio gallery** with category filtering and a keyboard-accessible
  lightbox.
- **Testimonial carousel**, animated stats, process timeline, pricing
  cards, FAQ accordion, newsletter signup — all the sections a design
  studio's marketing site needs.
- **Scroll-reveal animations**, a sticky navbar, mobile menu, and a
  "back to top" button — all in ~250 lines of dependency-free JS.
- Fully responsive from 360px phones up to large desktop.
- Light/warm luxury color palette (cream, charcoal, clay, sage) defined as
  CSS custom properties in `css/style.css` for easy re-theming.

## No backend, by design

Everything runs client-side. `js/booking.js` stores confirmed bookings in
the visitor's own browser (`localStorage`) purely so the demo *feels* real
(a slot booked once won't show as available again in that browser). It is
**not** a real reservation system — it doesn't talk to a server or send
real emails.

To make bookings real, replace two functions in `js/booking.js`:

- `saveBooking(booking)` — currently writes to `localStorage`. Point this
  at your API (e.g. `fetch('/api/bookings', { method: 'POST', body: ... })`)
  or a service like Calendly's API, Cal.com, Firebase, or a simple
  serverless function + database.
- `takenTimesFor(dateStr)` — currently reads from `localStorage`. Point
  this at a real availability endpoint so slots taken by *other* visitors
  are excluded too.

Everything else (the UI, validation, step flow, `.ics` calendar file
generation) will keep working unchanged.

## File structure

```
index.html          Home page
services.html        Services detail page
portfolio.html       Portfolio grid + lightbox
about.html            Studio story, values, team
pricing.html          Pricing packages + FAQ
contact.html          Contact form + studio info
book.html             The booking wizard (the main event)
css/style.css         Entire design system (tokens, components, pages)
js/main.js             Shared UI behavior (nav, reveal, carousel, gallery)
js/booking.js          Booking wizard logic + demo persistence
```

## Customizing for a client (quick checklist)

1. **Brand name & logo** — search/replace "Atelier" and the `A` monogram
   in every page's `<header>`/`<footer>`. There's no build step, so a
   simple find-and-replace across the `.html` files works.
2. **Colors** — edit the CSS custom properties at the top of
   `css/style.css` (`--cream-*`, `--charcoal-*`, `--clay-*`, `--sage-*`).
   Everything on the site references these tokens.
3. **Fonts** — swap the Google Fonts `<link>` in each `<head>` and the
   `--font-display` / `--font-body` variables in `style.css`.
4. **Images** — every image is hotlinked from Unsplash for demo purposes.
   Replace `src` attributes with the client's real photography before
   selling/launching (Unsplash placeholders are licensed for demo use but
   a paying client should use their own work).
5. **Services, pricing & copy** — edit directly in each HTML page; content
   isn't pulled from a data file, so changes are just text edits.
6. **Business hours / services in the booking flow** — edit the `SERVICES`
   and `HOURS` objects at the top of `js/booking.js`.
7. **Contact details / social links** — update the footer block (repeated
   at the bottom of every page) and `contact.html`.

## Deploying

Since it's static files, it deploys anywhere instantly:

- Drag-and-drop the folder onto Netlify or Vercel.
- `npx serve .` or `python3 -m http.server` for local preview.
- Any shared host, S3 + CloudFront, GitHub Pages, etc.

## License / resale notes

- The code in this repository is yours to sell, white-label, and modify
  freely for clients.
- The demo images are hotlinked from `images.unsplash.com` for preview
  purposes — swap them for licensed or client-owned photography before
  shipping a paid client site.
- Google Fonts (Fraunces, Inter) are open source and free for commercial
  use.
