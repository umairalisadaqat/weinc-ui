export default {
  slug: "two-linked-drag-rails-moving-at-different-speeds",
  category: "galleries",
  name: "Two Linked Drag Rails Moving at Different Speeds",
  keyword: "draggable slider",
  tags: ["drag slider", "linked rails", "momentum", "parallax", "tour cards"],
  height: 650,
  collection: "carousel-slider",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Both rails jump together to the chosen tour, and a drag follows the pointer with no coast afterwards.",
  perf: "Two transforms per frame from one shared position, written only while dragging or settling.",
  intro: "A walking tour company's photo cards on one rail and the city names in large italic type on a second rail beneath. Both are tied to one position, so dragging either moves the pair, with the names travelling at a slower pace than the photos and still arriving in step on each card. Suits a travel, events or venue list where a second layer of type adds depth.",
  customize: [
    "The speed difference comes from the width ratio of `--w2rai-card` and `--w2rai-name`; make the names narrower for a slower lower rail.",
    "Change `FRICTION` to lengthen or shorten the coast after a flick, and `RUBBER` for the pull at the ends.",
    "Recolour the night navy and amber with `--w2rai-bg` and `--w2rai-acc`.",
  ],
  accessibility: [
    "The city name rail is decorative and hidden from screen readers, tabbing to a card's link brings that card into place, and a dragged card never opens its link.",
  ],
  useWhen: [
    "Tours, events or locations where a big place name under each photo helps people scan.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
