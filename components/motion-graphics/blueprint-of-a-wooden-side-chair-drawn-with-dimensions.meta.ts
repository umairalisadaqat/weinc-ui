const meta = {
  "slug": "blueprint-of-a-wooden-side-chair-drawn-with-dimensions",
  "category": "motion-graphics",
  "name": "Blueprint of a Wooden Side Chair with Dimensions",
  "keyword": "svg animation",
  "title": "",
  "description": "",
  "intro": "A workshop drawing for a furniture maker, set on blueprint blue with a faint grid. The floor line comes first, then the chair in front and side elevation, rail by rail and leg by leg, and finally the amber dimension lines with their figures. On phones the title block wraps into two rows under the drawing.",
  "useWhen": [
    "A product story, a maker's process page or a case study where showing how something is designed matters as much as the finished photo."
  ],
  "customize": [
    "Change the paper with `--m4chr-blue` and the dimension colour with `--m4chr-focus`.",
    "Edit the figures in the four `text` elements and the `aria-label` together so the drawing and its description agree."
  ],
  "accessibility": [
    "The drawing is labelled as an image that states every dimension, and the material, scale and units are written in the title block."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "blueprint",
    "technical drawing",
    "svg line drawing",
    "furniture"
  ],
  "height": 734,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The complete blueprint with all dimensions is shown without drawing.",
  "perf": "Around twenty strokes repaint in a 1.5 second stagger, then the sheet never changes."
} satisfies UiMeta;

export default meta;
