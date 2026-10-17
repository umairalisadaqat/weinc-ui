const meta = {
  slug: "ray-marched-wireless-headphones-product-hero-in-matte-plastic-and-leather-on-a-paper-sweep-that-recolours-with-each-swatch",
  category: "ecommerce",
  name: "Ray-Marched Wireless Headphones Product Hero in Matte Plastic and Leather on a Paper Sweep That Recolours With Each Swatch",
  keyword: "headphones product page react",
  title: "3D Headphones Product Hero with Swatches (React, WebGL) | We.Inc",
  description: "Free React product hero: wireless headphones traced in a WebGL shader, matte plastic and soft leather you turn by dragging, with swatches that restyle the set.",
  intro: "The opening screen of a product page for one pair of headphones. They stand on their cushions on a round paper card, in front of a paper sweep, lit by a window off to the left, and everything you see is one fragment shader: the arched band with its padded leather strip, the metal forks that hold each cup, the domed shells in soft-touch plastic and the cushions with their grain and sheen. Under the name sits a row of five colour chips. Pick one and the pair makes a full turn while the new colour sweeps across from one cup over the band to the other, the cushions change with it and the paper behind follows a beat later, so the whole photograph is re-dressed rather than a picture swapped. Drag anywhere to turn them by hand; they coast and settle. The price is set large beside one dark button, and pressing it makes the pair hop off the card. On phones the headphones sit at the top and the words, chips and button stack below.",
  useWhen: [
    "A brand sells a single piece of hardware in a few colourways and wants the first screen to feel like a studio shoot of each one.",
    "The colour choice changes more than the product, so the backdrop, card and button should all move with it.",
    "You need a buy box that holds attention on desktop and still reads cleanly at phone width.",
    "You are pitching an audio, eyewear or small-electronics client and want the materials to read as plastic and leather, not flat fills.",
  ],
  customize: [
    "`product` at the top holds the maker, the two lines of the name, the price, the button label and the small note under it.",
    "`colourways` lists each option with three plain hex colours: `shell` for the plastic, `leather` for the cushions and head pad, and `paper` for the sweep and the page. The card underneath is the paper darkened a little, worked out in the code.",
    "`HERO` is the resting turn in radians and `SWAP` the seconds a new colour takes to cross the shell.",
    "The shape lives in the shader: `CX` and `CY` place each cup, `BC` and `RB` set the centre and radius of the band, and `dCush` holds the cushion thickness (the `0.125`).",
    "The window direction is `sa` and `se` inside `draw`. A larger `se` raises the sun and shortens the shadow on the card.",
    "Keep text dark: `INK` is used on every paper colour, so choose papers light enough to keep it readable.",
  ],
  accessibility: [
    "The five colour chips are ordinary buttons in a labelled group, each 44 pixels square with an `aria-pressed` state and the colour name as its label, so Tab and Enter pick a finish.",
    "Turning is offered as a text button as well as a drag, and adding to the bag is announced through a polite live region.",
    "With reduced motion a new finish appears at once, the pair does not spin, hop or change colour by itself, and the frame is refined once and left still.",
    "The canvas is hidden from assistive technology. The name is a real `h2`, and the price, note and colour name are plain dark text on light paper.",
  ],
  faqs: [
    {
      question: "How are the headphones built without a model file?",
      answer: "Every part is a distance function. The cups are rounded ovals with a shallow dome on the outside, each cushion is a squashed ring, the forks are thin rings cut in half, and the band is an arc with a narrower padded arc beneath it. Mirroring across the middle means one side is written and the other comes free.",
    },
    {
      question: "What makes the plastic look matte and the leather look soft?",
      answer: "Each material gets its own roughness. The plastic has a broad, dim highlight, a fine speckle in its surface and a little light wrapping past the shadow line. The leather is rougher still, carries a grain and creases in its surface direction, and picks up a sheen at grazing angles, which is how real cushions catch a window.",
    },
    {
      question: "How does a colour change travel across the pair?",
      answer: "A front moves from one side of the headphones to the other over a gentle wave, and everything behind it takes the new shell and cushion colour. The paper sweep and the card ease toward their new colour a beat later, and the page background follows with a CSS transition so the edges match.",
    },
    {
      question: "Does it keep up on an ordinary laptop?",
      answer: "The drawing buffer is capped near 1.8 million pixels, rays only walk the headphones inside a tight cylinder around them, and when nothing moves the image is averaged over sixty-four passes and the loop stops. If frames run long while it spins, the canvas drops a step of resolution, and it pauses whenever it is off screen.",
    },
    {
      question: "What shows when WebGL is not available?",
      answer: "A flat drawing of the same headphones at the same place and size, coloured from the chosen finish, with the paper colour still changing behind it. The name, chips, price and button are plain HTML either way.",
    },
  ],
  related: [
    "ray-marched-stoneware-mug-product-showcase-you-turn-by-dragging-with-glaze-that-pours-down-in-the-colour-you-pick-on-a-yellow-sweep",
    "ray-marched-fluted-stoneware-vase-product-card-on-a-paper-plinth-with-a-colourway-glaze-wipe-and-drag-to-turn",
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
    "ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table",
  ],
  tags: ["product", "ecommerce", "webgl", "ray marching", "shader", "colour swatches", "headphones", "3d", "add to bag"],
  height: 780,
  interactive: true,
  section: true,
};

export default meta;
