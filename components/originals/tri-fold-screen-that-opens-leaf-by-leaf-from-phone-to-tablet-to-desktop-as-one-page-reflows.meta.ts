const meta = {
  slug: "tri-fold-screen-that-opens-leaf-by-leaf-from-phone-to-tablet-to-desktop-as-one-page-reflows",
  category: "originals",
  name: "Tri-Fold Screen That Opens Leaf by Leaf from Phone to Tablet to Desktop as One Page Reflows",
  keyword: "responsive preview animation react",
  title: "React Responsive Preview Animation: Tri-Fold | We.Inc",
  description: "Responsive preview built as a folding device: aluminium leaves open in 3D and one page reflows from phone to tablet to desktop. Free React and HTML code.",
  intro: "A responsive preview drawn as a single object instead of three mockups in a row. An aluminium device hangs over a pale table, folded into a phone with two more leaves tucked behind it. Ask for a tablet and the second leaf swings round on its hinge, lands flat and the glass lights across it: the photo slides out from above the headline to sit beside it, the lesson rows widen into cards. Ask for a desktop and the third leaf follows, the headline grows and the cards spread into a row of three. Every leaf is a real box in CSS 3D with a glass face, a blasted metal back with a lens, and four edge walls, so the stack shows its thickness when it turns. The glass keeps two soft creases where it bends and a band of reflected light that follows the pointer. On a narrow viewport the whole device is scaled down to fit, with the three size buttons at full size underneath.",
  useWhen: [
    "A site builder or theme shop wants to show that one design holds together at every width without lining up three device frames.",
    "A portfolio case study needs a moving figure for the responsive part of the project.",
    "A product page for a design tool wants a breakpoint switcher that people play with.",
    "A talk or lesson about fluid layout needs something to point at while the columns change.",
  ],
  customize: [
    "The page on the glass is the `site` object: name, links, headline, copy, button label, photo address and the three `lessons`.",
    "Each block has one box per width in `photoAt`, `headAt`, `copyAt`, `ctaAt` and `cardAt`. Change a `left`, `top`, `width` or `fontSize` there and the block glides to it.",
    "`LW` and `LH` are the width and height of one leaf, `T` is how thick it is and `BZ` is the black border round the glass.",
    "`SWING` is how long a leaf takes to come round and `HOLD` is how long the demo rests fully open before folding away.",
    "The metal is the grey gradients in `Leaf`. Swap them for `#2a2d33` to `#0d0f13` stops for a graphite body, and keep the white inner rim so the edge still catches light.",
  ],
  accessibility: [
    "The device is one real `button` with a label that states the current width and what pressing it will do, and the three size buttons carry `aria-pressed`.",
    "The miniature page is hidden from assistive technology because it is a picture of a site, and a polite live region under the buttons describes the layout in words.",
    "With reduced motion the screen starts fully open, nothing swings or floats, and the size buttons change the layout at once.",
  ],
  faqs: [
    {
      question: "Is the page inside really responsive?",
      answer: "It is choreographed, not fluid. Every block is absolutely placed and has three boxes, one per width, and CSS transitions carry it from one to the next. That gives exact control over where the photo and cards travel, which media queries alone cannot animate.",
    },
    {
      question: "How do the leaves fold without passing through each other?",
      answer: "The second leaf turns about an axis set one and a half thicknesses behind the glass, and the third turns about an axis one thickness behind the second. Folded, that leaves a slot between the first and second leaves, and the third leaf sits in it.",
    },
    {
      question: "Why does the glass light only after a leaf lands?",
      answer: "The picture is one sheet laid over whichever leaves are flat. Its width grows a moment before the swing ends and shrinks before a leaf folds away, so a moving leaf is always dark glass. Two pieces of state, `open` and `cols`, keep the two apart.",
    },
    {
      question: "Can I show my own site in it?",
      answer: "Replace the blocks inside the sheet with your own and give each one a box per width. A screenshot will not work well, because the point of the piece is watching separate blocks travel to new places.",
    },
    {
      question: "Does it need a 3D library?",
      answer: "No. The device is plain elements with `transform-style: preserve-3d` under one `perspective`. The only script is a resize observer for the scale and a few timers for the fold order.",
    },
  ],
  related: ["domain-name-plate-marked-out-in-blue-then-hand-stamped-with-steel-punches-and-screwed-down", "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube", "three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page"],
  tags: ["responsive", "device", "foldable", "3d", "breakpoints", "preview"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
