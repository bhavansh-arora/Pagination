// Single source of truth for site content.
// Every film here is a real, public film on Mark's YouTube channel (@bymarkarista).
// Add a film (and run `python3 tools/frames.py assets/img/f <id>` for its stills), then `node src/build.mjs`.

export const site = {
  name: "Mark Arista Films",
  person: "Mark Arista",
  tagline: "Hawaii Wedding Videographer",
  email: "mark@aristafilms.co",
  // The address this site is published at. Link previews, canonical links and the sitemap use it,
  // so change it here (then rebuild) if the site moves to markarista.com.
  url: "https://aristafilms.codebunny.net",
  instagram: "https://www.instagram.com/markaristafilms/",
  facebook: "https://www.facebook.com/aristafilmsco",
  youtube: "https://www.youtube.com/@bymarkarista",
  // Hero reel: muted background loop on the home page.
  heroVideo: { id: "hzfBBlhqEzI", start: 18 },
};

export const regions = [
  { id: "oahu", label: "Oahu" },
  { id: "big-island", label: "Hawaii Island" },
  { id: "mainland", label: "Mainland" },
];

// Venues, in the order they appear on the venue index.
export const venues = {
  paliku: { name: "Paliku Gardens", area: "Kualoa Ranch, Oahu", img: "46cY5x1gD50", blurb: "A garden in the Ka'a'awa Valley at Kualoa Ranch, with the Ko'olau cliffs behind every frame." },
  lanikuhonua: { name: "Lanikuhonua", area: "Ko Olina, Oahu", img: "4CJ1LGkKKEg", blurb: "An oceanfront cultural estate of coconut palms and lagoons on Oahu's west side." },
  fourseasons: { name: "Four Seasons Resort Oahu", area: "Ko Olina, Oahu", img: "WGo_VWh5wRI", blurb: "Oceanfront ceremonies, sunset portraits and ballroom celebrations at Ko Olina." },
  koolau: { name: "Ko'olau Ballrooms", area: "Kaneohe, Oahu", img: "ik5kS-oYUXM", blurb: "Windward Oahu, right beneath the green walls of the Ko'olau Mountains." },
  cafejulia: { name: "Cafe Julia", area: "Downtown Honolulu", img: "iFhiyaFSSBA", blurb: "A historic courtyard building in the heart of downtown Honolulu." },
  loulu: { name: "Loulu Palm", area: "Kahuku, Oahu", img: "3CtPkGaEfMU", blurb: "A palm-lined garden venue on Oahu's North Shore." },
  sunsetranch: { name: "Sunset Ranch", area: "Haleiwa, Oahu", img: "DOKLGe2c1pM", blurb: "North Shore ranch land with long views and golden evenings." },
  lapietra: { name: "La Pietra", area: "Diamond Head, Honolulu", img: "ITdsnRT57i4", imgSuffix: "-2", blurb: "A historic Italian-style villa on the slopes of Diamond Head." },
  dillingham: { name: "Dillingham Ranch", area: "Waialua, Oahu", img: "fNSti-O84e4", imgSuffix: "-2", blurb: "Open ranch land at the foot of the Wai'anae Range on the North Shore." },
  turtlebay: { name: "Turtle Bay Resort", area: "Kahuku, Oahu", img: "vcLTSUN_kzI", blurb: "The Ritz-Carlton Oahu, Turtle Bay — the North Shore's oceanfront resort." },
  halewailele: { name: "Hale Wailele", area: "Kona, Hawaii Island", img: "OAF6KZrBGzk", blurb: "Coastal estate living and big Kona sunsets on Hawaii Island." },
  slc: { name: "Salt Lake City", area: "Utah", img: "itpNCKYn7B4", imgSuffix: "-2", blurb: "Proof the story travels — a mainland wedding with the same island heart." },
  aristide: { name: "Aristide", area: "Mansfield, Texas", img: "VGLLFgRVSeI", blurb: "An estate venue in North Texas, filmed with the same story-first approach." },
  yosemite: { name: "Yosemite National Park", area: "California", img: "m2EHcSTe5ec", blurb: "An elopement among Yosemite's forests and granite." },
};

