const meta = {
  "slug": "breathing-letter-spacing-display-headline",
  "category": "text-effects",
  "name": "Breathing Letter Spacing Display Line",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "A wide uppercase line that slowly opens and closes around its centre, like a breath, with a small lamp above it brightening in time. The letters move apart with transforms rather than real letter spacing, so the line never reflows and the copy underneath stays put. Built for a late-night, low-light brand.",
  "useWhen": [
    "A dark, quiet hero for a bar, library, spa or night-time event where calm matters more than speed."
  ],
  "customize": [
    "Set how far the line opens with the `.09em` in `@keyframes ls-breathe`; keep it small on long words so phones do not run out of width.",
    "Slow the breath with `--ls-speed`, and warm or cool the lamp with `--ls-accent`.",
    "Short words work best: the line is kept on one row with `white-space: nowrap`, so check a new phrase at 360px wide."
  ],
  "accessibility": [
    "A hidden span holds the words for screen readers, and the uppercase styling is done in CSS so the text is not read letter by letter."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "letter spacing animation",
    "tracking animation css",
    "breathing text",
    "display type animation"
  ],
  "height": 480,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "The line rests at its normal spacing and the lamp glows steadily.",
  "perf": "Transforms and opacity on about ten letters plus one small dot; runs on the compositor with no layout work."
};

export default meta;
