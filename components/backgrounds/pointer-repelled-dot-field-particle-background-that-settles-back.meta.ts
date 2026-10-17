const meta = {
  "slug": "pointer-repelled-dot-field-particle-background-that-settles-back",
  "category": "backgrounds",
  "name": "Pointer-Repelled Dot Field",
  "keyword": "interactive particle background",
  "title": "",
  "description": "",
  "intro": "A loose grid of graphite dots on warm paper. Move a pointer or finger through it and the dots are pushed aside, warming to a burnt orange while they are displaced, then spring back to their places and cool again. When nobody is touching it, an invisible guide wanders through the field so the hero is never static.",
  "useWhen": [
    "A studio or architecture practice wants an interactive hero that stays calm and print-like.",
    "You want visitors to feel the page respond to them, with the content still readable at rest."
  ],
  "customize": [
    "Change `RADIUS` for the size of the pushed area and `SPRING` for how fast dots return.",
    "Set `SPACING` to 14 for a fine, dense field or 28 for a bold, sparse one.",
    "Swap `HEAT` for the colour dots turn while displaced, for example a deep blue `\"30,64,175\"`."
  ],
  "accessibility": [
    "The effect is pure decoration on an `aria-hidden` canvas; pointer movement is read from the section, so links and buttons above it work as normal with mouse, touch or keyboard."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "interactive",
    "pointer",
    "canvas",
    "light theme"
  ],
  "height": 560,
  "section": true,
  "interactive": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "The dot grid is shown at rest with no wandering guide and no reaction to the pointer.",
  "perf": "Spring physics for around 2,000 to 3,000 dots on a wide screen, one sprite each; the heaviest piece here, still near a couple of milliseconds."
};

export default meta;
