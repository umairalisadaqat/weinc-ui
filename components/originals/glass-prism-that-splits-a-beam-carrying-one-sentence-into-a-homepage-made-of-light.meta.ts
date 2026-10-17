const meta = {
  slug: "glass-prism-that-splits-a-beam-carrying-one-sentence-into-a-homepage-made-of-light",
  category: "originals",
  name: "Glass Prism That Splits a Beam Carrying One Sentence into a Homepage Made of Light",
  keyword: "canvas light beam prism animation react",
  title: "React Canvas Light Beam and Prism Animation | We.Inc",
  description: "A torch holding one sentence fires a beam into a glass prism, and the fan of blue light paints a homepage band by band. Copy the React code or HTML free.",
  intro: "A dark room with three things in it. On the left, a machined torch with a sentence about a florist set into its barrel. In the middle, a block of glass. On the right, a sheet that you cannot read until light reaches it. The torch throws a thin white beam into the prism, the glass bends it and opens it into five bands running from near white to deep blue, and each band lands on one strip of the sheet: the menu, the headline, the photograph of tulips, a row of three labels and the button. The bands switch on one after another, so the page is assembled from the top down, with dust drifting through the fan. Move the pointer up or down and the prism tips a few degrees, which slides the light off the page so the edges fall back into darkness. On a phone the scene scales to the width, and the sentence is repeated under it at full size next to the switch.",
  useWhen: [
    "The opening picture of a product that turns a short written request into a finished page, where you want the idea understood before anyone reads a word.",
    "A dark themed landing page that needs one glowing object instead of a screenshot.",
    "A section explaining that one input becomes several parts: swap the five page strips for five outputs of your own.",
    "A talk or launch page title card, played once and left lit.",
  ],
  customize: [
    "The `site` object holds the sentence and every word on the sheet. The photograph address and its alt text are in `site.photo`.",
    "`ROWS` lists where each band of light ends, measured down the sheet in pixels. Move a number and both the light and the matching strip of the page move with it.",
    "`TINTS` are the five band colours as RGB triples, top to bottom. Use one hue in five strengths, as here, or a full spectrum.",
    "`DIM` is how visible the page is with the beam off. 0 hides it completely; 0.15 leaves a ghost of the layout.",
    "The stagger is the `150` in the `alpha` line, in milliseconds per band, and `620` is how long each band takes to reach full strength.",
  ],
  accessibility: [
    "The sheet is real markup with an `h2` and an image with alt text. The light is a CSS mask over it, so the content is always in the reading order even while it is dark on screen.",
    "The canvas and the torch are hidden from assistive technology, and the sentence is given once as plain text beside the switch.",
    "The switch is a `button` with `aria-pressed` and a visible focus ring; no information depends on moving a pointer.",
    "With reduced motion the frame loop does not run: the scene is drawn once fully lit, without flicker, drifting dust or the idle sway of the glass.",
  ],
  faqs: [
    {
      question: "How does the light reveal the page?",
      answer: "Every frame the script works out where the six edges of the fan meet the left side of the sheet, then writes a `mask-image` gradient whose stops sit at those heights. A band at full strength makes its strip opaque; with the beam off the strip drops to the `DIM` level.",
    },
    {
      question: "Is the refraction physically correct?",
      answer: "The path is: straight in, bent toward the base inside the glass, spread on the way out. The angles are chosen so the fan covers the sheet, which is far wider than real dispersion in glass. Treat it as an illustration of a prism, not a simulation.",
    },
    {
      question: "What is drawn on the canvas and what is HTML?",
      answer: "The beam, the fan, the dust and the prism are drawn on one 2D canvas with additive blending for the light. The torch, the sheet and the controls are elements, which keeps the page text sharp and selectable.",
    },
    {
      question: "Can I change how many bands there are?",
      answer: "Yes. `ROWS` needs one more entry than `TINTS`. Add a value to each and place a new block of page content between the two row edges. The mask builder and the fan loop both use a fixed count of five, so change the `5` and `4` in those two loops to match.",
    },
    {
      question: "How heavy is the animation?",
      answer: "One canvas at twice the design size, five filled triangles, about forty dots and a few gradients per frame. The loop pauses when the piece leaves the viewport.",
    },
  ],
  related: ["pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage", "proof-press-with-a-steel-cylinder-that-rolls-a-typed-brief-into-a-printed-homepage", "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph"],
  tags: ["prism", "light", "canvas", "glass", "beam", "reveal", "originals"],
  height: 770,
  section: true,
  interactive: true,
};

export default meta;
