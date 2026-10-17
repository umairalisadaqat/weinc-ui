const meta = {
  slug: "two-ink-liquid-marble-background-swirling-slowly-on-bone-paper",
  category: "backgrounds",
  name: "Two Ink Liquid Marble",
  keyword: "animated marble background",
  title: "",
  description: "",
  intro: "Winding bands of deep indigo and burnt sienna ink run through bone-coloured paper like the cut edge of a marbled block, each edged with a faint darker vein. The bands drift so slowly the page reads as a printed endpaper that happens to be alive. It fits stationers, bookbinders, galleries and anyone selling something made by hand.",
  useWhen: [
    "A craft or stationery shop wants a warm, papery hero rather than a dark tech look.",
    "A gallery or studio needs texture that frames a centred card of text without fighting it."
  ],
  customize: [
    "Swap `SETTINGS.inkB` for `[64, 110, 92]` to trade the sienna ink for a bottle green.",
    "Lower `SETTINGS.speed` to `0.5` if the marble should look almost still.",
    "Raise `SETTINGS.cell` to 7 on pages with several of these, which roughly halves the work per frame."
  ],
  accessibility: [
    "The copy sits on a solid paper-coloured card, so contrast never depends on which ink is passing underneath."
  ],
  faqs: [],
  related: [],
  tags: [
    "marble",
    "ink",
    "canvas",
    "paper",
    "light"
  ],
  height: 620,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "One fixed pattern of marbled ink is painted once and left in place.",
  perf: "A small grid of colour samples, about one per five pixels, worked out on the main thread at 30 frames a second and scaled up."
};

export default meta;
