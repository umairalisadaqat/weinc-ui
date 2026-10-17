const meta = {
  slug: "ink-bleed-on-paper-text-reveal",
  category: "text-effects",
  name: "Ink Bleed on Paper Reveal",
  keyword: "ink text reveal",
  title: "",
  description: "",
  intro: "Italic serif words soak into grainy cream paper one after another, each spreading outward from a point inside the word while a slight blur dries away. A static fibre filter roughens the letter edges so the ink feels absorbed, not printed. Fits stationery, bookbinding, wine and other handmade brands.",
  useWhen: ["A product line or letterhead headline that should look written rather than typeset."],
  customize: ["Raise the `scale` on the `ibp-fibre` displacement map for rougher edges; above 4 the letters start to wobble.", "Change `--ibp-stagger` to let words bleed in faster or slower.", "Move the bleed origin by editing `circle at 30% 60%` in the mask."],
  accessibility: ["The full sentence is in a hidden span for screen readers and the masked word spans are aria-hidden."],
  faqs: [],
  related: [],
  tags: ["ink bleed effect", "paper texture css", "mask text animation", "handwritten style reveal"],
  height: 534,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "Words show fully inked on the paper with no spread, blur or fade.",
  perf: "An animated mask and blur per word plus a static SVG noise filter; moderate cost, best on one headline.",
};

export default meta;
