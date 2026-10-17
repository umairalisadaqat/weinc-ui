const meta = {
  slug: "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes",
  category: "ecommerce",
  name: "Shoebox with a Hinged Lid That Lifts and Tissue Paper That Parts over a Pair of Leather Shoes",
  keyword: "3d product unboxing animation react",
  title: "React 3D Product Unboxing Animation: Shoebox | We.Inc",
  description: "Product reveal built as a shoebox in 3D: the hinged lid lifts, sheets of tissue part and curl, and the shoes lie beneath. Free React and HTML code.",
  intro: "A cobalt shoebox on a sand coloured table, seen from above and slightly to the right. A quarter of a second after load the lid swings back on its far edge and rocks to a stop, showing a photograph pasted inside it. Once the lid is clear, two sheets of white tissue lift off the shoes, the left one first by a hair, and their loose halves curl outward and flutter before they settle. Underneath, a pair of chestnut lace-ups lies on more tissue, with the shadow of the box walls falling across it. The end of the box carries a white stock label with style, size and a barcode. Closing runs the other way round: tissue first, lid second. On a phone the whole box scales down as one object and the caption and button stay at the bottom.",
  useWhen: [
    "A shoe, bag or accessories shop wants the product page to open with the moment of unboxing instead of a flat packshot.",
    "An order confirmation or delivery page needs a small celebration that is about the thing bought, not confetti.",
    "A subscription box or gift service wants to show what arrives and how it is wrapped.",
    "A launch page keeps a new style under wraps and lets the visitor open the box to see it.",
  ],
  customize: [
    "Words and pictures are in the `pair` object. `shoes` should be a top down photo on a white or very pale ground, because it is laid over the tissue with `mixBlendMode: \"multiply\"` and white disappears. Adjust its `width`, `left` and `top` on the `<img>` to frame your own shot.",
    "`BLUE` and `BLUE_DARK` are the printed outside and its shaded end, `CARD` is the raw board you see inside. The table is `bg-[#e4dccb]` plus the radial gradient over it.",
    "`W`, `DP` and `H` set the length, depth and height of the box, and `LIP` how deep the lid's skirt hangs. A flatter garment box is `H` around 70 with `LIP` at 30.",
    "`LID_OPEN` is the angle the lid rests at. The wobble comes from the `lid` spring: raise `damping` from 8.5 toward 14 for a heavier lid that does not rock.",
    "`FLAP_A` and `FLAP_B` are the two panels of each tissue sheet. Their sum should be a little over half of `W` so the sheets overlap when shut.",
  ],
  accessibility: [
    "There are three real buttons: the outside of the lid, the inside of the lid, and a labelled pill under the box. Only the lid face you can see is in the tab order, and the pill reports its state with `aria-pressed`.",
    "Both photographs are ordinary images with alt text, so the shoes and the print are described even though they sit inside a transformed scene. Tissue, shadows and the barcode stripes are decoration.",
    "With reduced motion the box is drawn open with the tissue already parted, the timer never starts, and the buttons switch between open and shut without any swing.",
    "The automatic open and close cycle stops for good the first time someone presses a control, and pauses while the pointer or keyboard focus is inside the scene.",
  ],
  faqs: [
    {
      question: "How does the tissue look crumpled without an image file?",
      answer: "The texture is a small inline SVG used as a background: fractal noise passed through `feDiffuseLighting` with a distant light, which turns the noise into ridges with a lit side and a shaded side. Every tissue surface shares the same tile at a different `backgroundPosition`, so creases do not line up from sheet to sheet.",
    },
    {
      question: "Why are the shoes a flat photograph and not a 3D model?",
      answer: "A top down photo lying on the floor of a box seen from above reads correctly, because that is the angle it was taken from. Multiply blending drops the white backdrop and keeps the photo's own soft shadow, and an inset shadow from the walls ties it to the box. It keeps the component to two image requests and no 3D library.",
    },
    {
      question: "What stops the lid closing on the tissue?",
      answer: "Two listeners order the motion. When opening, the tissue spring is only released once the lid has passed 52 degrees. When closing, the tissue is told to fold first and the lid spring is only sent home once the sheets are about two thirds of the way down.",
    },
    {
      question: "How do the sheets curl instead of swinging like doors?",
      answer: "Each sheet is two panels. The inner one is hinged on the rim of the box and the outer one is hinged on the end of the inner one, with a softer, less damped spring called `curl` that chases the first. The outer panel overshoots and swings back a few times, which is the flutter you see.",
    },
    {
      question: "Can I use it for something other than shoes?",
      answer: "Yes. Anything photographed from above on white works: a folded shirt, a watch on its cushion, a set of ceramics. Change `H` for the depth of the box, replace the two addresses in `pair`, and edit the label text on the end wall.",
    },
  ],
  related: ["matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches", "spice-jar-rack-filter-with-glass-jars-that-turn-behind-a-brass-rail-to-show-their-labels", "steel-safe-promo-code-reveal-with-a-combination-dial-you-turn-and-a-thick-door-that-swings-open"],
  tags: ["3d", "ecommerce", "unboxing", "product", "reveal", "box", "tissue paper"],
  height: 810,
  section: true,
  interactive: true,
};

export default meta;
