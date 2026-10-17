const meta = {
  "slug": "wordmark-uncovered-by-sliding-mask-on-navy-band",
  "category": "motion-graphics",
  "name": "Wordmark Uncovered by a Sliding Mask",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "A large serif wordmark for an architecture practice sits behind a navy panel with a brass leading edge. The panel slides off to the right inside an overflow-hidden window, uncovering the name letter by letter, while a hairline rule extends beneath it. The wordmark is live text, so it stays selectable and scales with the band.",
  "useWhen": [
    "A studio or practice whose logo is a typeset name, shown large across the top of a home page."
  ],
  "customize": [
    "Change the band and brass edge with `--m1msk-bg` and `--m1msk-brass`; the cover uses the band colour so it vanishes into it.",
    "Resize the name with the `clamp()` on `.m1msk-word`, or replace the text with your own wordmark SVG inside `.m1msk-win`.",
    "Speed up the wipe by shortening the `1.05s` on `.m1msk-cover`."
  ],
  "accessibility": [
    "The wordmark is the section heading in plain text, and the sliding cover is `aria-hidden`, so nothing extra is read out."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wordmark reveal",
    "mask reveal animation",
    "text logo animation",
    "css wipe"
  ],
  "height": 500,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The name, the rule and the links are all visible at once with no sliding cover.",
  "perf": "One panel translates and one rule scales, both composited, for about 1.5 seconds before everything is still."
} satisfies UiMeta;

export default meta;
