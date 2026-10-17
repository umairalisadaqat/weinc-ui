const meta = {
  "slug": "layered-diagonal-stripe-bands-moving-at-three-depths",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "title": "",
  "description": "",
  "faqs": [],
  "related": [],
  "name": "Layered Diagonal Stripe Bands",
  "keyword": "css background animation",
  "intro": "Three sheets of diagonal bands in sand and madder red slide sideways at different speeds and sizes, so the large front bands seem nearer than the faint ones behind. A soft light patch keeps the centre calm for the headline. It fits craft, textile and interior brands that want texture with gentle motion on a light page.",
  "useWhen": [
    "A light, warm product page needs pattern and movement without dark backgrounds or glows."
  ],
  "customize": [
    "Change `--dsb-band` to recolour every layer at once, and `--dsb-ground` for the sand underneath.",
    "Raise `--dsb-near` for broader bands; the two back layers scale from it so the depth stays in proportion."
  ],
  "accessibility": [
    "The pale oval behind the text keeps dark copy well above 4.5:1 contrast while the bands pass under it."
  ],
  "tags": [
    "stripes",
    "diagonal",
    "parallax",
    "light theme",
    "warm"
  ],
  "height": 620,
  "reducedMotion": "All three band layers stop in place, leaving a still woven pattern with the same depth.",
  "perf": "Three tiled layers move with translateX on the compositor; nothing repaints while they slide."
};

export default meta;
