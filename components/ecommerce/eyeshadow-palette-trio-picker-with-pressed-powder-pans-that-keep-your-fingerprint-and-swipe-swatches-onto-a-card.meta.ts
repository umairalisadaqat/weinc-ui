const meta = {
  slug: "eyeshadow-palette-trio-picker-with-pressed-powder-pans-that-keep-your-fingerprint-and-swipe-swatches-onto-a-card",
  category: "ecommerce",
  name: "Eyeshadow Palette Trio Picker with Pressed Powder Pans That Keep Your Fingerprint and Swipe Swatches onto a Card",
  keyword: "eyeshadow palette shade selector react",
  title: "React Shade Selector: Eyeshadow Palette | We.Inc",
  description: "Eyeshadow palette on a canvas: pressed powder pans keep a fingerprint where you press, and your picks are swiped onto a card. Free React and HTML code.",
  intro: "An eight pan eyeshadow palette photographed from directly overhead on a dark blue table, with a cream swatch card under it. The case is brushed champagne metal around a black tray. Each pan is a tin ring holding pressed powder: the mattes show the faint cloth weave a press leaves behind, the shimmers and metallics are full of flecks that flash in turn as the lamp travels. Press a pan and your finger leaves an oval dent with ridges and a few crumbs at its edge, a puff of dust lifts off, and that shade is swiped onto the card in place of the oldest of your three. The card prints the three names under the swipes. On a phone the whole drawing scales down with the pans still large enough to tap, and the caption moves below.",
  useWhen: [
    "A build your own palette or pick three offer needs a selector where choosing feels like touching the product.",
    "An eyeshadow, blush or pressed pigment page wants to show matte, shimmer and metallic finishes side by side under moving light.",
    "A beauty quiz ends on a recommended trio and you want to present it as swatches on a card instead of a list.",
    "A cosmetics landing page needs one rich object above the fold and has no overhead product photography.",
  ],
  customize: [
    "`pans` at the top is the palette, top row first: a `name`, a `hex` and a `finish` of matte, shimmer or metallic. The grid is four across, so keep the count at eight or change `centre` to lay out more.",
    "`FIRST_TRIO` holds the three pan numbers that are already pressed and swiped on load. Change it to the shades you most want in the thumbnail.",
    "`SHINE` maps each finish to how hard it reflects, from 0 to 1. Raising shimmer from 0.6 toward 1 makes it as bright as the metallics and adds more flecks.",
    "The case colour is the five hex stops of `body` in `paintStill`; replace them with `#3a3a3e`, `#1c1c1f`, `#0c0c0e`, `#2a2a2e`, `#050506` for a black case, and lighten the stage to match.",
    "`CARD` sets the centre, tilt and size of the swatch card, and `product.card` is the small heading printed on it.",
  ],
  accessibility: [
    "Every pan is a real button laid over the drawing, labelled with the shade name and its finish, with `aria-pressed` true while that shade is one of the three.",
    "Pressing with Enter or Space leaves the mark near the middle of the pan; a pointer leaves it where it landed, so both routes do the same job.",
    "The trio in the caption is a polite live region, so the new set of three names is read out after each press.",
    "When reduced motion is requested the dent and the swipe appear complete, no dust is thrown and the automatic tour of the pans is off; the lamp follows the pointer only.",
  ],
  faqs: [
    {
      question: "How do I read which three shades were picked?",
      answer: "The `trio` state is an array of three indexes into `pans`, oldest slot replaced first. Map it to names or product ids when you submit, or lift it to a parent by passing the state in as props.",
    },
    {
      question: "Why are there two canvases?",
      answer: "The case, tins, powder texture, finished fingerprints and finished swipes do not change from frame to frame, so they are painted once into a hidden canvas. Each frame copies that picture and adds only the lamp bloom, the flecks, any dust in the air and whatever is still animating. A press repaints the hidden canvas once.",
    },
    {
      question: "How do the flecks twinkle?",
      answer: "Every shimmer and metallic pan owns a fixed scatter of points, each with a random phase. The brightness of a point is a cosine of its phase plus the lamp position, raised to a high power, so most are dark and a few flare sharply, and a small move of the lamp hands the flash to different points.",
    },
    {
      question: "Can a shade be picked twice or unpicked?",
      answer: "Pressing a shade that is already on the card leaves a fresh fingerprint and redraws its swipe without using another slot. There is no unpick: a fourth shade pushes out the oldest. Smooth the pans clears the fingerprints and leaves the trio alone.",
    },
    {
      question: "Will the pans be big enough to tap on a small phone?",
      answer: "At 360 pixels wide each pan button is about 54 pixels across with a gap between neighbours, above the usual 44 pixel guideline. The buttons are sized in percentages of the drawing so they track the pans at any width.",
    },
  ],
  related: [
    "lipstick-shade-picker-with-a-bullet-that-twists-out-of-a-lacquer-and-gold-case-and-swipes-a-swatch-beside-it",
    "gold-powder-compact-that-opens-on-a-sprung-hinge-to-a-mirror-reflecting-a-portrait-over-embossed-pressed-powder",
    "riveted-swatch-deck-photo-carousel-that-fans-portraits-round-a-brass-pin",
  ],
  tags: ["eyeshadow", "palette", "shade picker", "canvas", "beauty", "swatches", "product selector"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
