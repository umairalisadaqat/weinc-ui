const meta = {
  slug: "weighted-letter-drop-headline-animation",
  category: "text-effects",
  name: "Weighted Letter Drop Headline",
  keyword: "letter by letter text animation",
  title: "",
  description: "",
  intro: "Each letter of a bold serif headline falls into place with a short squash on landing and a tiny rebound, one after another from the left, like type being set by hand. Words never break mid-line because letters are grouped per word. A good fit for bakeries, food brands and friendly shop fronts.",
  useWhen: ["A short, warm headline of two to five words that can carry playful motion."],
  customize: ["Set `--wld-stagger` to change the gap between letters; 30ms feels brisk, 70ms feels deliberate.", "Soften or exaggerate the landing with the `scale(1.06, .9)` value in the 6% keyframe.", "Recolour with `--wld-forest` and `--wld-cream`."],
  accessibility: ["Letters are aria-hidden and a visually hidden span gives screen readers the full headline in one piece."],
  faqs: [],
  related: [],
  tags: ["letter drop animation", "bouncing text css", "staggered letters", "headline animation css"],
  height: 560,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "Letters are shown resting in place with no fall, squash or fade.",
  perf: "Transform and opacity on about twenty letter spans; compositor only, paused off screen.",
};

export default meta;
