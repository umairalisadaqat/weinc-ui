const meta = {
  "slug": "hexagon-logo-settles-from-scattered-parts-on-sign-in",
  "category": "motion-graphics",
  "name": "Hexagon Logo Settling From Scattered Parts",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "Six amber triangles start scattered and tilted around a beekeeper's sign-in card, then drift inward and turn until they close into a hexagon. A small cell opens in the middle last. Each part reads its own start offset and angle from three custom properties, so the scatter pattern is easy to rearrange.",
  "useWhen": [
    "A sign-in or welcome screen for a brand whose mark is split into equal segments around a centre."
  ],
  "customize": [
    "Move the scatter by editing `--x`, `--y` and `--r` on `.p1` to `.p6`.",
    "Change the two amber tones with `--m1sct-a` and `--m1sct-b`, and the card with `--m1sct-card`."
  ],
  "accessibility": [
    "The logo is a single labelled image, and the email field has a real label tied to it by `for` and `id`."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "logo assemble animation",
    "scattered parts",
    "sign in screen",
    "svg logo"
  ],
  "height": 560,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The closed hexagon with its centre cell sits above the form, already in place.",
  "perf": "Six triangles translate and rotate on the compositor for about 1.5 seconds and then stop."
} satisfies UiMeta;

export default meta;