const F = (video, slug, couple, venue, region, tags, extra = {}) => ({ video, slug, couple, venue, region, tags, cover: "", ...extra });

// Newest first, in channel order. `cover` picks the frame used as the card image
// ("" = YouTube's main still, "-1"/"-2"/"-3" = the other frames).
export const films = [
  F("lPcMcX9jjmM", "andy-morgan", "Andy + Morgan", "paliku", "oahu", ["Garden", "Beautiful"], { cover: "-2", title: "Beautiful wedding of Andy and Morgan at Paliku Garden" }),
  F("LFcjigBYz1A", "christian-kimmie", "Christian + Kimmie", "paliku", "oahu", ["Garden", "Mountains"], { cover: "-3" }),
  F("D3WDQ0Mj978", "alyssa-andrew", "Alyssa + Andrew", "paliku", "oahu", ["Heartfelt", "Garden"], { cover: "-1", title: "Heartfelt wedding of Alyssa and Andrew" }),
  F("ITdsnRT57i4", "angelyn-craig", "Angelyn + Craig", "lapietra", "oahu", ["Historic villa", "Joyful"], { cover: "-1" }),
  F("46cY5x1gD50", "parker-renee", "Parker + Renee", "paliku", "oahu", ["Garden", "Valley views"]),
  F("pOAoyvWkY4I", "matthew-julia", "Matthew + Julia", "sunsetranch", "oahu", ["Ranch", "North Shore"], { cover: "-2" }),
  F("EiA5wwhOABk", "tim-kim", "Tim + Kim", "paliku", "oahu", ["Garden", "Mountains"]),
  F("oMNoO73MD5k", "anton-cathy", "Anton + Cathy", "lanikuhonua", "oahu", ["Oceanfront", "Sunset"]),
  F("aLzFebTLplQ", "shanelle-edward", "Shanelle + Edward", "paliku", "oahu", ["Garden", "Romantic"]),
  F("0RURO9MIxn4", "joeleen-jordan", "Joeleen + Jordan", "cafejulia", "oahu", ["Historic", "Family"], { cover: "-2" }),
  F("vcLTSUN_kzI", "kevin-daphne", "Kevin + Daphne", "turtlebay", "oahu", ["Resort", "Oceanfront"], { cover: "-3", title: "Beautiful wedding at Turtle Bay Resort, The Ritz-Carlton" }),
  F("itpNCKYn7B4", "jillyan-nick", "Jillyan + Nick", "slc", "mainland", ["Moving", "Heartfelt", "Intentional"], { cover: "-2", title: "Moving, heartfelt and intentional" }),
  F("PsfFnelv-0M", "david-tiffany", "David + Tiffany", "loulu", "oahu", ["Heartfelt", "Christ-centered"], { cover: "-3", title: "Heartfelt + Christ-centered wedding" }),
  F("WGo_VWh5wRI", "john-sakura", "John + Sakura", "fourseasons", "oahu", ["Oceanfront", "Maile lei"]),
  F("hzfBBlhqEzI", "spencer-jenn", "Spencer + Jenn", "paliku", "oahu", ["Dreamy", "Romantic", "Fun"], { title: "Dreamy, romantic and fun" }),
  F("Ch_mROgi6YY", "jacob-megan", "Jacob + Megan", "paliku", "oahu", ["Dreamy", "Ocean views"], { title: "A dreamy wedding at Paliku Gardens" }),
  F("nymMeuzS7Lo", "katrina-erik", "Katrina + Erik", "lanikuhonua", "oahu", ["Oceanfront", "Palms"]),
  F("k77corBaJ34", "shang-sasly", "Shang + Sasly", "fourseasons", "oahu", ["Resort", "Family"], { cover: "-3" }),
  F("DOKLGe2c1pM", "evan-michele", "Evan + Michele", "sunsetranch", "oahu", ["Intimate", "Emotional"], { title: "Intimate + emotional" }),
  F("Us1xG-4j344", "claire-sutham", "Claire + Sutham", "lanikuhonua", "oahu", ["Oceanfront", "Celebration"], { cover: "-3" }),
  F("hQkW0HfhK3Y", "daniel-krista", "Daniel + Krista", "lanikuhonua", "oahu", ["Oceanfront", "Palms"]),
  F("ik5kS-oYUXM", "alexander-sarah", "Alexander + Sarah", "koolau", "oahu", ["Mountains", "Romantic"], { title: "Surrounded by the beautiful Ko'olau Mountains" }),
  F("fNSti-O84e4", "dillon-lauren", "Dillon + Lauren", "dillingham", "oahu", ["Ranch", "North Shore"], { cover: "-2" }),
  F("iFhiyaFSSBA", "joey-abigail", "Joey + Abigail", "cafejulia", "oahu", ["Historic", "Downtown"]),
  F("3CtPkGaEfMU", "kenneth-maxinne", "Kenneth + Maxinne", "loulu", "oahu", ["Garden", "Family"]),
  F("VGLLFgRVSeI", "julien-lyann", "Julien + Lyann", "aristide", "mainland", ["Epic", "Heartfelt"], { title: "Epic + heartfelt" }),
  F("z1kxigj8sno", "rafael-jean", "Rafael + Jean", "paliku", "oahu", ["Iglesia Ni Cristo", "Filipino"], { note: "Ceremony at Iglesia Ni Cristo, Ewa Beach" }),
  F("1xvZpZkeZp4", "ryan-christine", "Ryan + Christine", "paliku", "oahu", ["Garden", "Valley views"]),
  F("4CJ1LGkKKEg", "jesse-kanoe", "Jesse + Kanoe", "lanikuhonua", "oahu", ["Oceanfront", "Cultural estate"]),
  F("m2EHcSTe5ec", "keoni-angie", "Keoni + Angie", "yosemite", "mainland", ["Elopement", "Stunning"], { title: "Stunning Yosemite elopement" }),
  F("uX9gSYDRctw", "mike-victoria", "Mike + Victoria", "fourseasons", "oahu", ["Sunset", "Intimate"]),
  F("OAF6KZrBGzk", "michael-adrienne", "Michael + Adrienne", "halewailele", "big-island", ["Golden hour", "Haku lei"]),
  F("CWCR__HvvXI", "steven-sherrie-mae", "Steven + Sherrie-Mae", "koolau", "oahu", ["Rainforest", "Hawaiian blessing"]),
];

