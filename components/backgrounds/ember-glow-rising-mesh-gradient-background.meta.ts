const meta = {
  slug: "ember-glow-rising-mesh-gradient-background",
  category: "backgrounds",
  name: "Ember Glow Rising Mesh",
  keyword: "animated mesh gradient",
  title: "",
  description: "",
  intro: "Seven warm glows lift slowly from a bed of coals below the frame, sway a little, brighten, then cool and vanish near the top while charcoal fills the gaps. Each glow is a colour point in a mesh that adds light rather than averaging it, so where two meet the heat builds. Made for restaurants, bakeries, fireplace makers, whisky and anything that wants a hearth behind centred type.",
  useWhen: [
    "A dark, warm hero needs motion that feels like firelight without a single flame drawn.",
    "You want a mesh gradient whose colour points travel in one direction, here upward, rather than circling.",
  ],
  customize: [
    "Raise `HEAT` from 0.62 toward 0.8 for brighter embers, and check the headline contrast as you go.",
    "Set `RISE` to 32 seconds for a lazier drift, or 14 for a lively fire.",
    "Change the `150 * bed` style numbers in the draw loop to tint the steady coal glow along the bottom edge.",
  ],
  accessibility: [
    "Ember brightness is capped by `HEAT` so the cream headline keeps a high contrast even when a glow passes behind it.",
  ],
  faqs: [],
  related: [],
  tags: ["mesh gradient", "embers", "canvas", "warm", "dark hero"],
  height: 600,
  section: true,
  collection: "animated-gradient-background",
  tech: "canvas",
  reducedMotion: "A single frame of glowing embers over the coal bed is painted and left still.",
  perf: "Seven colour points on a 110 pixel wide canvas, well under a millisecond a frame, with the loop stopped off screen.",
};

export default meta;
