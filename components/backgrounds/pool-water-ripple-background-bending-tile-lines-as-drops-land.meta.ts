const meta = {
  slug: "pool-water-ripple-background-bending-tile-lines-as-drops-land",
  category: "backgrounds",
  name: "Pool Water Ripples",
  keyword: "water ripple background",
  title: "",
  description: "",
  intro: "Drops land on a shallow pool and send rings outward that bend the white grout lines of the tiles below, with light catching the near side of every wave. Tap or move the pointer to add your own drops. It suits swimming schools, spas, lidos and summer campaigns that want a bright, cool hero.",
  useWhen: [
    "A pool, spa or water brand wants something guests can play with for a moment.",
    "A light page needs gentle, interactive motion that stays calm when nobody touches it."
  ],
  customize: [
    "Set `SETTINGS.drops` to 0 so rings appear only where visitors tap.",
    "Change `SETTINGS.tile` to 30 for small mosaic tiles or 70 for large slabs.",
    "Raise `SETTINGS.calm` to 0.992 for rings that spread further before fading."
  ],
  accessibility: [
    "The pointer only adds ripples; every action is in the normal link, and the copy sits on a solid white card."
  ],
  faqs: [],
  related: [],
  tags: [
    "water",
    "ripple",
    "pool",
    "canvas",
    "interactive"
  ],
  height: 620,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "A few rings are frozen on the water, already bending the tile lines.",
  perf: "A wave grid with one cell per eight pixels updated twice a frame, then tile lines and a scaled shading layer on canvas 2D."
};

export default meta;
