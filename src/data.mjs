// Single source of truth for site content.
// Add a new film here and run `node src/build.mjs` — the Films page, film pages,
// home page cards, contact form and sitemap all update automatically.

export const site = {
  name: "Mark Arista Films",
  person: "Mark Arista",
  tagline: "Hawaii Wedding Videographer",
  email: "mark@aristafilms.co",
  url: "https://markarista.com",
  instagram: "https://www.instagram.com/markaristafilms/",
  facebook: "https://www.facebook.com/aristafilmsco",
  youtube: "https://www.youtube.com/watch?v=hzfBBlhqEzI",
};

export const regions = [
  { id: "oahu", label: "Oahu" },
  { id: "big-island", label: "Hawaii Island" },
  { id: "mainland", label: "Mainland" },
];

export const films = [
  {
    slug: "spencer-jenn",
    couple: "Spencer + Jenn",
    video: "hzfBBlhqEzI",
    venue: "Paliku Gardens",
    location: "Kaneohe, Oahu",
    region: "oahu",
    mood: ["Dreamy", "Romantic", "Fun"],
    ytTitle: "Dreamy, Romantic, and Fun Wedding at Paliku Gardens | Kaneohe, Hawaii | Spencer + Jenn",
    line: "Dreamy, romantic and <span class=\"it\">so much fun.</span>",
    story:
      "Three words sum up Spencer and Jenn's day at Paliku Gardens: dreamy, romantic and fun. Palms, a garden aisle and a recessional full of raised arms and loud cheers — the kind of celebration where every guest is part of the story.",
  },
  {
    slug: "jillyan-nick",
    couple: "Jillyan + Nick",
    video: "itpNCKYn7B4",
    venue: "Salt Lake City",
    location: "Salt Lake City, Utah",
    region: "mainland",
    mood: ["Moving", "Heartfelt", "Intentional"],
    ytTitle: "Moving, Heartfelt, and Intentional wedding of Jillyan + Nick | Salt Lake City, Utah",
    line: "Moving, heartfelt and <span class=\"it\">intentional.</span>",
    story:
      "Jillyan and Nick's wedding took the camera from the islands to Salt Lake City, Utah. Quiet closeness, golden light and a story told with intention — proof that the people, not the postcode, lead every film.",
  },
  {
    slug: "john-sakura",
    couple: "John + Sakura",
    video: "WGo_VWh5wRI",
    venue: "Four Seasons Resort Oahu",
    location: "Ko Olina, Oahu",
    region: "oahu",
    mood: ["Oceanfront", "Lush", "Joyful"],
    ytTitle: "Four Seasons, Oahu, Hawaii Wedding | John + Sakura",
    line: "Maile lei and <span class=\"it\">ocean light.</span>",
    story:
      "Maile lei, tropical florals and an ocean view framed by palms. John and Sakura's ceremony at Four Seasons Resort Oahu is all smiles and sideways glances — the small looks that say everything.",
  },
  {
    slug: "mike-victoria",
    couple: "Mike + Victoria",
    video: "uX9gSYDRctw",
    venue: "Four Seasons Resort Oahu",
    location: "Ko Olina, Oahu",
    region: "oahu",
    mood: ["Sunset", "Intimate", "Elegant"],
    ytTitle: "Four Seasons Oahu, Hawaii Wedding | Mike + Victoria",
    line: "Waves, lava rock and <span class=\"it\">the last light.</span>",
    story:
      "Waves breaking on lava rock, the last of the sun and a quiet moment between two people. Mike and Victoria's sunset by the shore at Four Seasons Oahu is elegant, intimate and unmistakably Hawaii.",
  },
  {
    slug: "michael-adrienne",
    couple: "Michael + Adrienne",
    video: "OAF6KZrBGzk",
    venue: "Hale Wailele",
    location: "Kona, Hawaii Island",
    region: "big-island",
    mood: ["Golden hour", "Island", "Tender"],
    ytTitle: "Hale Wailele Wedding | Kona, Hawaii | Michael + Adrienne",
    line: "A haku lei and <span class=\"it\">a Kona sunset.</span>",
    story:
      "A haku lei, a Kona sunset and nothing but ocean on the horizon. Michael and Adrienne's day at Hale Wailele glows from start to finish — tender, golden and made for slow, close frames.",
  },
  {
    slug: "steven-sherrie-mae",
    couple: "Steven + Sherrie-Mae",
    video: "CWCR__HvvXI",
    venue: "Ko'olau Ballrooms",
    location: "Kaneohe, Oahu",
    region: "oahu",
    mood: ["Rainforest", "Classic", "Warm"],
    ytTitle: "Wedding at Ko'olau Ballrooms, Oahu, Hawaii | Steven + Sherrie-Mae",
    line: "Rainforest green and <span class=\"it\">maile lei.</span>",
    story:
      "Deep rainforest green, maile leis and an easy, laughing closeness. Steven and Sherrie-Mae's wedding at Ko'olau Ballrooms on Oahu's windward side is classic, warm and full of family.",
  },
];

export const img = (f) => `assets/img/films/${f.video}.jpg`;

// Real couple reviews, quoted from Mark's public WeddingWire and Zola listings.
// Confirm with Mark before launch, and add more from his 23 WeddingWire reviews.
export const reviews = {
  rating: "5.0",
  count: 23,
  source: "WeddingWire",
  sourceUrl: "https://www.weddingwire.com/biz/mja-films-waipahu/72f2a5ee04fd5312.html",
  items: [
    { q: "Kind, friendly, and made my husband and I feel comfortable in front of the camera.", n: "Shanelle", s: "WeddingWire · 2026" },
    { q: "Mark was so beyond flexible and understanding through our TWO postponements.", n: "Wynter", s: "WeddingWire · 2022" },
    { q: "Really capture the intimate moments that you want to look back on years down the line.", n: "Brysen & C.", s: "Zola · 2022" },
    { q: "Incredibly courteous, responsive… (including traveling from Oahu to Kauai).", n: "Jiajia", s: "WeddingWire · 2022" },
    { q: "Worked extremely well with our photographer.", n: "Smitha", s: "Indian wedding, Honolulu · WeddingWire · 2022" },
    { q: "Please book with him ASAP, you won't be disappointed.", n: "Crystal", s: "WeddingWire · 2023" },
  ],
};