// Hand-picked couples for the home page reel.
export const featured = ["spencer-jenn", "jacob-megan", "michael-adrienne", "alexander-sarah", "jillyan-nick", "evan-michele", "rafael-jean", "keoni-angie"];

export const venueOf = (f) => venues[f.venue];
export const venueCount = (key) => films.filter((f) => f.venue === key).length;

// Image helpers: frames live in assets/img/f/<id><suffix>.webp (+ -sm.webp at 640w).
export const frame = (id, suffix = "") => `assets/img/f/${id}${suffix}.webp`;
export const frameSm = (id, suffix = "") => `assets/img/f/${id}${suffix}-sm.webp`;
export const cover = (f) => frame(f.video, f.cover);
export const frames = (f) => [f.cover, ...["", "-1", "-2", "-3"].filter((s) => s !== f.cover)];

// Short story for each film page, built only from public facts (couple, venue, title).
export const storyOf = (f) => {
  const v = venueOf(f);
  const [a, b] = f.couple.split(" + ");
  const lead = f.title ? `${f.title.replace(/\.$/, "")} — ` : "";
  const day = f.note ? `${f.note}, then ${v.name} in ${v.area} to celebrate.` : `${v.name}, ${v.area}.`;
  return `${lead}${a} and ${b}'s wedding day: ${day} ${v.blurb}`;
};

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
