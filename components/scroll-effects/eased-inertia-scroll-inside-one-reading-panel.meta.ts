const meta = {
  slug: "eased-inertia-scroll-inside-one-reading-panel",
  category: "scroll-effects",
  name: "Eased Inertia Scroll Inside One Reading Panel",
  keyword: "smooth scroll container",
  title: "",
  description: "",
  intro: "A tea merchant's tasting list in a dark panel where mouse wheel input glides to a stop instead of jumping. Only this panel is eased; the page around it keeps native scrolling, and wheel input passes on to the page at either end of the list. A thin amber bar shows how far through the notes you are, and a toggle lets visitors switch the easing off.",
  useWhen: [
    "One long list or reading area deserves a softer feel without taking over scrolling for the whole site.",
    "You want the eased feel some scroll libraries give, in a few lines, with an off switch.",
  ],
  customize: [
    "Lower `EASE` from 0.12 to 0.07 for a longer glide, or raise it toward 0.25 for a quick settle.",
    "Change the panel height with `--w6inr-panel-h` (or `h-[440px]` in React).",
    "Recolour the bar and numbers with `--w6inr-accent`.",
  ],
  accessibility: [
    "Arrow keys, Page Down, the scrollbar and touch all use native scrolling; easing only touches wheel input from a fine pointer and is off for reduced motion, where the toggle says so.",
    "The toggle is a real button with `aria-pressed`, and the panel is a labelled, focusable region.",
  ],
  faqs: [],
  related: [],
  tags: ["smooth scroll", "inertia scroll", "eased scrolling", "scroll container"],
  height: 600,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The panel scrolls natively and the toggle reports native scrolling, so wheel input moves the list straight away.",
  perf: "A frame loop runs only while a glide is settling and stops the moment it reaches its target or the panel leaves the screen.",
};

export default meta;
