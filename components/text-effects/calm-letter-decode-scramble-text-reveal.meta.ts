const meta = {
  slug: "calm-letter-decode-scramble-text-reveal",
  category: "text-effects",
  name: "Calm Letter Decode Scramble",
  keyword: "text scramble effect",
  title: "Text Scramble Effect: Calm Left to Right Decode | We.Inc",
  description: "Free text scramble effect in React and plain JavaScript: soft placeholder marks settle into a headline left to right, with no layout jump and a screen reader copy.",
  intro: "A headline that arrives as a row of soft marks (dots, dashes, tildes) and settles into real letters one by one from the left, finishing with a slow amber caret. The monospace face keeps every slot the same width, and a hidden copy of the finished line holds the box size, so nothing below it moves while the letters resolve. It suits archive, data and research sites where a decoding feel fits the subject.",
  useWhen: [
    "A product name or hero line should feel like it is being read off a record or a terminal, without the noise of random capitals and symbols.",
    "You want a single moment of motion on load that is over in about a second and a half, then leaves a still, readable headline.",
    "The page already has a calm, dark palette and you need an entrance that matches it instead of a bouncy one.",
  ],
  customize: [
    "Change `HEADLINE` in the React file, or the text of the `.lds-sr` span in the plain version; the animated letters are built from that one string.",
    "Edit `CALM` to change the placeholder marks. Keep them narrow and quiet; letters or heavy symbols make the effect busy again.",
    "Slow or speed the sweep with `STEP_MS` (gap between letters) and `FLICKER_MS` (how often an unsettled slot changes). `HOLD_MS` sets how long the finished line rests before it decodes again.",
    "Recolour through `--lds-bg`, `--lds-ink`, `--lds-calm` and `--lds-accent` at the top of the style block.",
  ],
  accessibility: [
    "Screen readers hear the sentence once from a visually hidden span; the changing letters and the caret are marked aria-hidden, so the scramble never gets read out as noise.",
    "With reduced motion the line renders already decoded, the caret stops blinking and the timer never starts.",
    "The Replay control is a real button with a visible focus ring, and the loop stops whenever the section scrolls off screen.",
  ],
  faqs: [
    {
      question: "How does a text scramble effect work?",
      answer: "Each letter slot shows a random placeholder until its turn comes, then shows the real letter. A timer redraws the unsettled slots every 70 milliseconds, and a slot settles once the elapsed time passes its index multiplied by a fixed step.",
    },
    {
      question: "Why does my scramble make the text jump around?",
      answer: "Placeholder characters are usually a different width from the letters they stand in for, and some, like hyphens, let the line break early. A monospace font fixes the widths, grouping each word in a no-wrap span stops early breaks, and a hidden copy of the final text holds the height.",
    },
    {
      question: "Can I run it only once instead of on a loop?",
      answer: "Yes. In the plain version, clear the interval when the elapsed time passes the end of the sweep instead of resetting `start`. In React, stop the interval the same way and keep the Replay button for anyone who wants to see it again.",
    },
    {
      question: "Does it work with a proportional font?",
      answer: "It works, but slots will change width as characters swap, so the line shimmers sideways. If you want a proportional face, give each letter span a fixed `inline-block` width measured from the final letter, or keep the effect on a short label.",
    },
    {
      question: "Is it expensive to run?",
      answer: "No. It updates the text of about thirty small spans fourteen times a second while decoding, and the timer pauses when the section is off screen or motion is reduced.",
    },
  ],
  related: [
    "css-text-effects-and-hover-animations-collection-with-copyable-css-for-every-effect",
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
  ],
  tags: ["text scramble effect", "decode text animation", "text reveal animation", "javascript text scramble", "react text effect"],
  height: 560,
  section: true,
  interactive: true,
  collection: "text-reveal-animation",
  standalone: true,
  tech: "css",
  reducedMotion: "The headline appears fully decoded with a steady caret and no timer running.",
  perf: "A 70 ms timer rewrites a few dozen small spans; no canvas or layout work, and it stops off screen.",
};

export default meta;
