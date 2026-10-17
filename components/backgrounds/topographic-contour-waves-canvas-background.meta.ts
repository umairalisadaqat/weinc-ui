const meta = {
  "slug": "topographic-contour-waves-canvas-background",
  "category": "backgrounds",
  "name": "Topographic Contour Waves",
  "keyword": "animated wave background",
  "title": "",
  "description": "",
  "intro": "Graphite contour lines on warm survey paper, with every fifth line drawn heavier and one picked out in rust. Hills and hollows drift slowly beneath the paper and the contours are retraced every frame, so rings open, close and slide like a map that breathes. A faint grid and a soft wash behind the headline keep the copy crisp. It fits surveyors, architects, trail brands and outdoor gear.",
  "useWhen": [
    "A surveying, landscape or architecture practice wants a background that speaks its own drawing language.",
    "You want a light, printed-feeling wave pattern instead of glowing gradients."
  ],
  "customize": [
    "`STEP` is the height gap between contours; 0.05 draws a dense map, 0.12 an airy one. `CELL` trades smoothness for speed.",
    "`HILLS` lists each rise as x, y, radius, height and phase; a negative height makes a hollow, and a broad flat one under the headline keeps it quiet.",
    "Change `INK` and `ACCENT` (rgb triplets) and the section background for a blueprint or dark-mode look."
  ],
  "accessibility": [
    "The canvas is `aria-hidden` and sits under a soft paper wash, so the headline stays above 4.5:1 wherever the lines bunch up."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "topographic",
    "contour lines",
    "canvas",
    "map",
    "wave"
  ],
  "height": 640,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "canvas",
  "reducedMotion": "One settled contour map is drawn once and the frame loop never starts.",
  "perf": "Marching squares over a 14 pixel grid, roughly 1 to 2 ms a frame on a laptop; stops off screen."
};

export default meta;
