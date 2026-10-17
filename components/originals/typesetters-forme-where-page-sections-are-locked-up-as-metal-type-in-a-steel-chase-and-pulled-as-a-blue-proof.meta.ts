const meta = {
  slug: "typesetters-forme-where-page-sections-are-locked-up-as-metal-type-in-a-steel-chase-and-pulled-as-a-blue-proof",
  category: "originals",
  name: "Typesetter's Forme Where Page Sections Are Locked up as Metal Type in a Steel Chase and Pulled as a Blue Proof",
  keyword: "letterpress page layout animation react",
  title: "React Page Layout Animation in Letterpress Type | We.Inc",
  description: "A web page set as metal type in a steel chase: move a block, the quoins lock up and a sheet turns over to show a blue proof. Free React and HTML to copy.",
  intro: "On a dark stone lies a steel chase, the frame a letterpress printer locks type into. Inside it a surf school's homepage is set as five blocks of type metal: a menu line, a hero with a halftone plate, features, prices and a footer. Everything on the metal is mirrored and wet with blue ink, as real type is. Wooden furniture and four steel quoins hold the blocks tight, and a quoin key stands in one of them. Press a block and the key turns, the quoins relax and the blocks loosen, the block changes place with its neighbour, the key turns back and it all squeezes shut. A sheet of paper is then laid on the type and turned over to the right, where it reads the right way round, with a proof number that counts up. At phone width the whole drawing scales down as one object.",
  useWhen: [
    "You want to say that arranging a page is a craft with a long history, and show it rather than write it.",
    "A page for a print studio, a type foundry or a design tool needs a hero that is specific to the trade.",
    "You are explaining that a draft and its published result are two views of the same arrangement.",
    "You need an example of a card turning over on an off-centre hinge so it lands exactly on a second position.",
  ],
  customize: [
    "`sections` lists the movable blocks and their heights. The menu line is separate and always sits at the head of the column.",
    "`INK` is the wet colour on the metal and `PRINT` the slightly deeper blue on paper. Set both to a near-black for a traditional proof.",
    "`TIGHT` and `SLACK` are the gaps between blocks when locked and unlocked. A bigger `SLACK` makes the loosening easier to see.",
    "The `Section` function draws each block for both the metal and the paper. Its `metal` flag only switches colours and the raised-letter shadow.",
    "`HINGE` is worked out from the positions of the chase and the sheet. If you move either, leave the formula alone and the sheet will still land on the type.",
  ],
  accessibility: [
    "Each movable block is a `button` labelled with its section name and its place in the column, because the visible lettering is mirrored and hidden from screen readers.",
    "Up and Down arrow keys move the focused block one place. Enter or Space moves it up, or down if it is already first.",
    "A polite live line reports each stage: loosened, moved, locked, and proof pulled. It stays silent while the self-running demo is playing.",
    "With reduced motion the blocks swap at once and the new proof is simply shown.",
  ],
  faqs: [
    {
      question: "Why is the text in the frame backwards?",
      answer: "Metal type is cast as a mirror image so that the print reads correctly. Each block wraps its content in an element with `scaleX(-1)`. The sheet uses the same content without the flip, so turning the paper over really does produce the readable page.",
    },
    {
      question: "How does the sheet land exactly on the type when it turns?",
      answer: "The sheet rotates about a vertical line set with `transform-origin`. That line sits halfway between the printed area on the paper and the type area in the chase, so a half turn maps one onto the other. It is outside the sheet itself, which is why the origin is a negative pixel value.",
    },
    {
      question: "How is the photograph made to look like a printing plate?",
      answer: "The image is shown in greyscale with raised contrast, then covered by a flat blue layer using `mix-blend-mode: screen`, which turns the dark areas blue and leaves the light areas alone. A fine repeating dot pattern on top suggests a halftone screen.",
    },
    {
      question: "Can a visitor interrupt the sequence?",
      answer: "No. A press during the unlock, move, lock and proof sequence is ignored until the sheet has finished turning, which takes a little over three seconds. This keeps the forme and the proof from ever disagreeing.",
    },
    {
      question: "Is the faceted look of the metal done with images?",
      answer: "There are no images apart from the one photograph. The steel, the type metal and the wood are gradients, and their thickness comes from a few stacked one-pixel shadows below each part.",
    },
  ],
  related: [
    "proof-press-with-a-steel-cylinder-that-rolls-a-typed-brief-into-a-printed-homepage",
    "felt-letter-board-prompt-box-where-typed-plastic-letters-drop-out-of-the-grooves-and-a-homepage-is-set-in-their-place",
    "page-section-blocks-in-resin-ceramic-and-anodised-metal-that-lift-out-of-a-stack-to-reorder-a-live-page",
  ],
  tags: ["originals", "letterpress", "sections", "reorder", "print", "metal type", "page layout"],
  height: 720,
  interactive: true,
};

export default meta;
