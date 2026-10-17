const meta = {
  slug: "scroll-linked-paragraph-words-brighten-as-you-read",
  category: "text-effects",
  name: "Scroll Linked Words Brighten as You Read",
  keyword: "scroll text reveal",
  title: "",
  description: "",
  intro: "A long editorial paragraph inside a scrolling panel where each word starts faded and comes up to full ink as it passes the middle of the panel. Browsers with scroll-driven animations do it in pure CSS; others get an IntersectionObserver that lights words instead. A slow demo scroll runs until the reader touches it.",
  useWhen: ["A manifesto, founder note or chapter opening that you want people to read slowly."],
  customize: ["Change `animation-range: cover 18% cover 48%` to move the reading line higher or lower in the panel.", "Set `--swb-dim` (or the `.2` opacity in React) to choose how faint unread words look.", "Lower `AUTO_PX_PER_SEC` to slow the demo scroll, or set it to 0 to switch the demo off."],
  accessibility: ["The passage stays one plain paragraph; the word spans add no roles, so it reads as normal prose.", "The scrolling panel is focusable with a label, and reduced motion shows every word at full strength with no demo scroll."],
  faqs: [],
  related: [],
  tags: ["scroll text reveal", "scroll driven animation", "animation-timeline view", "reading progress text"],
  height: 520,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "Every word shows at full strength and the demo scroll never starts.",
  perf: "Opacity on a few dozen spans driven by the scroll timeline; one light frame loop for the demo scroll, paused off screen.",
};

export default meta;
