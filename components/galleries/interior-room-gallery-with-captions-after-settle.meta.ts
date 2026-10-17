const meta = {
  slug: "interior-room-gallery-with-captions-after-settle",
  category: "galleries",
  name: "Interior Room Gallery With Captions After Settle",
  keyword: "interior photo gallery",
  title: "",
  description: "",
  intro: "Five rooms of a guest house laid out as rounded photo cards with slim gaps between them. Choosing a room slides the cards aside, and only once they have come to rest does a small caption card fade in with the room name, a line about it and its materials, each line arriving a beat after the last. On phones the cards stack top to bottom.",
  useWhen: [
    "An interior designer, rental or hotel wants calm room photos where text never slides around on top of a moving image.",
    "Each picture carries a short caption that matters, such as finishes, sizes or what is included.",
  ],
  customize: [
    "Change the gap between cards with `--g` and the closed card width with `--c` on `.w5rom-stage`.",
    "Make captions wait longer or shorter by changing the `.8s` slide on `.w5rom-panel`; the caption follows its end, with `SETTLE_BACKSTOP` as the upper limit.",
    "Edit rooms in `ROOMS`, keeping the materials line short enough for one row.",
  ],
  accessibility: [
    "The caption text is always in the page for screen readers, and each card is a named button with aria-expanded, so nothing depends on seeing the fade.",
    "With reduced motion the caption is shown the moment a room opens instead of waiting for a slide.",
  ],
  faqs: [],
  related: [],
  tags: ["interior gallery", "room photos", "expanding cards", "captions", "hospitality"],
  height: 768,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Rooms switch at once and their captions appear immediately, with no slide or staggered fade.",
  perf: "One class change per choice moves the cards with transforms, and a single transitionend listener reveals the caption.",
};

export default meta;
