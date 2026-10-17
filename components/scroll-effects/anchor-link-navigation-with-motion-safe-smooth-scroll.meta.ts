const meta = {
  slug: "anchor-link-navigation-with-motion-safe-smooth-scroll",
  category: "scroll-effects",
  name: "Anchor Link Navigation With Motion Safe Smooth Scroll",
  keyword: "smooth scroll css",
  title: "",
  description: "",
  intro: "A library trust's year-in-review with a sticky row of section links. Clicking a link glides to its section because `scroll-behavior: smooth` is set, but only inside a `prefers-reduced-motion: no-preference` query, so visitors who asked for less motion jump instantly. A short script marks the link for the section in view. The link row scrolls sideways on narrow phones.",
  useWhen: [
    "A long report, guide or policy page needs an in-page menu that eases between sections.",
    "You want smooth anchor jumps with no library and no click handlers.",
  ],
  customize: [
    "Match `scroll-margin-top: 76px` on the sections to the height of your sticky bar so headings never land underneath it.",
    "Move `scroll-behavior` from `.w6anc` to `html` when the menu drives the whole page.",
    "Change `OFFSET` to decide how far down a section must reach before its link turns active.",
  ],
  accessibility: [
    "Links are real anchors, so they work without the script, and each target section takes focus via `tabindex=\"-1\"` so the next Tab continues from there.",
    "The current link carries `aria-current=\"location\"`, and reduced motion keeps instant jumps.",
  ],
  faqs: [],
  related: [],
  tags: ["smooth scroll", "anchor links", "scroll-behavior", "sticky nav", "table of contents"],
  height: 600,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "css",
  support: "All current browsers",
  reducedMotion: "Links jump straight to their section with no easing, and the active link still updates.",
  perf: "The glide is native browser scrolling; the script only reads section positions once per scroll frame.",
};

export default meta;
