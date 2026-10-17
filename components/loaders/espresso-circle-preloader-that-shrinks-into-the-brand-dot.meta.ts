export default {
  "slug": "espresso-circle-preloader-that-shrinks-into-the-brand-dot",
  "category": "loaders",
  "name": "Espresso Circle Shrink Preloader",
  "keyword": "preloader css",
  "tags": [
    "preloader",
    "circle reveal",
    "coffee",
    "loading screen",
    "roastery"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The bean holds still and the dark disc fades out in place instead of shrinking.",
  "perf": "One large disc scales once and a small bean turns on a CSS loop that is paused off screen.",
  "intro": "An espresso-dark disc fills the box with a turning coffee bean and a percentage of the page's photos loaded. When they are ready, the disc shrinks into the round dot of the logo, and the arched roaster photo and round bean photo grow into place. A warm, rounded choice for cafes and roasters whose brand already uses circles.",
  "customize": [
    "Recolour the disc, the bean and the page with `--w2cir-espresso`, `--w2cir-crema` and `--w2cir-milk`.",
    "Move where the disc lands by changing the `left` and `top` of `.w2cir-disc` to the centre of your own logo mark.",
    "Keep `--w2cir-d` large enough that the disc, centred on the logo, still reaches the far corner of the box."
  ],
  "accessibility": [
    "The turning bean is drawn with plain elements, is hidden from assistive technology and stops when the box is off screen."
  ],
  "useWhen": [
    "A cafe, roaster or tea shop has a round logo and a photo-led homepage.",
    "You want a reveal that closes onto the logo instead of leaving by one edge."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
