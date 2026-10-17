const meta = {
  slug: "sunset-haze-over-warm-paper-gradient-background",
  category: "backgrounds",
  name: "Sunset Haze Over Warm Paper",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "Low orange, rose and ochre haze drifts along the bottom of a cream sheet while a pale sun sinks and rises behind it. A fibrous paper texture and a multiplied grain sit over the colour, so it reads like ink soaked into cotton stock rather than a screen glow. A good match for print studios, wedding stationers, bakeries and any brand with a handmade, warm voice.",
  useWhen: [
    "You want a light, editorial hero with dark serif type and a little warmth moving underneath.",
    "Your brand lives on paper, and a glossy digital gradient would feel out of character.",
  ],
  customize: [
    "Change `--shp-paper` to a cooler `#eef0ea` and the three haze triples to sage and slate for an overcast evening.",
    "Lower the alpha values in `.shp-h1` and `.shp-h2` (0.8 and 0.62) if the colour crowds your button.",
    "Fibre direction comes from `baseFrequency='.03 .12'` in `.shp-paper`; swap the two numbers to run the fibres vertically.",
  ],
  accessibility: [
    "Text is near-black brown on cream, and the warm haze only reaches the lower part of the copy, so contrast stays well above 4.5 to 1.",
  ],
  faqs: [],
  related: [],
  tags: ["paper texture", "sunset", "warm gradient", "grain", "editorial"],
  height: 600,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The haze and sun hold still in a low evening glow across the bottom of the paper.",
  perf: "Five soft layers drift by transform only and the textures are static tiles, so the browser composites rather than repaints.",
};

export default meta;
