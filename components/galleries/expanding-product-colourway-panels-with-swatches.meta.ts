const meta = {
  slug: "expanding-product-colourway-panels-with-swatches",
  category: "galleries",
  name: "Expanding Product Colourway Panels With Swatches",
  keyword: "product color swatch gallery",
  title: "",
  description: "",
  intro: "A product block where every colourway gets its own panel. Closed panels read as flat glaze swatches with the colour name set sideways; opening one fades the swatch away to show the photo, while the details column beside it updates the piece name, a short glaze note and the buy button. Round swatch buttons offer a second way in, and on phones the panels stack.",
  useWhen: [
    "A maker sells one item in several finishes and wants shoppers to compare them before choosing.",
    "A product page needs the gallery and the variant picker to stay in step with each other.",
  ],
  customize: [
    "Set each colourway's swatch with `--hex` and its label colour with `--ink` on the panel, choosing an ink that reads clearly on that swatch.",
    "Edit names and notes in `GLAZES` (React) or the `data-name` and `data-note` attributes (HTML).",
    "Narrow the swatches with `--c` on `.w5clr-stage` if you add more than five finishes.",
  ],
  accessibility: [
    "Panels and round swatches are both buttons, with aria-expanded on the panels and aria-pressed on the swatches, and the glaze note sits in a polite live region so the change is announced.",
  ],
  faqs: [],
  related: [],
  tags: ["product gallery", "color swatches", "expanding panels", "ecommerce", "variant picker"],
  height: 668,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The chosen colourway swaps in at once and the swatch layer disappears without a fade.",
  perf: "A few transforms and one opacity fade per change, with no work while nothing is being chosen.",
};

export default meta;
