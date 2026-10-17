const meta = {
  "slug": "thin-arrow-sliding-down-vertical-rule-on-photo-hero",
  "category": "motion-graphics",
  "name": "Thin Arrow Sliding Down a Vertical Rule on Photo Hero",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A walking company's mountain photo hero with its cue in the lower left, beside the headline instead of under it. A hairline rule stands upright, and a thin gold arrow slides down it, fading before the end and coming back in at the top. A small numbered label, 01 Routes for this season, says where the link goes. On phones the rule shortens and sits under the text.",
  "useWhen": [
    "A wide landscape hero with a left-aligned headline, where a centred cue would fight the composition."
  ],
  "customize": [
    "Change how far the arrow travels with the `86px` in `m5rul-run`, and the rule height with the `height` of `.m5rul-rule` and its `viewBox`.",
    "Recolour the arrow and label number with `--m5rul-sun`."
  ],
  "accessibility": [
    "The number and words are real link text, and the rule and arrow are hidden from assistive tech."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "animated arrow css",
    "scroll cue",
    "vertical line",
    "landscape hero"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The arrow rests partway down the rule at full colour and the link jumps to the routes without gliding.",
  "perf": "A single arrow group moves with transform and opacity, and stops once the cue has faded or the frame is off screen."
} satisfies UiMeta;

export default meta;
