export default {
  slug: "flick-away-stacked-card-deck-slider-with-momentum",
  category: "galleries",
  name: "Flick Away Stacked Card Deck Slider",
  keyword: "swipe card stack slider",
  tags: ["card stack", "swipe cards", "drag slider", "momentum", "product cards"],
  height: 620,
  collection: "carousel-slider",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Cards swap order instantly on a flick, button or arrow key, with no throw and no spring.",
  perf: "Only the top two cards are written each frame while dragging or flying, and the loop ends as soon as the deck settles.",
  intro: "A plant shop's weekly picks stacked like a hand of cards. Grab the top card and it tilts with your drag; let go fast or far enough and it keeps flying at the speed you threw it while the card underneath rises into place, then it tucks in at the back of the deck. A short drag springs back. The deck loops, so it suits a small rotating selection.",
  customize: [
    "Change `THROW` for how far a drag must go before the card leaves, and `FLICK` for the release speed that throws it regardless of distance.",
    "Set the card size with `--w2dek-w` and the `.w2dek-card` height, and the stacking gap with the `16` in `pos()`.",
    "Recolour sand, ink and olive with `--w2dek-bg`, `--w2dek-ink` and `--w2dek-acc`.",
  ],
  accessibility: [
    "Cards below the top one are inert, so Tab only reaches the visible card's link, and a drag that moved more than a few pixels never opens it.",
  ],
  useWhen: [
    "A shop, menu or reading list wants to show a handful of picks one at a time on a phone-sized card.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
