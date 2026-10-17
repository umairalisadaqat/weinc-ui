export default {
  slug: "clip-path-typewriter-for-proportional-serif-headlines",
  category: "text-effects",
  name: "Clip-Path Typewriter for Serif Headlines",
  keyword: "typewriter effect css",
  title: "",
  description: "",
  intro: "A two-line serif headline for a florist that types itself in with no script. Each letter is unmasked by its own clip-path on a staggered delay, which keeps the real kerning of a proportional font, and a thin rose caret hops from letter to letter before blinking at the full stop. A Replay button restarts it.",
  useWhen: [
    "Your headline is set in a serif or any proportional face and wraps onto two lines, where a ch-width typewriter cannot work.",
    "You want the reveal to play once on arrival and then stay put as a normal heading.",
  ],
  customize: [
    "Change --cpt-step to speed up or slow down the letters; 45ms reads as brisk, 80ms as deliberate.",
    "Each letter carries style --i with its position; when you change the words, renumber them in order and give the cpt-last class to the final character.",
    "Swap the dawn gradient on .cpt-root and the --cpt-ink colour together so the headline keeps strong contrast.",
  ],
  accessibility: [
    "The heading holds a visually hidden copy of the sentence, and the letter spans are aria-hidden, so it is announced as one sentence.",
  ],
  faqs: [],
  related: [],
  tags: ["typewriter effect", "clip-path animation", "serif headline", "css stagger"],
  height: 540,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "The headline is fully visible from the start and the caret stays hidden.",
  perf: "About thirty tiny clip-path animations that each run once for 90ms, then only one blinking caret; no JavaScript is needed.",
} satisfies UiMeta;
