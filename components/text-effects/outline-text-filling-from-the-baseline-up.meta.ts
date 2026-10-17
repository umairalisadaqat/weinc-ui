const meta = {
  "slug": "outline-text-filling-from-the-baseline-up",
  "category": "text-effects",
  "name": "Outline Text Filling from the Baseline Up",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "The headline starts as a thin outline and fills from the bottom up, as if poured, with a warm roast-brown gradient that deepens toward the top. After a pause the level drops away and the outline is left again. Set on a soft dawn background, it fits a roaster, a bakery or any early-morning trade.",
  "useWhen": [
    "A warm, light hero where the headline should feel crafted and slowly made, not flashed on."
  ],
  "customize": [
    "Change the outline weight with the `.02em` in `-webkit-text-stroke` on `.sf-outline`; heavier fonts take a thicker stroke well.",
    "Recolour the fill gradient through `--sf-accent` (bottom) and `--sf-ink` (top), and the dawn through the `bgImage` gradient on `.sf-root`.",
    "Hold the full colour longer by moving the `44%` and `84%` stops in `@keyframes sf-flood` apart."
  ],
  "accessibility": [
    "Both the outline copy and the filled copy are hidden from screen readers; one plain copy is read instead, and the filled state is what reduced motion shows."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "outline text animation",
    "text fill animation",
    "stroke text css",
    "liquid fill text"
  ],
  "height": 500,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "The headline is shown fully filled in its warm brown gradient.",
  "perf": "Animates clip-path on one text layer; the browser repaints only the headline while the level moves."
};

export default meta;
