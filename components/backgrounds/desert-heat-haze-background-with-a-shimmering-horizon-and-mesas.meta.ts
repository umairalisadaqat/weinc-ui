const meta = {
  slug: "desert-heat-haze-background-with-a-shimmering-horizon-and-mesas",
  category: "backgrounds",
  name: "Desert Heat Haze Horizon",
  keyword: "heat haze animation",
  title: "",
  description: "",
  intro: "A low sun sits over a line of mesas while the air above the sand wobbles the horizon in thin bands, the way a road shimmers in August. The sky stays calm and pale behind the headline, so dark text reads cleanly. Good for travel, outdoor gear, ceramics and anything sold on the feeling of heat and distance.",
  useWhen: [
    "A tour operator or outdoor brand wants a landscape hero without loading a photograph or video.",
    "A warm, sandy palette has to carry a dark headline at the top of the page."
  ],
  customize: [
    "Turn `SETTINGS.shimmer` up to 8 for a stronger mirage, or down to 2 for a faint ripple.",
    "Move the land up or down with `SETTINGS.horizon`; 0.6 leaves less sky and a taller desert.",
    "Change `SETTINGS.skyLow` to a rose such as `#f2b0a0` to push the scene toward evening."
  ],
  accessibility: [
    "The canvas is hidden from screen readers, and the headline sits on the palest part of the sky where its contrast is highest."
  ],
  faqs: [],
  related: [],
  tags: [
    "desert",
    "heat haze",
    "landscape",
    "canvas",
    "warm"
  ],
  height: 660,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "The landscape is shown once with a perfectly steady horizon and no shimmer.",
  perf: "The landscape is painted once; each frame copies it back in about 45 thin strips with small sideways offsets."
};

export default meta;
