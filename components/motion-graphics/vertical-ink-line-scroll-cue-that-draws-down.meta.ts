const meta = {
  "slug": "vertical-ink-line-scroll-cue-that-draws-down",
  "category": "motion-graphics",
  "name": "Vertical Ink Line Scroll Cue That Draws Down",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A type-led bookshop front page on warm paper, with no photo at all. Below the headline, the words Read on sit above a thin rule, and an ink line draws down that rule from top to bottom, holds for a beat, then slides off the lower end and starts over. It suits quiet editorial pages where an arrow would look too loud.",
  "useWhen": [
    "An editorial or literary first screen set mostly in type, where a single drawn line fits better than an arrowhead."
  ],
  "customize": [
    "Make the line longer by raising the `height` of `.m5lin-line` and the second number in the `viewBox` together.",
    "Change the pause at the bottom by moving the `50%, 58%` stop in the `m5lin-draw` keyframes."
  ],
  "accessibility": [
    "The visible words Read on are the link text; the drawn line is decoration and is hidden from assistive tech."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "svg line animation",
    "scroll indicator",
    "editorial hero",
    "stroke-dashoffset"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The ink line is shown fully drawn over its track, with no movement, and the link jumps to the next section.",
  "perf": "One short line repaints as its dash offset changes; the loop pauses when the cue fades or the piece leaves the screen."
} satisfies UiMeta;

export default meta;
