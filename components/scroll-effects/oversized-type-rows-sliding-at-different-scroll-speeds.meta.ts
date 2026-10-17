const meta = {
  slug: "oversized-type-rows-sliding-at-different-scroll-speeds",
  category: "scroll-effects",
  name: "Oversized Type Rows Sliding at Different Scroll Speeds",
  keyword: "scroll text parallax",
  title: "",
  description: "",
  intro: "Three uppercase lines for a coffee roaster, each wider than the screen, drift sideways at their own pace and in alternating directions as you scroll. One line is cream, one a muted stone grey, one copper, so the difference in speed reads as layers of depth. The words sit offset at rest, which already looks composed before anyone scrolls.",
  useWhen: [
    "A brand with a short, confident motto wants the type itself to be the hero image.",
    "A dark, graphic page needs a moment of motion that costs almost nothing to render.",
  ],
  customize: [
    "Set each line's pace and direction with `data-speed` (or `speed` in `ROWS`); keep the fastest under about 0.6 so words stay readable.",
    "Use `data-offset` to choose where each line rests before scrolling.",
    "Retint the quiet middle line with the colour on `.w6typ-outline`; keep it darker than the others so it reads as further back.",
  ],
  accessibility: [
    "The moving lines are hidden from assistive technology and one visually hidden heading reads the motto once; reduced motion leaves the lines at their resting offsets.",
  ],
  faqs: [],
  related: [],
  tags: ["kinetic type", "scroll parallax", "big typography", "marquee"],
  height: 600,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The three lines rest at their staggered starting positions and do not slide.",
  perf: "Three transforms per scroll frame from a passive listener, paused when the section is off screen.",
};

export default meta;
