const meta = {
  slug: "split-flap-number-counter-with-hinged-digit-leaves",
  category: "text-effects",
  name: "Split-Flap Number Counter",
  keyword: "counter animation",
  title: "",
  description: "",
  intro:
    "Three weekly figures for a harbourside restaurant, each digit printed on a charcoal card cut across the middle. As the board comes into view, every card steps upward from zero, its upper leaf dropping on a hinge and darkening as it falls, until the real number rests. Good for venues, transport and event pages.",
  useWhen: [
    "You want a counter with a tactile, mechanical feel on a dark page, and the figures are short enough to read as a board.",
  ],
  customize: [
    "Edit the `rows` array to change labels and figures; the board adds one card per digit by itself.",
    "Slow or quicken the clatter with `STEP`; the leaf duration follows it at 45 percent, or set `--sfc-d` in the plain version.",
    "Recolour the cards through the `.sfc-top` and `.sfc-bot` gradients, and the numerals through `#efe9dc`.",
  ],
  accessibility: [
    "The cards are aria-hidden and each figure is also written once in a hidden span, so assistive tech reads 1,486 instead of a run of separate digits.",
  ],
  faqs: [],
  related: [],
  tags: ["split flap counter", "flip counter", "counter animation", "departure board numbers"],
  height: 660,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "Every card shows its final digit at once and no leaves fall.",
  perf: "A short interval swaps a few text nodes; each flip is two CSS transform animations on small elements.",
};

export default meta;
