const meta = {
  slug: "coloured-pencil-roll-colour-picker-where-the-chosen-pencil-slides-out-of-its-canvas-pocket-and-scribbles-a-swatch",
  category: "inputs",
  name: "Coloured Pencil Roll Colour Picker Where the Chosen Pencil Slides out of Its Canvas Pocket and Scribbles a Swatch",
  keyword: "coloured pencil colour picker react",
  title: "React Colour Picker as a Coloured Pencil Roll | We.Inc",
  description: "Colour picker drawn as a canvas pencil roll: the pencil you choose slides out of its pocket and hatches a swatch on a card. Free React and HTML to copy.",
  intro: "Ten lacquered hexagonal pencils sit in the stitched sleeves of an unrolled waxed canvas wrap, points up, with a small stack of swatch cards beside them. Pick a pencil and it draws itself up out of its sleeve, tilts to a writing angle, crosses to the card and hatches a quick zigzag block in its own colour, then goes home and stays a little taller than its neighbours so the choice is visible at a glance. The mark is real pencil on toothed card: the strokes are layered and the paper grain is cut out of them, so white specks show through. Each swatch gets its name and hex code written underneath. When three swatches fill a card, it slides off the stack and a clean one takes its place. On phones the card moves above the roll and every pencil stays a full-height tap target.",
  useWhen: [
    "A drawing, notes or whiteboard app needs a pen colour menu with more character than a row of dots.",
    "A stationery or school supplies shop wants the product itself to be the colour filter on a category page.",
    "A children's learning tool where recognising and naming ten colours is part of the lesson.",
    "A design studio site uses a small playful control to recolour the page accent.",
  ],
  customize: [
    "`pencils` is the set, left to right. `name` is stamped in gold on the barrel and written under the swatch, `rgb` is the core colour. Ten fit the wrap; for eight or twelve change `pitch` in `layoutFor` so the row still fills the sleeves.",
    "`START` lists the swatches already on the card at load. Its last entry is the pencil that starts selected.",
    "`RAISE` is how many pixels the selected pencil stands above the others. 30 reads clearly without touching the top hem.",
    "The cloth colour is the three base numbers `43, 47, 56` in `makeTiles`. Try `92, 98, 70` for olive drab or `150, 120, 84` for raw duck canvas.",
    "Hatching speed is the `1.05` in the list of phase durations inside `step`. The density of the hatch is `N = 19` in `pathFor`.",
  ],
  accessibility: [
    "Every pencil is a button with `role=\"radio\"` and its colour name as the label, grouped in a `radiogroup` called Pencil colour.",
    "Arrow keys move along the row and wrap at the ends, Home and End jump to the first and last pencil, and only the chosen radio takes a tab stop.",
    "The selected colour is also written as text and hex beneath the object, in an `output` that turns into a polite live region after the first real choice.",
    "Selection never depends on colour alone: the chosen pencil is physically taller. With reduced motion the swatch simply appears finished on the card.",
  ],
  faqs: [
    {
      question: "How does the scribble get its grainy pencil look?",
      answer: "Three strokes of different widths and strengths are laid along the same zigzag on a hidden layer. A second layer holds a fixed speckle pattern that stands for the low spots in the card, and it is punched out of the strokes before they are multiplied onto the paper. Wax only reaches the high spots, so the white specks stay white.",
    },
    {
      question: "Why does each barrel have three stripes of the same colour?",
      answer: "A hexagonal pencil lying down shows three of its six faces. The one nearest the lamp is lightest, the middle one carries the sharp reflection line and the far one falls into shade. A gradient with hard stops at a quarter and three quarters of the width draws those faces.",
    },
    {
      question: "What happens if someone picks several pencils quickly?",
      answer: "The pencil in hand finishes its swatch and returns before the next one leaves. Only the most recent request is kept, so a burst of clicks ends on the last pencil chosen and the readout below already shows it.",
    },
    {
      question: "How do I connect it to my own state?",
      answer: "`sel` is the index of the chosen pencil. Call your setter inside `choose`, or lift `sel` out and pass it back in. `hexOf(pencils[sel].rgb)` gives the value as a hex string.",
    },
    {
      question: "Does the canvas keep redrawing when nothing is happening?",
      answer: "No. The roll, the stitching and the card are painted once into two cached layers. A frame is drawn only while a pencil is moving, a card is leaving or a label is fading in, and the loop pauses off screen.",
    },
  ],
  related: ["watercolour-pan-tin-colour-picker-with-a-sable-brush-that-loads-a-pan-and-blooms-a-wash-into-cotton-paper", "oil-paint-tube-colour-mixer-that-squeezes-beads-onto-an-enamel-tray-for-a-palette-knife-to-blend", "index-card-checklist-where-a-pencil-draws-each-tick-in-graphite-and-its-eraser-rubs-it-out"],
  tags: ["colour picker", "pencils", "canvas", "radio group", "swatches", "fabric", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
