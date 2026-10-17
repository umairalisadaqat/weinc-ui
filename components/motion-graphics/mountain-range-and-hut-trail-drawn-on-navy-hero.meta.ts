const meta = {
  "slug": "mountain-range-and-hut-trail-drawn-on-navy-hero",
  "category": "motion-graphics",
  "name": "Mountain Range and Hut Trail on a Navy Hero",
  "keyword": "svg stroke animation",
  "title": "",
  "description": "",
  "intro": "A trekking guide hero on deep navy. Three ridgelines draw from back to front in cream ink, a sun and a few cloud strokes follow, shading hatches settle on the slopes and an amber trail climbs between them, dropping numbered markers for each night's stop. On narrow screens the drawing crops at the sides instead of shrinking, so the trail stays readable.",
  "useWhen": [
    "A route, tour or outdoor event page whose first screen should show where the walk goes without loading a photo."
  ],
  "customize": [
    "Change the trail and marker colour with `--m4mtn-trail` and the night sky with `--m4mtn-bg`.",
    "Move a hut by editing its marker circle's `cx` and `cy` and the matching point in the trail path."
  ],
  "accessibility": [
    "The drawing is labelled as an image describing the climb, and the three stops are also written as an ordered list under it."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "mountain line art",
    "svg trail animation",
    "hero illustration",
    "stroke-dashoffset"
  ],
  "height": 759,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The whole range, the trail and all three numbered stops are drawn and still.",
  "perf": "Long ridge strokes repaint while they draw for under 1.6 seconds, then the hero is static."
} satisfies UiMeta;

export default meta;
