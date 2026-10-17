const meta = {
  slug: "dawn-sky-gradient-slowly-brightening-background",
  category: "backgrounds",
  name: "Dawn Sky Gradient That Slowly Brightens",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "A harbour sky moves from blue hour to early sunrise and back over half a minute. The gradient stops are registered CSS colour properties, so the browser blends them smoothly instead of jumping, while a low sun lifts behind the horizon and lays a striped glint on the water. Fits early morning brands, rowing or running clubs, cafes and anything sold on a fresh start.",
  useWhen: [
    "The story of the page is morning, a beginning or a slow change, and you want the light itself to say it.",
    "You need a gradient that animates its actual colours, not a fixed gradient sliding around.",
  ],
  customize: [
    "Edit the two colour sets inside `@keyframes dwn-rise`: the `0%` set is the darkest sky and `100%` the brightest.",
    "Set `--dwn-speed` on `.dwn-hero` to `60s` for a sunrise people only notice when they look twice.",
    "Move the sun sideways by changing `left: 62%` on both `.dwn-sun` and `.dwn-shine` together so the glint stays under it.",
  ],
  accessibility: [
    "White text sits in the upper sky, which stays dark enough in its brightest state to keep contrast above 4.5 to 1, helped by a faint text shadow.",
    "The whole scene is in one `aria-hidden` layer that ignores clicks.",
  ],
  faqs: [],
  related: [],
  tags: ["gradient", "sunrise", "css @property", "sky", "hero background"],
  height: 660,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The sky holds a still early-sunrise mix of blue, mauve and peach with the sun resting on the horizon.",
  perf: "Animating registered colour properties repaints one full-size gradient each frame, which is light work but not compositor-only.",
};

export default meta;
