export default {
  "slug": "bakery-layered-lift-preloader-with-three-stacked-colours",
  "category": "loaders",
  "name": "Bakery Layered Lift Preloader",
  "keyword": "loading screen html css",
  "tags": [
    "preloader",
    "layered reveal",
    "bakery",
    "loading screen",
    "stacked panels"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "None of the sheets lift; the stack fades out once and the bakery page is already settled.",
  "perf": "Three full-size layers translate once with staggered delays, then the cover is taken out of the page.",
  "intro": "Three coloured sheets, rye brown on top, crust orange and flour cream beneath, cover a bakery homepage while its two bread photos load. When both have arrived the sheets lift one after another, so the colours flash past like layers of a loaf before the page appears. Opening hours sit in real text below the headline.",
  "customize": [
    "Set the three sheet colours with `--w2stk-rye`, `--w2stk-crust` and `--w2stk-flour`.",
    "Space the layers further apart by raising the `.13s` and `.26s` delays on `.w2stk-l2` and `.w2stk-l3`.",
    "Edit the opening times in the `.w2stk-hours` list; each pair is a term and its value."
  ],
  "accessibility": [
    "Opening hours are a description list, so assistive technology reads each day range with its times."
  ],
  "useWhen": [
    "A cafe or bakery has a warm palette of two or three colours worth showing off for a moment."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
