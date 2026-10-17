const meta = {
  slug: "booking-steps-push-up-with-a-filling-progress-bar",
  category: "navigation",
  name: "Booking Steps Push Up With a Filling Progress Bar",
  keyword: "multi step form transition",
  title: "",
  description: "",
  intro: "A three-step room booking for a seaside guesthouse in sand tones. Continuing pushes the finished step up and out while the next one rises from below, and the thin bar in the header fills a third at a time; going back pushes the other way. The summary step reads the dates and room you picked.",
  useWhen: [
    "A short booking, sign-up or checkout split into steps, where people need to feel progress and be able to step back.",
  ],
  customize: [
    "Change the `32%` in the four `w6stp` push keyframes to make steps travel further or less.",
    "Recolour the bar, chosen options and main buttons with `--w6stp-rust` on `.w6stp`.",
    "Edit the dates and rooms in the radio lists; `data-n` (nights) times `data-p` (price) gives the total.",
  ],
  accessibility: [
    "Options are real radio inputs in fieldsets with legends, the step count is announced politely, and focus moves to each new step heading.",
    "With reduced motion steps swap at once and the bar jumps instead of filling.",
  ],
  faqs: [],
  related: [],
  tags: ["multi step form", "view transitions", "progress bar", "booking flow"],
  height: 620,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "Each step replaces the last in one go and the progress bar moves without easing.",
  perf: "The form area is captured twice and pushed by transform for half a second, and the bar fills with one scale transition.",
};

export default meta;
