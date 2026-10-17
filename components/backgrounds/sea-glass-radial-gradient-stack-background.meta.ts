const meta = {
  slug: "sea-glass-radial-gradient-stack-background",
  category: "backgrounds",
  name: "Sea Glass Radial Gradient Stack",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "Frosted green, blue and moss pools drift over a pale shore colour, all painted by one element that stacks four radial gradients. The centre of each pool is a registered percentage property, so the pools glide to new spots instead of the whole layer sliding. A slow white sheen crosses the surface and a soft-light grain gives it the dull frost of tumbled glass. Fits ceramics, coastal shops, spas and fresh, light brands.",
  useWhen: [
    "You want a light, clean hero with colour that moves inside the gradient rather than shapes that slide.",
    "A single background declaration is easier for your team to maintain than a pile of blurred divs.",
  ],
  customize: [
    "Change the rgba colours in `.sgl-glass` to retint the pools; keeping them mid-light preserves the frosted look.",
    "Edit the three keyframe stops in `@keyframes sgl-wander` to send the pools to different corners.",
    "Lower `.sgl-frost` opacity to `.2` for smooth, polished glass rather than sanded glass.",
  ],
  accessibility: [
    "Deep green text on pale pools keeps contrast high wherever the pools wander, and the button has a visible focus outline.",
  ],
  faqs: [],
  related: [],
  tags: ["radial gradient", "sea glass", "css @property", "light", "pastel"],
  height: 580,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The pools hold their starting positions and the sheen stays put, a calm frosted surface.",
  perf: "One stacked gradient repaints as its pool positions animate, plus one transformed sheen; light paint work, no script per frame.",
};

export default meta;
