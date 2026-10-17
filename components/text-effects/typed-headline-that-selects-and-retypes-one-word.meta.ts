export default {
  slug: "typed-headline-that-selects-and-retypes-one-word",
  category: "text-effects",
  name: "Headline That Retypes One Word",
  keyword: "retyping word animation",
  title: "",
  description: "",
  intro: "A sourdough bakery headline on warm sand where only the last words change. The old ending is highlighted as if selected with a cursor, cleared, and the new one is typed in its place. Now and then the word goes in with a transposed letter, sits for a moment, and is fixed with backspaces, which makes it feel typed by a person.",
  useWhen: [
    'Your headline has one slot that changes, such as a time of day, a place or an audience, and the rest should stay still.',
    'You want a small human touch on a craft or food brand, rather than a perfect machine rhythm.',
  ],
  customize: [
    'Edit WORDS; give an entry a typo string to have it misspelled and corrected, or leave typo empty to type it cleanly.',
    'Change --rwh-select for the highlight behind the word and --rwh-word for the word and caret colour.',
    'Keep one rwh-ghost line per ending in the markup so the reserved height fits the longest version.',
  ],
  accessibility: [
    'A hidden sentence reads all three endings once, and the changing word, highlight and caret are aria-hidden.',
  ],
  faqs: [],
  related: [],
  tags: [
    'text rotate',
    'retype word',
    'headline animation',
    'bakery',
  ],
  height: 560,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "The headline rests on its last ending with a still caret and no highlight.",
  perf: "Edits a single text node and one data attribute on timers; nothing runs while the headline is off screen.",
} satisfies UiMeta;
