const meta = {
  slug: "percentage-counter-with-progress-ring-filling-in-step",
  category: "text-effects",
  name: "Percentage Counter With Progress Ring",
  keyword: "number counter animation",
  title: "",
  description: "",
  intro:
    "A large ring for a garden care firm's on-time rate, flanked by two smaller ones, all on deep forest green. The arc, the fifty tick marks around it and the percentage in the middle are drawn from one value on each frame, so the number never runs ahead of the fill. Good for service promises and survey results.",
  useWhen: [
    "A percentage is the headline and you want the eye to see how much of the whole it covers, not just read the figure.",
  ],
  customize: [
    "Change the figures and captions in the `rings` array; the first entry becomes the big ring.",
    "Recolour the fill through the two stops of the `pcr-grad` gradient, and the track through its `rgba(233,240,220,.12)` stroke.",
    "Set `TICKS` to 0 for a plain ring, or raise it for a finer dial.",
  ],
  accessibility: [
    "The rings are decorative SVG marked aria-hidden; each percentage and its caption stay as text, with the final value in a hidden span so it is read once.",
  ],
  faqs: [],
  related: [],
  tags: ["percentage counter", "progress ring", "circular progress", "stat ring animation"],
  height: 440,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "All three rings appear full to their final values with the numbers already in place.",
  perf: "Updates a stroke offset, a few dozen tick colours and three text nodes per frame for under two seconds.",
};

export default meta;
