const meta = {
  "slug": "cascading-chevron-pair-scroll-cue-on-split-hero",
  "category": "motion-graphics",
  "name": "Cascading Chevron Pair Scroll Cue on Split Hero",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A pottery studio's split first screen, words on warm sand at the left and a wheel photo at the right. Under the copy sits a dark round chip holding two chevrons that brighten and dip one after the other, next to the words See the classes. On phones the photo moves above the text and the cue stays at the foot of the screen.",
  "useWhen": [
    "A two-column hero where the cue should sit with the text as a call to read on, rather than float over a photo."
  ],
  "customize": [
    "Change the gap between the two chevrons' pulses with the `.18` multiplier on `.m5chv-c2`.",
    "Recolour the chip with `--m5chv-ink` and the chevrons with the `color` on `.m5chv-chev`."
  ],
  "accessibility": [
    "The link reads See the classes and moves focus to the class list, while the chevron drawing is hidden from screen readers."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "animated chevron",
    "scroll down arrow",
    "split hero",
    "css animation"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "Both chevrons stay at full strength in the chip and the link goes straight to the class list.",
  "perf": "Two short SVG paths fade and shift a couple of pixels; the loop stops when the cue is faded or off screen."
} satisfies UiMeta;

export default meta;
