const meta = {
  slug: "ray-marched-stoneware-mug-product-showcase-you-turn-by-dragging-with-glaze-that-pours-down-in-the-colour-you-pick-on-a-yellow-sweep",
  category: "ecommerce",
  name: "Ray-Marched Stoneware Mug Product Showcase You Turn by Dragging, With Glaze That Pours Down in the Colour You Pick on a Yellow Sweep",
  keyword: "3d product showcase react",
  title: "3D Mug Product Showcase with Colour Picker (React, WebGL) | We.Inc",
  description: "Free React product showcase: a stoneware mug traced in a WebGL shader that you turn by dragging, with five dishes of glaze that pour a new colour down it.",
  intro: "A buy box for a shop that sells one thing well. A hand-thrown mug stands on an orange card on a yellow paper sweep, lit by one low window, and the whole picture is a single fragment shader: the barrel shape, the bare clay foot, the fat lip where the glaze stops and the window that bends across its shoulder. In front of it sit five small dishes of wet glaze, and each dish is a real button. Press one and the mug makes a full turn while that colour runs down from the rim in thick tongues with a bead on the front of every run, until it settles on the same wavy line above the foot. Dragging anywhere turns the mug and it coasts to a stop. On the left the name is set very large, with the glaze named under it, the price and one black button; pressing it makes the mug jump off the card and land. On phones the mug and dishes take the top of the screen and the name, price and button stack beneath.",
  useWhen: [
    "A small shop sells one hero product in a handful of colourways and has no budget to photograph each one from every side.",
    "The colour choice is the fun part of the purchase and you want picking it to feel like something happening to the object, not a thumbnail swap.",
    "A product page needs its first screen to hold people for a few seconds before they reach for the button.",
    "You are pitching a ceramics, homeware or paint brand and want the options shown as wet material instead of flat circles.",
  ],
  customize: [
    "`product` at the top holds the maker, the two lines of the name, the price text, the button label and the small note under it.",
    "`glazes` is the list of colourways. Each has a `name`, an `rgb` in linear light for the shader and a `css` colour for the plain version. Keep five entries, or change the `5` in `uDish[5]`, `uTint[5]` and the two dish loops to match.",
    "`PAPER` is the sweep and `PLINTH` the card under the mug. `[0.05, 0.3, 0.75]` paper with a `[0.9, 0.85, 0.75]` card gives a blue set with a cream card; update `bg-[#f3b81f]` on the section and the gradient on the stage so the page matches before the canvas fades in.",
    "`HERO` is the resting turn in radians and `POUR` the seconds a new glaze takes to run down. A `POUR` near 3 makes the runs crawl.",
    "The shape is `dShape` in the shader: `R` is the widest radius, `HY` half the height of the barrel and the two `2.5` powers set how square the shoulder is. A power of 2 gives a plain egg.",
    "`gline` is the wavy line where glaze meets bare clay. Raise its first number from `0.25` to dip the mug less deeply.",
    "The window direction is `sa` and `se` in `draw`. A larger `se` lifts the sun and shortens the shadow that falls across the card.",
  ],
  accessibility: [
    "Each dish of glaze has an ordinary button laid exactly over it with an `aria-pressed` state and a label such as Rose glaze, so the picker works with Tab and Enter and the focus ring follows the rim of the dish.",
    "Turning is offered as a text button as well as a drag, and the bag count is announced through a polite live region when the button is pressed.",
    "With reduced motion a new colour replaces the old one at once, the mug does not spin, jump or try colours by itself, and the frame is refined and then left alone.",
    "The canvas is hidden from assistive technology. The name is a real `h2` and the price, note and glaze name are plain text in near-black on yellow, well above 4.5 to 1.",
  ],
  faqs: [
    {
      question: "How is the mug drawn without a 3D model or a library?",
      answer: "Its shape is a signed-distance function: a rounded barrel turned about its axis, hollowed by a slightly smaller copy of itself, cut flat at the mouth and joined to a strap handle with a smooth blend. For every pixel the shader steps a ray until that distance reaches zero, then lights the point with a soft shadow toward the window, a few occlusion samples and one mirror ray for the gloss.",
    },
    {
      question: "How does the glaze pour work?",
      answer: "The edge of the new colour is a height that depends on the angle round the mug. A progress value pushes it down from the lip, and a pattern of runs lets some angles travel faster, so tongues reach the foot first and the gaps fill in after. The same function thickens the surface just behind the edge, which is why each run carries a raised bead that catches the window.",
    },
    {
      question: "Why does a cobalt mug look different from a flat blue shape?",
      answer: "Fired glaze is a coloured layer under a glossy one. The shader shades the colour as a matt surface, then adds a mirror reflection weighted by viewing angle, so the shoulder shows the window and the belly picks up the orange card it stands on. The colour is also uneven on purpose: thinner and browner over the lip, darker where it pooled above the foot and flecked with iron specks.",
    },
    {
      question: "Are the colour swatches part of the picture or real controls?",
      answer: "Both. The dishes are in the shader, with their own shadows and a ripple when picked. The component runs the same camera arithmetic in plain script to find where each dish lands on screen and positions a transparent button there, at least 44 pixels in each direction, and it repeats that whenever the section is resized.",
    },
    {
      question: "Will it hold a steady frame rate on a laptop?",
      answer: "The buffer is capped near two million pixels. Rays only walk the mug inside a tight cylinder round it, and floor pixels only test for a shadow when their path to the window crosses that cylinder. While nothing moves the picture is averaged over about fifty passes and then the loop stops. If frames run long during a pour the canvas gives up a step of resolution.",
    },
    {
      question: "What appears where WebGL is unavailable?",
      answer: "A mug, card and five dishes built from CSS shapes, placed by the same camera arithmetic so the buttons still line up. Choosing a colour there wipes the new glaze down the body with a clip-path transition, and the name, price and button are plain HTML in every case.",
    },
  ],
  related: [
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
    "ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table",
    "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
    "doughnut-box-product-grid-with-nine-photographed-doughnuts-in-paper-cases-and-a-windowed-lid-that-slides-off",
  ],
  tags: ["product", "ecommerce", "webgl", "ray marching", "shader", "colour picker", "ceramic", "3d", "add to bag"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
