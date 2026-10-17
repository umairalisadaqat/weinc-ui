const meta = {
  "slug": "out-of-focus-bokeh-lights-particle-background",
  "category": "backgrounds",
  "name": "Out-of-Focus Bokeh Lights",
  "keyword": "bokeh background",
  "title": "",
  "description": "",
  "intro": "String lights seen through a wide-open lens. Each light is a disc with a slightly brighter rim, the way real lens bokeh looks, rather than a fuzzy dot. Distant lights are small and crisp, close ones are large and softer, and the whole frame slowly breathes in and out of focus as the lights drift. Suits weddings, events, hospitality and photography.",
  "useWhen": [
    "A wedding filmmaker, venue or photographer wants an evening glow behind a centred headline.",
    "You need a warm, celebratory backdrop that does not feel like a party template."
  ],
  "customize": [
    "Edit the `COLOURS` array for the light tones; all ambers give a candlelit room, cooler tones a city at dusk.",
    "Set `FOCUS_BREATH` to 0 to hold the lens steady, or 2 for a stronger pull.",
    "Raise `LIGHTS_PER_MPX` to fill more of the frame with lights."
  ],
  "accessibility": [
    "A soft dark pool sits behind the centred copy so passing lights never wash out the text, and the canvas is `aria-hidden` and ignores clicks."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "bokeh",
    "lights",
    "canvas",
    "evening"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "The lights hold still in one soft, warm composition with no drift or focus change.",
  "perf": "Under 90 large additive sprite draws per frame from cached discs; cheap on CPU, with some fill cost on very wide screens."
};

export default meta;
