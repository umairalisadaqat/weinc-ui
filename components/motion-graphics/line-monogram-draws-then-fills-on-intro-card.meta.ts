const meta = {
  "slug": "line-monogram-draws-then-fills-on-intro-card",
  "category": "motion-graphics",
  "name": "Line Monogram That Draws Then Fills",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "A bookbinder's HB monogram is drawn as six strokes: the ring first, then each stem, bar and bowl in turn. Once the lines are down, a solid ink disc with paper-coloured letters fades in over them, so the mark finishes as a filled seal. It suits an intro card, an about page header or the top of an order email.",
  "useWhen": [
    "A craft business whose monogram is built from straight strokes and simple bowls that read well as single lines."
  ],
  "customize": [
    "Change the ink and paper with `--m1mon-ink` and `--m1mon-card`; the filled disc and its letters take the same two colours.",
    "Replace the five letter paths in both groups with your own monogram, keeping `pathLength=\"1\"` on every drawn stroke.",
    "Shift the stagger by editing the `animation-delay` on `.d1` to `.d5`, and the fill timing on `.m1mon-fill`."
  ],
  "accessibility": [
    "The SVG has `role=\"img\"` and an `aria-label` naming the business, so the mark is announced once rather than as loose paths."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "monogram animation",
    "svg logo draw",
    "stroke animation",
    "logo reveal"
  ],
  "height": 460,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The filled monogram and the card text appear complete with no drawing or fading.",
  "perf": "Six short strokes repaint while drawing and one group fades; after about 1.5 seconds nothing runs."
} satisfies UiMeta;

export default meta;
