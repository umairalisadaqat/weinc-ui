const meta = {
  slug: "split-columns-slide-in-opposite-directions",
  category: "navigation",
  name: "Split Columns Slide in Opposite Directions",
  keyword: "split screen page transition",
  title: "",
  description: "",
  intro: "A joinery workshop site laid out as a split screen, text on one side and a tall photo on the other. Changing page sends the two halves in opposite directions: the words rise out as the new ones rise in, while the photo slides down and the next one drops in from above. Going back flips both.",
  useWhen: [
    "Service or product pages that share one split layout, where moving the halves separately makes the change feel built rather than faded.",
  ],
  customize: [
    "Change the `48px` in the `w6col-up` and `w6col-down` text keyframes to move the words further.",
    "Use `--w6col-blue` on `.w6col` for the page number, bullets, active menu pill and focus ring.",
    "Add a fourth page by copying a `section.w6col-view` and its menu link with the next `data-go` number.",
  ],
  accessibility: [
    "Each column is a normal part of the page; only the snapshots move, and focus goes to the new heading after the change.",
    "Reduced motion swaps both columns at once with no sliding.",
  ],
  faqs: [],
  related: [],
  tags: ["split screen transition", "view transitions", "two column layout", "service pages"],
  height: 620,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "Text and photo change together in one step, with no movement in either column.",
  perf: "Four snapshots, two per column, move by transform for just over half a second, then the page is static again.",
};

export default meta;
