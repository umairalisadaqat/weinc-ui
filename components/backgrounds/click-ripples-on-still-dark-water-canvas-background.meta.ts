const meta = {
  "slug": "click-ripples-on-still-dark-water-canvas-background",
  "category": "backgrounds",
  "name": "Click Ripples on Still Dark Water",
  "keyword": "css wave animation",
  "title": "",
  "description": "",
  "intro": "Dark, still water seen at a low angle. Click or tap anywhere off the text and a set of flattened rings spreads out from that spot, each bright edge trailed by a thin shadow so it reads as a real ripple. Drops also fall by themselves now and then, so the scene is alive before anyone touches it. Good for spas, float studios and calm wellness brands.",
  "useWhen": [
    "A spa, float tank or meditation studio wants a hero that rewards a curious tap without demanding one.",
    "You want a dark water background with interaction that never blocks the button or the text above it."
  ],
  "customize": [
    "`SPEED` (pixels per second) and `LIFE` (seconds) set how far a ripple travels before it fades.",
    "`DROP_EVERY` controls the automatic drops; raise it to 4 for long stretches of stillness.",
    "`TILT` flattens the rings; 1 looks straight down at the water, 0.25 looks across it."
  ],
  "accessibility": [
    "Ripples are decoration only: the canvas is `aria-hidden`, clicks on the link are ignored by the effect, and nothing is reachable only by tapping the water."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "ripple",
    "click effect",
    "water",
    "canvas",
    "interactive"
  ],
  "height": 640,
  "section": true,
  "interactive": true,
  "collection": "css-wave-animation",
  "tech": "canvas",
  "reducedMotion": "A few rings are drawn still on the water, and taps add new rings without any animation.",
  "perf": "A handful of ellipse strokes per live ripple on a 2D canvas, far below a millisecond; idle off screen."
};

export default meta;
