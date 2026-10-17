const meta = {
  slug: "new-page-slides-up-over-the-old-one",
  category: "navigation",
  name: "New Page Slides Up Over the Old One",
  keyword: "page transition slide up",
  title: "",
  description: "",
  intro: "An architecture practice site in graphite where pages behave like a stack of sheets. A later page slides up from the bottom and covers the current one, which sinks back and darkens; an earlier page is uncovered as the top sheet drops away. It suits portfolio sites with a few large, photo-led pages.",
  useWhen: [
    "A portfolio or studio site with three or four big pages, where a heavier, deliberate change suits the tone.",
  ],
  customize: [
    "Change the `.92` scale and `.25` opacity in `w6stk-sink` and `w6stk-lift` to make the page underneath sink further or stay brighter.",
    "Edit `--w6stk-bg`, `--w6stk-ink` and `--w6stk-stone` on `.w6stk` for another palette.",
    "Lengthen the `.6s` on `::view-transition-new(w6stk-stage)` for a slower slide.",
  ],
  accessibility: [
    "Each change moves focus to the new page heading, and the menu marks the open page with aria-current.",
    "Reduced motion swaps the pages instantly and turns off the stacking keyframes.",
  ],
  faqs: [],
  related: [],
  tags: ["view transitions", "slide up transition", "page stack", "portfolio navigation"],
  height: 620,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "The new page appears straight away in place of the old one, with no sliding or dimming.",
  perf: "Two snapshots of the content area move for about six tenths of a second; nothing runs while a page is open.",
};

export default meta;
