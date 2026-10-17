const meta = {
  "slug": "botanical-olive-sprig-line-illustration-on-product-card",
  "category": "motion-graphics",
  "name": "Botanical Olive Sprig Line Illustration",
  "keyword": "line drawing animation",
  "title": "",
  "description": "",
  "intro": "A product card for a small apothecary with an olive sprig drawn in one green ink. The stem grows from the bottom first and each pair of leaves outlines itself as the stem passes, then the midribs, two small olives and the Latin name follow. On phones the drawing sits above the product notes.",
  "useWhen": [
    "A product or ingredient card for a soap, skincare, tea or garden shop where a botanical plate suits the brand better than a photo."
  ],
  "customize": [
    "Recolour the leaves with `--m4bot-leaf` and the olives with `--m4bot-fruit`.",
    "Each leaf is one closed path and its midrib is a second path; delete a pair or move its `.m4bot-t` delay class to change the rhythm."
  ],
  "accessibility": [
    "The sprig is decorative and hidden with `aria-hidden`; the product name, notes and link are ordinary text and a real link."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "botanical illustration",
    "svg path animation",
    "leaf drawing",
    "product card"
  ],
  "height": 600,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The full sprig with leaves, olives and caption is drawn and still.",
  "perf": "Twenty-odd short leaf strokes repaint while drawing for about 1.5 seconds, then the card is static."
} satisfies UiMeta;

export default meta;
