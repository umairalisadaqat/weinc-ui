const meta = {
  slug: "corrugated-cardboard-parcel-with-printed-paper-tape-that-peels-back-and-four-flaps-that-fold-open-over-a-folded-jumper",
  category: "ecommerce",
  name: "Corrugated Cardboard Parcel with Printed Paper Tape That Peels Back and Four Flaps That Fold Open over a Folded Jumper",
  keyword: "css 3d cardboard box unboxing animation",
  title: "React 3D Unboxing Animation: Cardboard Parcel | We.Inc",
  description: "Unboxing animation in CSS 3D: printed tape peels off a carton, the flaps fold open and tissue parts over a jumper. Copy the React code or HTML free.",
  intro: "A brown shipping carton stands on a slate blue table, seen from above its near corner. It opens the preview already unpacked: the two far flaps stand up, the two near ones hang down, white tissue is bunched against the ends and a marigold cable knit lies inside with a cream paper band round it. A few seconds later it packs itself. The tissue spreads back, the short flaps fold in, the long flaps follow and bounce as board does, and a strip of cream paper tape printed in red rolls across the seam and down the end wall. Then the tape lifts from that wall, folds back on itself, curls and is pulled off to lie on the table, and the box opens again. Every flap has thickness with a fluted cut edge, and the courier label, handling marks and red sticker are all type and shapes, not pictures. On a phone the whole carton scales down as one object and the button stays full size.",
  useWhen: [
    "An order confirmation or thank you page wants to show the parcel being packed while the customer reads their receipt.",
    "A subscription box or gift service needs a hero object that opens to show this month's contents.",
    "A clothing or homeware shop wants an unboxing moment on a product page without filming one.",
    "A returns page explains how to repack an item, and the sealing half of the loop does the explaining.",
  ],
  customize: [
    "All the wording sits in the `parcel` object: `tape` is the repeating line printed along the tape, `to`, `route` and `bay` fill the courier label, and `maker`, `item` and `detail` are set on the paper band. `photo` is what lies in the box and its `tone` is shown until the picture arrives.",
    "`W`, `D` and `H` are the carton's length, width and height. The flaps take their size from `D`, so a wider box gets longer flaps without further edits. `FILL` is how high the contents sit.",
    "`BACK_OPEN`, `LEFT_OPEN`, `FRONT_OPEN` and `RIGHT_OPEN` are the angles each flap rests at when open. Values over 180 make a flap hang below the rim.",
    "`KRAFT` and `KRAFT_IN` colour the outer and inner liner, `RED` is the ink on the tape and the sticker, and `TAPE_PAPER` is the tape itself. The table is `bg-[#1b3140]` with a radial gradient over it.",
    "The order of events is the list of `at(...)` calls inside `play`. Raise the numbers to slow the packing down, or change the two waits in the demo timer to hold each state for longer.",
  ],
  accessibility: [
    "One real button under the carton opens or seals it. It carries `aria-pressed` and its text changes between Open the box and Tape it shut, so the state is never shown by the drawing alone.",
    "Clicking the carton does the same thing as the button, as a convenience for pointer users, and nothing is reachable only that way.",
    "The photograph inside has alt text. The tape, tissue, shadows and handling symbols are marked as decoration, while the label and band text stay readable because they are real text.",
    "With reduced motion the carton is drawn open and still, the timer never starts, and the button swaps between the sealed and open pictures with no travel.",
  ],
  faqs: [
    {
      question: "How do the flaps get their thickness?",
      answer: "Each flap is a small group of six flat elements in a `preserve-3d` parent: a printed outer face, an inner face set back by `T` pixels, and four edge strips stood at right angles. The strips carry a repeating gradient of thin dark and light lines, which is what the wavy middle layer of corrugated board looks like where it has been cut.",
    },
    {
      question: "Why do the short flaps close before the long ones?",
      answer: "That is how a regular slotted carton is packed: the end flaps go down first and the long flaps cover them and meet in the middle. The long flaps are also hinged `T` pixels higher so they rest on top of the short ones instead of passing through them.",
    },
    {
      question: "How does the tape peel?",
      answer: "One value, `peel`, runs from 0 to 1. The stuck part of the strip is trimmed with a `clip-path` that follows it, and a second piece is hinged at the trim line. That piece starts hanging down the end wall, swings up and over as the value rises, grows as more tape comes free and bends a second time near its tip to make the curl.",
    },
    {
      question: "Is the cardboard texture an image file?",
      answer: "No. The fibre and the uneven tone come from two small inline SVG noise filters used as background images, and the faint ribs are a repeating gradient laid across them. The crumpled tissue is a third filter that lights a noise field from one side. Nothing is downloaded apart from the photograph.",
    },
    {
      question: "Can I stop it looping and open it once on scroll?",
      answer: "Yes. Remove the demo timer effect, start every motion value at 0 and `open` as false, then call `play(true)` from an intersection observer or framer-motion's `useInView` when the section comes into view.",
    },
  ],
  related: [
    "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes",
    "paper-shopping-bag-that-catches-boxed-products-bulges-leans-and-flexes-its-rope-handles",
    "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches",
  ],
  tags: ["3d", "box", "parcel", "cardboard", "unboxing", "tape", "shipping", "ecommerce"],
  height: 766,
  section: true,
  interactive: true,
};

export default meta;
