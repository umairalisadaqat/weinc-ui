const meta = {
  slug: "pointer-spotlight-hidden-text-reveal",
  category: "text-effects",
  name: "Pointer Spotlight Hidden Text",
  keyword: "spotlight text reveal",
  title: "",
  description: "",
  intro: "A paragraph sits almost lost in a dark room until a warm lamp of light moves over it, following the pointer with a soft lag. With no pointer the light wanders on its own path. Touch screens and a Show full text button reveal everything at once, so nothing is locked behind hover.",
  useWhen: ["A teaser or invitation where discovering the words is part of the mood."],
  customize: ["Set `--pst-r` (or `RADIUS` in React) for a wider or tighter pool of light.", "Raise `--pst-shadow` toward a lighter tone if the unlit words should stay half readable.", "Change `EASE` to make the light trail further behind the pointer."],
  accessibility: ["The heading text itself is the real content; the lit copy is aria-hidden.", "The toggle is a real button with aria-pressed that opens the whole text, and touch devices and reduced motion get it opened already."],
  faqs: [],
  related: [],
  tags: ["spotlight hover effect", "mask text reveal", "cursor reveal text", "dark hero text"],
  height: 560,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "The paragraph is fully lit from the start and the wandering light never runs.",
  perf: "One frame loop writing two custom properties to an animated mask; light, and stopped off screen or when opened.",
  interactive: true,
};

export default meta;
