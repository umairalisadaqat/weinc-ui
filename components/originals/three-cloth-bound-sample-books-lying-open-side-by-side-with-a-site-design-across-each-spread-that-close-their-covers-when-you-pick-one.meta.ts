const meta = {
  slug: "three-cloth-bound-sample-books-lying-open-side-by-side-with-a-site-design-across-each-spread-that-close-their-covers-when-you-pick-one",
  category: "originals",
  name: "Three Cloth-Bound Sample Books Lying Open Side by Side with a Site Design Across Each Spread That Close Their Covers When You Pick One",
  keyword: "design comparison react component",
  title: "React Design Comparison Component: Open Books | We.Inc",
  description: "Design comparison with cloth-bound books lying open, a website design across each spread: pick one and the others close. Free React and HTML code to copy.",
  intro: "A comparison view built as three bound sample books on a warm white table, the kind a printer or a wallpaper shop hands you. Every book lies open at one spread, and each spread is a different design of the same homepage, printed across both pages so the gutter shadow falls down the middle of it. Choosing a design leaves that book open and lifts it a little off the table, while the front boards of the other two swing over on their spines and land shut, showing bookcloth, a blind-stamped frame and a foil title. A satin ribbon marker trails from the tail of each book. A fourth button lays all three open again, and the brief that produced them is typed on a slip of paper pinned at the head of the table. The spreads are live text and photographs for an invented ceramics studio. From tablet width up the table is seen at an angle in CSS perspective; on a phone the books lie one above the other, seen from straight overhead.",
  useWhen: [
    "A builder returns three designs for one brief and you want all three readable at the same moment before the visitor commits.",
    "A branding or print studio shows three routes for a client and wants the rejected ones put away, not deleted.",
    "A theme shop compares a light, a dark and a colourful version of one template on a single screen.",
    "A lookbook, wallpaper or fabric brand needs a sample-book metaphor that is literally true to how its customers choose.",
  ],
  customize: [
    "`books` holds the three volumes: `name`, `note`, the `cloth` colour of the boards, the `foil` colour of the stamped title, the `ribbon` colour and `spread`, an element drawn at 334 by 238 pixels (`DW` and `DH`).",
    "Lay a spread out as two halves of 167 pixels. Keep headlines and faces out of the middle 20 pixels, because the gutter shading sits there.",
    "`HALF` and `BH` are the width and height of one board. `THICK` is the depth of the page block, used for the front lip and for how high a closed cover rests.",
    "The closing spring is `stiffness: 62, damping: 13.5` in `Book`. A damping of 9 lets the cover bounce once on the pages; 20 lays it down with no bounce.",
    "`tilt` in the main component is the camera angle on wide screens. Set it to 0 for a flat overhead view everywhere.",
  ],
  accessibility: [
    "The three design pills form a `radiogroup` with arrow-key, Home and End support. The Open all three button is a separate toggle with `aria-pressed`.",
    "Clicking a book is a shortcut for pointer users only; the same choice is always available from the pills, which are 40 pixels tall.",
    "The table is one labelled image that says which book is open, and the note below it is announced politely when it changes.",
    "With reduced motion the covers change state without swinging, nothing lifts and the demo does not run.",
  ],
  faqs: [
    {
      question: "How does one drawing end up on two pages?",
      answer: "The spread is rendered twice. Each page is a box 167 pixels wide with `overflow: hidden`, and the right-hand copy is shifted left by half the spread width. A gradient over each page darkens it toward the gutter and lifts a highlight where the paper swells.",
    },
    {
      question: "How does the cover close?",
      answer: "The left board is a 3D element hinged on its right edge with `transform-origin: 100% 50% 7px` and turned by `rotateY` from 0 to 180 degrees on a spring. Putting the hinge seven pixels above the table means the board lands fourteen pixels up, on top of the right-hand pages, not inside them. Its inner and outer faces each hide when turned away.",
    },
    {
      question: "Why does a closed book slide sideways?",
      answer: "A closed book is half as wide as an open one. Each book shifts left by a quarter of its open width as it closes, so it stays centred in its place on the table and the row does not look lopsided.",
    },
    {
      question: "Can I show a screenshot in place of a hand-built spread?",
      answer: "Yes. Make `spread` an image with `object-cover` that fills the 334 by 238 box. A landscape capture of the top of a homepage works well, and the gutter shadow is added for you.",
    },
    {
      question: "Where do I hook in my own selection handler?",
      answer: "`pick` receives the index of the chosen book, or `null` when all three are opened again. Call your function there, or lift the `chosen` state to a parent.",
    },
  ],
  related: ["three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page", "cloth-bound-book-spine-chapter-menu-where-the-chosen-volume-leaves-the-shelf-and-opens-at-its-chapter", "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre"],
  tags: ["design picker", "book", "comparison", "bookcloth", "3d", "editorial", "chooser"],
  height: 627,
  section: true,
  interactive: true,
};

export default meta;
