const meta = {
  "slug": "variable-font-weight-wave-across-a-headline",
  "category": "text-effects",
  "name": "Variable Font Weight Wave Across a Headline",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "A swell of weight runs along the headline: letters thicken from hairline to black and warm to a rust red as the wave passes, then thin out again. It uses the weight axis of a variable font, falling back to the system font's own weights. Each letter keeps a fixed cell, so the line does not wobble.",
  "useWhen": [
    "A music venue, radio show or events page that wants its type to feel like it has a pulse."
  ],
  "customize": [
    "Set the lightest and heaviest weights with `260` and `900` in `@keyframes vw-pulse`; the reserved width in `.vw-l::after` should match the heaviest.",
    "Change the length of the wave with the `55ms` step in the `.vw-g` delay, and its speed with `--vw-speed`.",
    "Pick the warm peak colour with `--vw-accent`; set it equal to `--vw-ink` for a weight-only wave."
  ],
  "accessibility": [
    "Letters are hidden from assistive technology and the line is read once from a visually hidden copy."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "variable font animation",
    "font weight animation",
    "font-variation-settings",
    "text wave css"
  ],
  "height": 480,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "Every letter rests at a medium weight in the dark ink colour.",
  "perf": "Changing font weight repaints the glyphs each frame; fine for one headline, too heavy for body text."
};

export default meta;
