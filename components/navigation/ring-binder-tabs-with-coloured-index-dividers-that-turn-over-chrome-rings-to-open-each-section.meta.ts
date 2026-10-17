const meta = {
  slug: "ring-binder-tabs-with-coloured-index-dividers-that-turn-over-chrome-rings-to-open-each-section",
  category: "navigation",
  name: "Ring Binder Tabs with Coloured Index Dividers That Turn over Chrome Rings to Open Each Section",
  keyword: "ring binder tabs react",
  title: "React Ring Binder Tabs with Index Dividers | We.Inc",
  description: "Vertical tabs drawn as an open ring binder: press a coloured index tab and the dividers turn over chrome rings to that section. Free React and HTML code.",
  intro: "An open ring binder lying on a desk, seen from just above its near edge so the three rings stand up as real arches. Dark cloth boards, a steel plate down the spine and three chrome rings hold a block of cream pages, and four index dividers stick out of the right edge with a coloured, laminated tab each: green, yellow, orange and blue. Press a tab and every divider in front of it swings over the rings in turn, with real depth and a shadow that deepens as the page stands on edge, until the binder lies open at that section. The right page carries the section's words as text, a heading, a paragraph and a short priced list, and the back of the divider now lying on the left carries a full plate photograph for it. Tabs that have been turned stay reachable on the left edge. On a phone the binder is redrawn with narrower pages and smaller type so the spread still fits across the screen.",
  useWhen: [
    "A restaurant, studio or shop has four or five chapters, such as seasons, collections or services, and each one deserves a photograph beside its text.",
    "You need vertical tabs but want the order of the sections to be felt, with earlier ones piling up on the left as the reader moves on.",
    "A brand book, handbook or menu page should look like the printed binder it replaces.",
    "The panel is a spread: one tall picture and around forty words with a short list.",
  ],
  customize: [
    "`sections` holds one divider each: `tab` is the word on the tab, `colour` the tab itself, `deep` the darker shade used for the heading and prices, then `title`, `body`, `dishes`, `photo`, `alt` and `caption`.",
    "`WIDE` and `SLIM` are the two sets of measurements. `pageW` and `pageH` size a page, `gut` is the gap the rings bridge and `tabW` is how far a tab sticks out.",
    "The boards are `#24303a` in the cover block, the paper is the `PAGE` constant and `TILT` is how far the binder leans back from the camera. `RINGS` lists where the three rings sit as fractions of the page height, so `[0.25, 0.75]` gives a two ring binder.",
    "A turn takes `0.95` seconds and each following divider waits another `0.14`. Both numbers are in `Leaf` and in the `wait` line where the leaves are drawn.",
    "The binder starts open at the second section because `sel` begins at `1`. Change both numbers in that `useState` to start somewhere else.",
  ],
  accessibility: [
    "Every divider carries one real button with `role=\"tab\"`, `aria-selected` and `aria-controls`, named by the word on its tab. The button rides on the turning sheet, so a `role=\"tablist\"` element with `aria-orientation=\"vertical\"` adopts the four of them through `aria-owns`.",
    "Up and down arrows move between sections and wrap, Home and End go to the first and last, and focus follows the tab to whichever side of the binder it lands on.",
    "The text page is the `role=\"tabpanel\"`. Pages and photographs that are buried in the block are marked `aria-hidden`, and each photograph that is showing has its own alt text.",
    "The focus ring is painted on the coloured tab on both faces of the sheet. With reduced motion the dividers change sides at once and the binder stops leafing through by itself.",
  ],
  faqs: [
    {
      question: "How is the page turn done without a 3D library?",
      answer: "Each divider is one element with `transform-style: preserve-3d` that rotates about its left edge, which sits on the ring line. It has two children with `backface-visibility: hidden`, the second pre-rotated by 180 degrees, so the front shows the text and the back shows the next photograph. A `perspective` on the parent supplies the depth.",
    },
    {
      question: "Why does the photograph for a section sit on the back of the divider before it?",
      answer: "That is how a real binder works: when you open at a divider, what faces it is the reverse of the sheet you just turned. So the back of divider one holds the picture for section two, and a fixed flyleaf on the left holds the picture for section one.",
    },
    {
      question: "Can I add a fifth divider?",
      answer: "Yes. Add an entry to `sections` with its own colour. The tabs share the page height equally, so five tabs are each a fifth as tall; on a phone that still leaves each one taller than a finger.",
    },
    {
      question: "The tabs are narrow on a phone. Are they still easy to press?",
      answer: "The visible tab is narrow but the button is wider than it. `hit` in `SLIM` extends the pressable area inwards over the edge of the page, so the target is about 47 pixels wide and 89 tall.",
    },
    {
      question: "How do I stop it turning pages by itself?",
      answer: "Delete the effect that calls `setInterval`. It already stops permanently after the first press or arrow key, and it holds still while the pointer is over the binder.",
    },
  ],
  related: ["pull-down-wall-chart-tabs-on-spring-rollers-that-snap-up-to-uncover-the-chart-hanging-behind", "brass-lift-floor-indicator-navigation-with-an-arrow-that-sweeps-an-enamel-dial-between-sections", "cast-iron-finger-post-navigation-with-painted-arms-that-swing-round-the-post-to-point-at-the-chosen-page"],
  tags: ["tabs", "vertical tabs", "ring binder", "page turn", "3d", "skeuomorphic"],
  height: 672,
  section: true,
  interactive: true,
};

export default meta;
