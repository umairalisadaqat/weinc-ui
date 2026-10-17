const meta = {
  "slug": "letters-rising-with-blur-to-sharp-text-animation",
  "category": "text-effects",
  "name": "Letters Rising with Blur to Sharp",
  "keyword": "css text animation",
  "title": "Rising Blur Letter Text Animation in CSS | We.Inc",
  "description": "Free CSS text animation where each letter rises from below and settles from a soft blur into sharp type. React and plain HTML versions, ready to paste.",
  "intro": "A headline animation for a warm, editorial hero: every letter lifts a little from below its baseline while it comes out of a soft blur, so the line seems to come into focus rather than slide in. Letters follow each other a few milliseconds apart, the sentence holds for several seconds, then drifts away and returns. Words stay whole, so the line wraps naturally on a phone.",
  "useWhen": [
    "A bakery, cafe or studio homepage where the first line should feel calm and considered instead of punchy.",
    "A launch or announcement page with a single short sentence that deserves a slow entrance.",
    "A section break in a long scrolling story, where a headline should gently come into focus as the reader arrives."
  ],
  "customize": [
    "Change the colours through `--rb-bg`, `--rb-ink` and `--rb-accent` on `.rb-root`; the thin rule before the business name uses the accent.",
    "Set the length of one full cycle with `--rb-speed` (7.5s by default). The rise takes the first 12 percent of it and the hold runs to 86 percent.",
    "Tighten or loosen the ripple across the line by editing the `28ms` in `animation-delay: calc(var(--i) * 28ms)` on `.rb-l`.",
    "For a one-time entrance instead of a loop, change `infinite` to `1` and the keyframe at `86%` to `100%`, then delete the fading step at the end."
  ],
  "accessibility": [
    "The full sentence sits once in a visually hidden `.rb-sr` span, and the letter spans are marked `aria-hidden`, so a screen reader reads a normal sentence instead of single letters.",
    "With reduced motion turned on, every animation is switched off and the letters simply sit in place, fully sharp.",
    "The animation moves letters with transforms only, so the headline never changes size and nothing below it jumps."
  ],
  "faqs": [
    {
      "question": "How does the blur to sharp effect work?",
      "answer": "Each letter is its own inline-block span with a keyframe that starts at `filter: blur(14px)`, zero opacity and a small downward offset, then ends at no blur and its normal position. A per-letter delay built from the `--i` index makes them land one after another."
    },
    {
      "question": "Will animating a blur filter slow the page down?",
      "answer": "Blur is heavier than a plain transform because the browser repaints the blurred letter on each frame while it changes. Here it only runs during the short rise and fall of one headline, which current phones handle well. Avoid running it on a long paragraph."
    },
    {
      "question": "Why are the letters wrapped inside word spans?",
      "answer": "If every letter were an inline-block on its own, the browser could break a line in the middle of a word. Grouping each word in a span with `white-space: nowrap` keeps words whole while still letting the line wrap between them."
    },
    {
      "question": "Do I need JavaScript to split the letters?",
      "answer": "The plain HTML version uses a short script to split the text, so you can edit the sentence in the markup. You can also write the spans by hand, each with `style=\"--i:0\"`, `--i:1` and so on, and drop the script entirely."
    },
    {
      "question": "Can it start only when the headline scrolls into view?",
      "answer": "Yes. Start the root with `data-paused=\"true\"` so the letters wait, and let the IntersectionObserver in the script flip it to false when the section appears. It already pauses the loop whenever the section leaves the screen."
    }
  ],
  "related": [
    "css-text-effects-and-hover-animations-collection-with-copyable-css-for-every-effect",
    "layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters"
  ],
  "tags": [
    "css text animation",
    "blur text animation",
    "letter by letter animation",
    "headline animation"
  ],
  "height": 520,
  "collection": "css-text-animation",
  "standalone": true,
  "tech": "css",
  "reducedMotion": "The headline sits still and fully sharp, with every letter in its final place.",
  "perf": "Animates transform, opacity and a blur filter on about 25 letter spans; the blur repaints briefly while letters arrive and leave."
};

export default meta;
