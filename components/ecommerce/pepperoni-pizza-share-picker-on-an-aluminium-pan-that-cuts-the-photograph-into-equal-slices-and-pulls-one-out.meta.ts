const meta = {
  slug: "pepperoni-pizza-share-picker-on-an-aluminium-pan-that-cuts-the-photograph-into-equal-slices-and-pulls-one-out",
  category: "ecommerce",
  name: "Pepperoni Pizza Share Picker on an Aluminium Pan That Cuts the Photograph into Equal Slices and Pulls One out",
  keyword: "react pizza slice quantity picker",
  title: "React Quantity Picker That Slices a Pizza | We.Inc",
  description: "Quantity picker where one overhead pizza photograph on an aluminium pan is cut into equal slices as the head count changes. Free React and HTML to copy.",
  intro: "A single overhead photograph of a pepperoni pizza, cropped to its crust and lying on a drawn aluminium pan on a cream table. The plus and minus buttons underneath set how many people are sharing. Each press closes the pie, cuts it into that many equal wedges and lets them spring a few pixels apart one after another, while one wedge slides further out with a longer shadow as the slice that is yours. The line between the buttons works out the price of a slice. Press any other wedge and that one comes out instead. On a phone the pan and pie shrink together as one object and the buttons stay full size below it.",
  useWhen: [
    "A pizzeria or takeaway order page wants splitting the bill to be the fun part of choosing a pie.",
    "A group booking or shared gift needs a head count control that shows straight away what each person gets.",
    "You sell something round by the portion, such as a tart, a cheesecake or a tortilla, and have one good photograph from above.",
    "A landing page for a food brand wants one tactile object in the middle of a quiet screen and no supporting copy.",
  ],
  customize: [
    "Everything about the product is in the `pizza` object: `name`, `price`, `currency`, the smallest and largest head count in `min` and `max`, and the count shown first in `start`.",
    "To use your own picture, set `photo.src` and then `cx`, `cy` and `r`: the centre of the food and its radius, each as a fraction of the picture's width. Shave `r` down slightly if table shows at the rim.",
    "`GAP` is the space between cut slices, `PULL` is how much further the chosen slice travels and `NUDGE` is the lift under the pointer. `STIFF` and `DAMP` set how much the wedges bounce when they land.",
    "`DEMO` lists the head counts the piece tries by itself and `HOLD_MS` is the pause on each. Empty the list to keep it still until someone presses a button.",
    "The table is `bg-[#ebe4d5]` plus the radial gradient over it, and the metal comes from the `BRUSHED` conic gradient. Swap its greys for warm browns and the pan reads as a wooden board.",
  ],
  accessibility: [
    "The two round controls are real buttons named for what they do, they disable at either limit, and the sentence between them is a polite live region so the new head count and slice price are read out.",
    "Every wedge is a button with `aria-pressed` and a label giving its number. Tab reaches them in clockwise order and the focused wedge lifts and shows a white and blue band, because an ordinary outline would be cut off by the wedge shape.",
    "The photograph is described once through a visually hidden image. The pan, oil stain and crumbs carry no meaning and are hidden from assistive technology.",
    "With reduced motion the timer is off and a new count is drawn already cut, with no closing or springing.",
  ],
  faqs: [
    {
      question: "How is one photo cut into slices without an image editor?",
      answer: "Each wedge is a square element the size of the whole pie with the same photograph as its background. A `clip-path` polygon, built by the `wedge` function from the centre and a run of points along the rim, hides everything outside that wedge. Moving a wedge is then an ordinary `translate` along the line through its middle.",
    },
    {
      question: "Why do the slices have shadows that follow their shape?",
      answer: "A box shadow would be clipped away with the rest of the square. The shadow is instead a `drop-shadow` filter on an unclipped wrapper around each wedge, which the browser draws from the visible pixels only. Its offset and blur grow with how far the wedge has travelled, so the pulled slice looks higher off the pan.",
    },
    {
      question: "What happens to the chosen slice when the count changes?",
      answer: "The choice is stored as a compass angle, not as a slice number. After every cut the code looks up which wedge now covers that angle and pulls it, so your slice stays on the same side of the pie whether it is cut into three or eight.",
    },
    {
      question: "Can it cut into more than eight?",
      answer: "Yes, raise `pizza.max`. The component always renders that many wedge elements and hides the spare ones, so twelve or sixteen is fine. Past that the wedges become too thin to press comfortably on a phone.",
    },
    {
      question: "Does the animation keep running off screen?",
      answer: "The frame loop checks an intersection observer and the page visibility flag and skips all work when the pan is out of view or the tab is hidden. In view it moves at most eight elements using transforms and one filter each.",
    },
  ],
  related: ["matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches", "shoe-size-foot-gauge-selector-with-a-sliding-steel-toe-bar-engraved-scales-read-through-cursor-windows-and-a-knurled-width-knob", "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes"],
  tags: ["pizza", "quantity", "stepper", "photo", "clip-path", "spring", "food", "ecommerce"],
  height: 783,
  section: true,
  interactive: true,
};

export default meta;
