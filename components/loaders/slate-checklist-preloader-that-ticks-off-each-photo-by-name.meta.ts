export default {
  "slug": "slate-checklist-preloader-that-ticks-off-each-photo-by-name",
  "category": "loaders",
  "name": "Slate Checklist Preloader",
  "keyword": "image loading progress",
  "tags": [
    "preloader",
    "image progress",
    "interiors",
    "loading screen",
    "checklist"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "Rows still tick as photos arrive, then the white cover fades straight to the finished grid.",
  "perf": "Each tick is a class swap on one row, and the only loop is the short one easing the bar.",
  "intro": "Instead of a bare number, this cover lists each photo on the page by its caption and ticks a row the moment that image fires its load or error event, with a slim bar summing them up. Then the list lifts away and the three room photos rise in order. Good for interiors, property or product pages where the pictures are the content.",
  "customize": [
    "Keep the cover list in the same order as the page's images, since row one ticks when image one loads.",
    "Change the tick and bar colour with `--w2lst-accent` and the text colour with `--w2lst-slate`.",
    "Rename the rows to match your own photo captions so the cover tells people what is on its way."
  ],
  "accessibility": [
    "The rows are only shown to sighted visitors; screen readers hear a single polite Loading and then Page ready.",
    "Captions under the photos repeat the row names in plain text, so nothing on the cover is lost when it goes."
  ],
  "useWhen": [
    "A portfolio page shows a few named projects and you want the wait to explain itself.",
    "Visitors on slow connections should see which pictures are still coming."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
