export default {
  slug: "classic-css-typewriter-line-with-steps-and-blinking-caret",
  category: "text-effects",
  name: "Classic CSS Typewriter Line",
  keyword: "typing animation css",
  title: "CSS Typing Animation: Typewriter Line with Caret | We.Inc",
  description: "Free CSS typing animation: one line typed with steps() and ch widths, a blinking block caret, an erase and retype loop, and a still line for reduced motion.",
  intro: "A single line of monospace type that writes itself out, holds, erases and starts again, driven only by a width animation in ch units and the steps() timing function. A block caret blinks at the end of the line. The box is sized to the finished sentence, so the button and copy below never move, and the font scales with its container so the line fits a 360 pixel phone.",
  useWhen: [
    "A bakery, café or shop hero needs one short line with a bit of life, and you would rather not ship a script for it.",
    "Your sentence is fixed and short enough to sit on one line at phone width, roughly forty characters or fewer.",
    "You already use a monospace face somewhere on the page, so the typed line feels at home rather than borrowed.",
  ],
  customize: [
    "Change the sentence in both places (the visible line and the hidden copy), then set --ctw-n and both steps(35) values to its new character count, spaces and punctuation included.",
    "Retime the loop with --ctw-cycle. The 42% stop is where typing ends and the 86% stop is where erasing starts, so move those to give the finished line a longer or shorter hold.",
    "Recolour with --ctw-ink for the letters and --ctw-caret for the block; swap the block for a thin bar by setting the caret width to 2px.",
    "If the line is longer, lower the 4.3cqi part of the font-size so the whole sentence still fits the narrowest container you support.",
  ],
  accessibility: [
    "Screen readers hear the sentence once from a visually hidden copy inside the heading; the animated line and its caret carry aria-hidden so nothing is spelled out letter by letter.",
    "With reduced motion turned on, both animations are removed and the full line sits still with a solid caret, which reads as a finished heading rather than an empty box.",
    "The loop pauses through animation-play-state whenever the section scrolls out of view, so a blinking caret is never running where nobody can see it.",
  ],
  faqs: [
    {
      question: "Why does the width use ch units?",
      answer: "In a monospace font every character is one ch wide, so a width of 35ch shows exactly 35 characters. Paired with steps(35), each step of the animation reveals exactly one whole character instead of sliding through half letters.",
    },
    {
      question: "Can I use this with a normal, proportional font?",
      answer: "Not reliably. Letters like i and m have different widths, so equal steps would cut through glyphs. Use the clip-path version in this collection, which reveals each letter on its own, or a small script that adds characters one at a time.",
    },
    {
      question: "How do I make it type once and stop instead of looping?",
      answer: "Replace the keyframes with a single from width 0 to the full width, give it steps matching the character count, and set animation-iteration-count to 1 with animation-fill-mode forwards. Keep the caret blinking so the line still feels finished.",
    },
    {
      question: "Why does the line start halfway through on page load?",
      answer: "The negative animation-delay starts the loop part of the way in, so a visitor sees words straight away instead of an empty heading. Set the delay to 0s if you want every visit to begin from the first letter.",
    },
    {
      question: "Will the text wrap on small screens?",
      answer: "No, the line is set to nowrap so the steps stay accurate. Instead, the font size follows the container width through cqi units, shrinking the type until all 35 characters fit inside the padding.",
    },
  ],
  related: [
    "css-text-effects-and-hover-animations-collection-with-copyable-css-for-every-effect",
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
  ],
  tags: ["typing animation css", "typewriter effect", "css steps animation", "blinking caret", "monospace"],
  height: 470,
  collection: "typing-animation-css",
  standalone: true,
  tech: "css",
  reducedMotion: "The whole sentence is shown at once with a solid caret and no blinking.",
  perf: "Two CSS animations on one line of text, a width change and an opacity blink; no JavaScript runs except an optional off-screen pause.",
} satisfies UiMeta;
