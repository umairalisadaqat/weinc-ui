const meta = {
  "slug": "rippling-lake-reflection-lines-dawn-background",
  "category": "backgrounds",
  "name": "Rippling Lake Reflection at Dawn",
  "keyword": "wave background css",
  "title": "",
  "description": "",
  "intro": "A still lake at sunrise: peach sky, a low treeline, and water drawn as eighteen hairline ripples that crowd together near the horizon and spread out toward you. Three groups of lines drift at different speeds, one against the others, so the sun's reflection breaks into a soft shimmer. It suits lodges, retreats and quiet outdoor brands.",
  "useWhen": [
    "A lakeside lodge, rowing club or wellness retreat wants a calm, painterly hero.",
    "You want a wave background made of lines rather than filled shapes, so it stays light behind text."
  ],
  "customize": [
    "Recolour the scene through `SKY` and `WATER`; keep the water a little darker than the sky at the horizon so the treeline reads.",
    "`GROUP_SECONDS` sets how fast each ripple group drifts; values under 20 start to look like wind chop rather than a breeze.",
    "Each row of `LINES` is one ripple. Raise the second number (amplitude) for a choppier surface or the sixth (stroke width) for heavier lines."
  ],
  "accessibility": [
    "All scenery is one `aria-hidden` layer, and the headline sits on the light sky at well over 4.5:1 contrast."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wave",
    "lake",
    "reflection",
    "lines",
    "dawn"
  ],
  "height": 680,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "css",
  "reducedMotion": "The ripples and the broken sun reflection hold still as a quiet dawn picture.",
  "perf": "Four composited transforms over static SVG strokes; nothing repaints while it moves."
};

export default meta;
