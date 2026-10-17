const meta = {
  "slug": "mouse-outline-scroll-cue-with-rolling-wheel-dot",
  "category": "motion-graphics",
  "name": "Mouse Outline Scroll Cue With Rolling Wheel Dot",
  "keyword": "mouse scroll animation css",
  "title": "",
  "description": "",
  "intro": "A cabin rental's full-height photo hero with a small mouse outline at the bottom centre. A dot inside it rolls down like a scroll wheel and fades, every couple of seconds, above the words Scroll to the cabins. The whole cue is one link to the cabin list, and it fades away as soon as that list starts to come up.",
  "useWhen": [
    "A photo-led first screen for a stay, venue or place where the image fills the view and the visitor may not guess there is more below."
  ],
  "customize": [
    "Slow the roll by raising `--m5mse-loop`, for example to 3s for a calmer hero.",
    "Change the link text in `.m5mse-label` and the `href` to point at your own section id.",
    "Swap the photo in `.m5mse-photo` and adjust the gradient stops in `.m5mse-shade` until the heading reads clearly."
  ],
  "accessibility": [
    "The cue is a real link with visible text, so keyboard and screen reader users reach the cabin list the same way; the mouse drawing itself is hidden from assistive tech.",
    "Following the link moves focus to the cabin section, so the next Tab continues from there."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "mouse scroll animation",
    "scroll cue",
    "hero section",
    "svg"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The mouse outline shows with its wheel dot resting at the top, and the link jumps straight to the cabins.",
  "perf": "One small circle moves with transform and opacity, and the loop pauses once the cue has faded or the piece is off screen."
} satisfies UiMeta;

export default meta;
