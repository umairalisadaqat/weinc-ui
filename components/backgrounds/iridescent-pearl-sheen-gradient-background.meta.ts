const meta = {
  slug: "iridescent-pearl-sheen-gradient-background",
  category: "backgrounds",
  name: "Iridescent Pearl Sheen",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "Pale lilac, mint, peach and ice blue bands sweep across an off-white surface like light turning on nacre. Two repeating conic gradients rotate around corners outside the frame using an animated angle property, one laid thinly over the other, and soft white lustre spots glide on top. Made for jewellery, skincare, bridal and other quiet luxury pages that want colour you only notice on a second look.",
  useWhen: [
    "A light, refined page needs movement that never competes with a serif headline or product photo.",
    "You want iridescence that stays pastel and believable instead of the usual saturated holographic foil.",
  ],
  customize: [
    "Retint the shell by editing the stops in `.prl-n1`; anything darker than a light pastel starts to look like a rainbow.",
    "Set `--prl-speed` to `90s` so the bands crawl, or `30s` for a sheen that visibly turns.",
    "Change the band width with the `36deg` repeat in `.prl-n1`: a larger repeat gives fewer, wider bands of colour.",
  ],
  accessibility: [
    "Dark plum text on the near-white surface keeps strong contrast at every angle of the sheen, and the outlined button fills on hover and shows a focus ring.",
    "The decorative layers are `aria-hidden` and let clicks pass through.",
  ],
  faqs: [],
  related: [],
  tags: ["iridescent", "pearl", "conic gradient", "css @property", "luxury"],
  height: 600,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The nacre bands rest at one angle with the lustre spots in place, a still pearly surface.",
  perf: "Two full-size conic gradients repaint as their angle turns, plus two transformed highlights; modest paint cost, no script loop.",
};

export default meta;
