const meta = {
  slug: "gold-powder-compact-that-opens-on-a-sprung-hinge-to-a-mirror-reflecting-a-portrait-over-embossed-pressed-powder",
  category: "ecommerce",
  name: "Gold Powder Compact That Opens on a Sprung Hinge to a Mirror Reflecting a Portrait over Embossed Pressed Powder",
  keyword: "makeup compact product hero react",
  title: "React Makeup Product Hero: Powder Compact | We.Inc",
  description: "Powder compact painted on a canvas: the gold lid swings up on a sprung hinge to a mirror with a portrait and pressed powder. Free React and HTML to copy.",
  intro: "A round gold compact sitting open on a deep red stage. The lid stands up behind the base and holds a mirror with a portrait photograph in it, and the base holds a pan of pressed powder with a sunburst stamped into the surface. The lid is a true disc turned about the hinge, so as it comes down the mirror narrows to a sliver, the spun gold outside swings into view and it lands on the base with a small bounce. The picture in the glass slides as the lid moves and as the pointer crosses the stage, which is what sells it as a reflection instead of a sticker. Four dots under the stage change the tone of the powder. On narrow screens the caption and controls sit below the compact, and a tap on the compact opens or shuts it.",
  useWhen: [
    "A face powder, blush, bronzer or highlighter page needs a hero object that also works as the tone selector.",
    "You want a campaign portrait on the page without giving it a full-width banner: the mirror frames it for you.",
    "A beauty gift guide needs one item that visitors can open, close and play with for a moment.",
    "A refillable compact is the product, and showing the case open and shut matters more than a list of features.",
  ],
  customize: [
    "`tones` at the top lists the powder colours with a `name`, a number and a `hex`. The pan, the pressed pattern and the dot buttons are all tinted from the hex.",
    "`REFLECTION` holds the address and alt text of the photograph in the mirror. Use a square crop with the face near the centre; the glass shows roughly the middle 80 percent.",
    "`OPEN` is the resting angle of the lid in radians. 1.84 leans it a little past upright; 1.57 stands it straight and squeezes the mirror into a flatter oval.",
    "`K` inside the effect sets how far above the table the viewer is: 0.46 is a seated view, 0.7 looks almost straight down. `E` should be the square root of one minus `K` squared.",
    "The metal is the hex list in `side` for the edges and in `spun` for the faces. Swap the golds for `#f4f4f4`, `#b9bcc2` and `#6d7078` to get a silver case.",
  ],
  accessibility: [
    "The lid has a real button that reads Close the compact or Open the compact and carries `aria-pressed`, so the drag and tap on the picture are extras.",
    "Tone buttons are labelled with the tone name and number and expose which one is pressed; the caption announces the chosen tone through a polite live region.",
    "The portrait is a real image element with alt text that the canvas copies from, so a screen reader still finds the photograph while the drawing itself stays hidden.",
    "Under reduced motion the lid jumps straight to open or shut, the idle sway is off and the reflection only moves when the pointer does.",
  ],
  faqs: [
    {
      question: "How is the lid drawn in three dimensions on a flat canvas?",
      answer: "A disc turned about a horizontal hinge and viewed from a fixed height always projects to an ellipse that touches the hinge line. One number, built from the cosine and sine of the lid angle, gives that ellipse its height, and its sign says whether the mirror or the outside is facing the viewer. The rim is the slab between two such ellipses a lid thickness apart.",
    },
    {
      question: "Will the photograph show before it has loaded?",
      answer: "Until the image arrives the glass is filled with a flat rose colour, then the frame is repainted the moment the file loads. The image element is in the markup from the first render without lazy loading, so the request starts with the page.",
    },
    {
      question: "Can I show a video or the visitor's camera in the mirror?",
      answer: "The mirror is a `drawImage` call inside a circular clip, and that call accepts a video element as well as an image. Point it at a playing video and the loop will copy each frame into the glass. Camera access needs its own permission prompt and is outside what this component does.",
    },
    {
      question: "What gives the powder its pressed look?",
      answer: "Three things layered: a radial tint that is lighter toward the lamp, a pattern of grooves each drawn twice (a dark line offset one way, a pale line offset the other) so they read as stamped in, and a tile of fine random grain laid over the top at half size.",
    },
    {
      question: "How do I close it by default?",
      answer: "Start `a` and `to` in the state object at 0 and the `open` state at false. Bear in mind a gallery thumbnail or a first impression is stronger with the mirror showing, which is why it loads open.",
    },
  ],
  related: [
    "lipstick-shade-picker-with-a-bullet-that-twists-out-of-a-lacquer-and-gold-case-and-swipes-a-swatch-beside-it",
    "velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light",
    "heavy-glass-perfume-bottle-you-tilt-with-amber-liquid-that-stays-level-and-a-gold-stopper-that-lifts-out",
  ],
  tags: ["compact", "mirror", "makeup", "canvas", "product hero", "beauty", "portrait"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
