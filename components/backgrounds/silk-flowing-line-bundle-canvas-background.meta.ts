const meta = {
  "slug": "silk-flowing-line-bundle-canvas-background",
  "category": "backgrounds",
  "name": "Silk Flowing Line Bundle",
  "keyword": "animated wave background",
  "title": "",
  "description": "",
  "intro": "Ninety hairlines strung between two slowly moving curves fold over themselves like a length of silk caught in a draught. Threads shade from warm sand to sea glass and add up where they cross, so the folds glow softly on a near-black slate. It suits textile studios, perfume, jewellery and any brand that sells on touch and finish.",
  "useWhen": [
    "A fashion, textile or beauty brand wants a dark hero with movement that feels like fabric rather than water.",
    "You want a single elegant gesture across the lower half of the page, leaving the headline area calm."
  ],
  "customize": [
    "`THREADS` sets how many lines make up the bundle; 50 looks like loose thread, 140 like dense satin.",
    "Change `SAND` and `GLASS` (rgb) for the colour of the cloth from left to right, and `ALPHA` for how bright it glows.",
    "Lower `SPEED` to 0.5 for a slower drape, or raise it for a livelier ripple."
  ],
  "accessibility": [
    "The canvas is `aria-hidden` and a dark wash sits behind the copy, so text keeps strong contrast where threads cross under it."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "silk",
    "lines",
    "canvas",
    "flowing",
    "dark"
  ],
  "height": 640,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "canvas",
  "reducedMotion": "A single folded drape of threads is painted once and stays still.",
  "perf": "Ninety bezier strokes per frame on a 2D canvas, under a millisecond; pauses off screen."
};

export default meta;
