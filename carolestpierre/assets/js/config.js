// One place for the details a salon owner might want to change.
window.SITE_CONFIG = {
  // POST endpoint that accepts JSON (Formspree, Basin, Zapier/Make webhook, etc.).
  // While empty, every form opens a pre-filled email instead, so no inquiry is ever lost.
  formEndpoint: "",
  email: "info@carolest-pierre.com",
  phone: "+14504557999",
  bookingUrl: "https://carolestpierre.zenoti.com/webstoreNew/services",
  giftUrl: "https://carolestpierre.zenoti.com/webstoreNew/giftcards/9e1aaf54-17e8-4258-9fae-9b75d45ae056",
  timeZone: "America/Toronto",
  // 24h clock, [open, close]. 0 = Sunday.
  hours: {
    0: [10, 16],
    1: [10, 17],
    2: [9, 19],
    3: [9, 20],
    4: [9, 20],
    5: [9, 20],
    6: [9, 17]
  }
};
