const meta = {
  slug: "feature-list-staggered-fade-up-on-scroll",
  category: "scroll-effects",
  name: "Feature List Staggered Fade Up",
  keyword: "fade in on scroll",
  title: "",
  description: "",
  intro: "A numbered list of what a bike service includes, where each item rises into place as it scrolls into view. Inside every item the number, title and text arrive one after another, and on wide screens the right column lands a beat after the left, so a two-column grid reads in order instead of popping in by rows.",
  useWhen: ["A services, features or what-is-included list long enough that people scroll through it."],
  customize: [
    "Change `--w1fad-rise` to set how far each item travels before it settles.",
    "Shift the `cover 2%` and `cover 24%` values in the `animation-range` to make items finish earlier or later in the box.",
    "Set `--c` on `.w1fad-r:nth-child(even)` to 0% to drop the column offset.",
  ],
  accessibility: [
    "The list stays a real `ul` with an `h3` per item, and the scrolling box is focusable with a label so arrow keys move it.",
    "With reduced motion every item is simply shown in place and the demo scroll never runs.",
  ],
  faqs: [],
  related: [],
  tags: ["fade in on scroll", "staggered reveal", "animation-timeline view", "feature list"],
  height: 620,
  section: true,
  collection: "scroll-animation",
  tech: "css",
  support: "Chrome, Edge and Safari 26+; script fallback elsewhere",
  reducedMotion: "All eight items are shown in their final place with no movement and no demo scroll.",
  perf: "Opacity and transform on two dozen small elements, driven by the scroll timeline off the main thread where supported.",
};

export default meta;
