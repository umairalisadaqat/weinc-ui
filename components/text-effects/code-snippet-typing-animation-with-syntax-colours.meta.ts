export default {
  slug: "code-snippet-typing-animation-with-syntax-colours",
  category: "text-effects",
  name: "Code Snippet Typing with Syntax Colours",
  keyword: "code typing animation",
  title: "",
  description: "",
  intro: "An editor pane in deep ink blue where a short JavaScript helper writes itself line by line. The snippet is stored as coloured tokens, so a keyword is amber and a string is sage from its first letter, and the caret pauses after brackets and line ends the way a developer does. Line numbers and the full code are laid out up front.",
  useWhen: [
    'A developer docs page or an API landing page needs to show a small example being written.',
    'You want readable, copyable code on the page instead of a recorded video of an editor.',
  ],
  customize: [
    'Rewrite TOKENS as pairs of kind and text; kinds c, k, f, v, s and p map to the cst- colour classes.',
    'Recolour the theme through .cst-k, .cst-f, .cst-s and .cst-c, keeping comments above 4.5:1 on #151c25.',
    'Change START_AT to begin further in or from the first character.',
  ],
  accessibility: [
    'A hidden pre element carries the complete snippet for screen readers, and the typed pane is aria-hidden.',
  ],
  faqs: [],
  related: [],
  tags: [
    'code animation',
    'syntax highlighting',
    'typing animation',
    'developer',
  ],
  height: 470,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "The whole snippet is shown coloured and complete, with the caret resting after the last line.",
  perf: "Rebuilds a few dozen coloured spans on each keystroke, a tiny DOM update, and pauses off screen.",
} satisfies UiMeta;
