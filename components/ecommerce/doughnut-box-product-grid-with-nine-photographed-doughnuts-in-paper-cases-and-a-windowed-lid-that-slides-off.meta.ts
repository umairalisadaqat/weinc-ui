const meta = {
  slug: "doughnut-box-product-grid-with-nine-photographed-doughnuts-in-paper-cases-and-a-windowed-lid-that-slides-off",
  category: "ecommerce",
  name: "Doughnut Box Product Grid with Nine Photographed Doughnuts in Paper Cases and a Windowed Lid That Slides off",
  keyword: "react product grid box builder",
  title: "React Product Grid as a Doughnut Box Builder | We.Inc",
  description: "Product grid drawn as a bakery box: photographed doughnuts in paper cases, a windowed lid that slides off and a running total. Free React and HTML code.",
  intro: "A white card bakery box on a yellow table, seen from straight above. Inside, two pairs of card strips divide it into nine compartments, and each one holds a fluted paper case with a real photographed doughnut sitting on a pink or blue paper round. Press a doughnut and it springs up out of its case, turns a few degrees and throws a longer shadow, which marks it as picked. The line under the box counts what is picked and adds up the price. The raspberry lid has a cellophane window with streaks of glare and rests beside the box, and pressing it slides it back over the top so the doughnuts show through the film. On a phone the box fills the width and the lid slides down below it instead of to the side.",
  useWhen: [
    "A bakery, chocolatier or sweet shop sells a build-your-own box and wants the choosing to happen in the box itself.",
    "You have a small fixed range, nine or so items, that suits a square grid better than a scrolling list.",
    "A gift or sample set needs a multi-select where picked items are obvious at a glance without ticks or borders.",
    "A bright landing page wants one playful object in place of a row of product cards.",
  ],
  customize: [
    "The `doughnuts` array holds each `name`, `price`, the `x` and `y` of its centre in the shared photograph and the `paper` colour shown before the picture arrives. `CROP` is how much paper is kept round every one.",
    "To use separate pictures, give each entry its own address and set it as that button's `backgroundImage` in place of the shared `PHOTO`, with the centre at 0.5 and half the picture's height over its width.",
    "`shop.name` and `shop.line` are printed on the two bands of the lid, and `LID_RED` is its card colour. `WINDOW` is the width of card left round the cellophane.",
    "`START` lists what is lifted on load. `DEMO` is the order the piece presses things by itself, where `-1` means close and reopen the lid, and `STEP_MS` is its pace.",
    "Box size comes from `OUT`, `RIM` and `DIV`, with `DISC` and `CASE` for the paper round and the fluted case. The table is `bg-[#f1c84f]` and the gradient laid over it.",
  ],
  accessibility: [
    "Each doughnut is a toggle button with `aria-pressed` and a label carrying its name, its price and whether it is in the box, so the grid can be filled with Tab and Space alone.",
    "The lid is a button with `aria-expanded`. While it covers the box the doughnut buttons are disabled, so focus cannot land on something hidden under card.",
    "The count and total are in a polite live region together with the name of the doughnut last pointed at or focused, which is also how a sighted keyboard user reads the names.",
    "Reduced motion stops the self-running demo and makes the lid and the doughnuts change state without springs.",
  ],
  faqs: [
    {
      question: "How do nine products come from a single image?",
      answer: "The photograph is a flat lay of nine doughnuts on coloured paper. Every button is a circle that uses it as a background, sized so one doughnut fills the circle and positioned from that doughnut's `x` and `y`. One download therefore covers the whole grid, and the real shadow under each doughnut comes along for free.",
    },
    {
      question: "How is the window in the lid see-through?",
      answer: "The lid has no fill of its own. A rounded element marks the window and casts a very large solid `box-shadow` in the card colour, which an `overflow-hidden` parent trims to the lid's outline. That leaves a true hole, and a gradient of white streaks over it stands in for the film.",
    },
    {
      question: "Why does the lid's shadow not darken the doughnuts through the window?",
      answer: "The shadow is a `drop-shadow` filter, which is traced from the pixels that are actually painted. Since the window is a hole, the shadow follows the card frame only.",
    },
    {
      question: "Can the box hold six or twelve?",
      answer: "The positions are worked out from the index with three to a row, so six items give a two row box once the outer height is shortened to match. For four columns change the three in the `CELL`, `col` and `row` lines to four and add a third divider.",
    },
    {
      question: "How do I send the picked items to a cart?",
      answer: "`chosen` is an array of indexes into `doughnuts`. Map it to your product ids in a submit handler, or lift the state to a parent and pass it down, and add a checkout button next to the total line.",
    },
  ],
  related: ["pepperoni-pizza-share-picker-on-an-aluminium-pan-that-cuts-the-photograph-into-equal-slices-and-pulls-one-out", "sushi-conveyor-product-carousel-with-photographed-platters-that-glide-past-on-a-belt-and-lift-off-onto-a-black-counter"],
  tags: ["product grid", "box", "lid", "doughnut", "multi-select", "photo", "spring", "food"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
