export default {
  slug: "search-box-placeholder-that-types-product-suggestions",
  category: "text-effects",
  name: "Search Box with Typing Placeholder",
  keyword: "animated placeholder typing",
  title: "",
  description: "",
  intro: "A hardware shop search field on a sea glass gradient whose placeholder types out example searches, clears them and tries the next. It stops the moment someone clicks into the field or starts typing, swapping in a plain hint, and picks up again after they leave it empty. The input is a real labelled search field, so it works with no script at all.",
  useWhen: [
    'Visitors land on a big catalogue and need a nudge about what kinds of things they can search for.',
    'You want to show the range of a shop without adding a row of category chips under the field.',
  ],
  customize: [
    'Edit SUGGESTIONS for your own products; short phrases of two to five words read best inside a placeholder.',
    'Change STATIC_HINT, which is what visitors see while the field has focus and what reduced motion shows.',
    'Keep --sph-hint dark enough for 4.5:1 contrast on white, since the suggestions are real placeholder text.',
  ],
  accessibility: [
    'The field keeps a proper label for screen readers, and on focus the moving placeholder is replaced by one fixed hint so assistive technology never reads a half-typed suggestion.',
  ],
  faqs: [],
  related: [],
  tags: [
    'animated placeholder',
    'search box',
    'typing animation',
    'sea glass',
  ],
  height: 420,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "The field shows one fixed hint, Search hinges, oils, tools and more, and never cycles.",
  perf: "Changes one placeholder attribute on a timer and halts entirely while the field is focused, filled or scrolled away.",
} satisfies UiMeta;
