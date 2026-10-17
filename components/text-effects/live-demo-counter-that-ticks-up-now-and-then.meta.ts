const meta = {
  slug: "live-demo-counter-that-ticks-up-now-and-then",
  category: "text-effects",
  name: "Live Demo Counter That Ticks Up",
  keyword: "animated number counter javascript",
  title: "",
  description: "",
  intro:
    "A small dashboard card for a refill shop that keeps a running tally of jars filled today. A timer stands in for real events: every few seconds it adds one to three, only the digits that changed roll up into place, and a faint +2 chip rises and fades beside the figure. The card says plainly that the numbers are a demo.",
  useWhen: [
    "You are showing a running tally such as orders, sign-ups or tickets and want each new arrival to be noticed without a jumpy layout.",
  ],
  customize: [
    "Replace the timer: delete the `queue` call in `bump` and run `bump` (or your own setter) whenever a real event arrives.",
    "Change how often the demo ticks with `MIN_GAP` and `MAX_GAP`, and the opening figure with `START`.",
    "Retint the badge, pulse and chip through `#7fd1c3`, or `--lvc-accent` in the plain version.",
  ],
  accessibility: [
    "The figure is mirrored in a hidden span that is not a live region, so screen readers can read the current tally without being interrupted on every tick.",
  ],
  faqs: [],
  related: [],
  tags: ["live counter", "realtime counter", "ticking number", "dashboard counter"],
  height: 520,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "The card shows the opening figure without counting, and the demo timer never starts.",
  perf: "A timeout every few seconds swaps one or two digit spans; the only loop is a slow opacity pulse on a dot.",
};

export default meta;
