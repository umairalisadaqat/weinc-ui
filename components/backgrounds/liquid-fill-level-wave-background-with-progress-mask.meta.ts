const meta = {
  "slug": "liquid-fill-level-wave-background-with-progress-mask",
  "category": "backgrounds",
  "name": "Liquid Fill Level Wave",
  "keyword": "animated wave background",
  "title": "",
  "description": "",
  "intro": "The whole hero fills with deep green water up to the share of a goal already reached, and its surface rolls in two layers. The waves are pure CSS masks: a tiled wave image cut into a sliding layer, so there is no SVG or script in the motion at all. The figure and button sit in the water in white, which keeps them readable.",
  "useWhen": [
    "A fundraiser, pre-order or membership drive wants progress shown as something you can feel rather than a thin bar.",
    "You need a mask-based wave you can drop onto any coloured layer, including images or gradients."
  ],
  "customize": [
    "Set `LEVEL` to the percentage reached; it writes `--lqfl-level`, which sets how high the water stands.",
    "Recolour the water in the `.lqfl-back` and `.lqfl-front` gradients; keep the front darkest so white text stays readable.",
    "Change the two `animation-duration` values (11s back, 7s front) for a calmer or livelier surface."
  ],
  "accessibility": [
    "The percentage and amounts are real text in the page, so screen readers get the progress even though the water itself is `aria-hidden`.",
    "White text only sits on the darkest part of the water, which stays above 7:1 contrast."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wave",
    "mask",
    "progress",
    "liquid",
    "css"
  ],
  "height": 660,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "css",
  "reducedMotion": "The water stands at the goal level with a still, gently curved surface.",
  "perf": "Three masked layers moved with transform; the mask is a static image, so the browser only composites."
};

export default meta;
