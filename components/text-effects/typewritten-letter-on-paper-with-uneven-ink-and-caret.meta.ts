export default {
  slug: "typewritten-letter-on-paper-with-uneven-ink-and-caret",
  category: "text-effects",
  name: "Typewritten Letter on Paper",
  keyword: "typewriter text animation",
  title: "",
  description: "",
  intro: "A note from an upholsterer typed onto a cream sheet resting on a slate desk. Each character is struck with slightly different ink, a touch lighter or heavier and a fraction off the baseline, under a soft bleed. A low underscore caret sits where the next key lands, and every line break pauses like a carriage return. The finished letter rests, fades and is typed again.",
  useWhen: [
    'A personal message, an about page or a thank-you screen should feel written for one person.',
    'You want the look of a typewriter without a bitmap font or an image of paper.',
  ],
  customize: [
    'Replace LETTER; each line break escape starts a new line, and two in a row leave a blank line.',
    'Tune the ink range in ink(): 0.72 is the faintest strike and 0.9 is the most a character drifts off the line, in pixels.',
    'Raise the 430ms newline pause in gapAfter() for a slower, more deliberate return.',
  ],
  accessibility: [
    'The whole letter is one hidden paragraph for screen readers; the struck characters and caret are aria-hidden, and the loop waits whenever the sheet is out of view.',
  ],
  faqs: [],
  related: [],
  tags: [
    'typewriter effect',
    'letter',
    'paper texture',
    'typing animation',
  ],
  height: 620,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "The full letter is printed at once with its uneven ink and a still caret.",
  perf: "Adds one small span per character on a timer, a few hundred at most, and stops while the letter is off screen.",
} satisfies UiMeta;
