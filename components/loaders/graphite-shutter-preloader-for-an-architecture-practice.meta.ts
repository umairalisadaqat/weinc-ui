export default {
  "slug": "graphite-shutter-preloader-for-an-architecture-practice",
  "category": "loaders",
  "name": "Graphite Shutter Preloader",
  "keyword": "shutter preloader css",
  "tags": [
    "preloader",
    "shutters",
    "loading screen",
    "architecture",
    "page intro"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The graphite cover stays still and simply fades away once the photographs are in.",
  "perf": "Six flat layers move by transform once, and the progress loop only runs while images are still loading.",
  "intro": "Six graphite slats cover an architecture practice's homepage while its two photographs load, with a thin rule and a large percentage counting the images that have arrived. When the last one lands, alternate slats slide up and down in a quick ripple and the photos settle from a slight zoom. Suits portfolio sites that lead with large pictures.",
  "customize": [
    "Change the cover and page colours through `--w2shu-cover` and `--w2shu-page` at the top of the CSS.",
    "Add or remove `.w2shu-slat` spans to get more or fewer shutters; the flex row shares the width between them.",
    "Shorten the ripple by lowering the `transition-delay` steps on the `nth-child` rules."
  ],
  "accessibility": [
    "The page sits under `aria-busy` and `inert` until the photos are in, and a polite live region says Loading, then Page ready.",
    "The cover is hidden from assistive technology and leaves the page once the shutters have opened."
  ],
  "useWhen": [
    "An architect or builder wants the first view to arrive whole instead of photo by photo.",
    "A portfolio homepage opens on one or two heavy images above the fold."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
