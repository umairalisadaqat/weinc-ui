const meta = {
  "slug": "pill-scroll-button-with-arrow-sliding-through-chip",
  "category": "motion-graphics",
  "name": "Pill Scroll Button With Arrow Sliding Through Chip",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A bakery's photo hero with a cream sign card in the middle and a cream pill at the foot of the screen that says See today's loaves. Inside the pill's dark round chip, the arrow drops out of the bottom and a fresh one slides in from the top, so it reads like a button that wants pressing. The pill stays centred on phones.",
  "useWhen": [
    "A hero where the cue should look like a proper button, with words big enough to read as a call to action."
  ],
  "customize": [
    "Change the wording in `.m5pil-label` and point the `href` at your own section.",
    "Shorten the still pause before each drop by lowering the `45%` stop in `m5pil-slide`."
  ],
  "accessibility": [
    "The pill is a link whose visible words name the destination, with a 52px tall target that is easy to tap."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "animated arrow css",
    "pill button",
    "scroll down button",
    "bakery hero"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The pill shows its arrow resting in the middle of the chip, and following it jumps to the loaves.",
  "perf": "One small arrow moves with transform inside a clipped chip; the loop pauses once the pill fades or the hero is off screen."
} satisfies UiMeta;

export default meta;
