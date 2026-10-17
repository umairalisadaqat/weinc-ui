const meta = {
  slug: "cheese-wheel-pie-chart-on-a-marble-board-with-wedges-that-slide-out-and-toothpick-flag-labels",
  category: "dashboard",
  name: "Cheese Wheel Pie Chart on a Marble Board with Wedges That Slide Out and Toothpick Flag Labels",
  keyword: "react 3d pie chart",
  title: "React 3D Pie Chart as a Cheese Wheel | We.Inc",
  description: "Pie chart drawn as a wheel of cheeses on a marble board: wedges slide out on a spring and paper flags carry the percentages. Free React and HTML code.",
  intro: "A pie chart you could put on a table. Five different cheeses are cut so that together they make one wheel, and the angle of each wedge is its share: a gouda in red wax, a pale alpine cheese, a blue, a cheddar in black wax and a green sage cheese. The wheel sits on a round marble slab, seen from the angle of someone standing at the counter. Click a wedge, or the matching pill underneath, and it slides out along its centre line on a spring, showing the cut faces with their holes, veins and flecks. A cocktail stick with a paper flag stands in every wedge and carries its percentage, and the flag wags as the wedge stops. Choosing the other data set re-cuts the wheel: the wedges grow and shrink until they add up again. The numbers are invented demo data and are repeated as text in the row of pills. On screens under 700 pixels the board is drawn smaller and the pills wrap onto several rows.",
  useWhen: [
    "A food, deli, restaurant or farm shop site wants to show a sales or menu split without a business-report look.",
    "You have five or fewer parts of a whole and one of them deserves to be singled out.",
    "A pitch page or yearly review needs one memorable chart that people will click on.",
    "You are teaching fractions or percentages and want a pie that behaves like food.",
  ],
  customize: [
    "`cheeses` holds one entry per wedge: `name`, the `rind` colour seen from above, the `paste` colour of the cut face, `gloss` from 0 (chalky) to 1 (wax) and a `kind` of filling: `holes`, `veins`, `flecks`, `crystal` or `crumb`.",
    "Each entry in `sets` has a `label` and one value per cheese. Values do not need to add up to 100. The wheel divides by their total, and the flag shows the number you typed.",
    "`E` is the camera angle: 1 looks straight down, 0.3 is nearly side on. `h` in `layoutFor` is how tall the wheel stands and `pull` is how far a chosen wedge travels.",
    "In the frame loop `170` and `17` are the stiffness and friction of the slide. Halve the friction for a wedge that bounces before it rests.",
    "The slab is painted in `build()`. Replace the three stops of `top` with browns for a wooden board, and delete the veining loop.",
  ],
  accessibility: [
    "The picture is a canvas hidden from assistive technology. Every wedge has a real `button` in the list below it that names the cheese and its percentage and reports `aria-pressed` when that wedge is out.",
    "The list is labelled with the data set and what the figures measure, and the two data set switches are buttons with `aria-pressed`.",
    "The status line becomes a polite live region once you use a control. While the demo cycles by itself it stays quiet.",
    "Reduced motion places wedges and flags straight in their final position, with the first wedge already out so the cut faces can still be seen.",
  ],
  faqs: [
    {
      question: "How is the wheel given depth with no 3D library?",
      answer: "Every point of the circle is squashed vertically by one factor, which is how a disc looks from a raised camera. Each wedge is then three painted parts: the cut faces that point at the viewer, the outer wall, and the top. Wedges are painted from the back of the board to the front, so nearer ones cover farther ones.",
    },
    {
      question: "Why does the wax look shiny and the blue cheese chalky?",
      answer: "The outer wall is drawn in narrow vertical strips, each lit by how squarely it faces the lamp. A strip also gets a sharp highlight scaled by that cheese's `gloss`. The top has a soft window reflection scaled the same way, and it drifts when the pointer moves. A gloss near zero leaves a matte rind with visible pores.",
    },
    {
      question: "How do the holes sit correctly on a slanted cut face?",
      answer: "Before a face is painted the canvas transform is set so that one unit across is the knife line from the centre to the rind and one unit down is the height of the wheel. Holes, veins and flecks are then drawn in that unit square and come out skewed and foreshortened with the face.",
    },
    {
      question: "Can one wedge be more than half the wheel?",
      answer: "It will draw, but a wedge wider than a half turn is no longer a simple convex shape, so the back-to-front ordering can let a neighbour show through at the centre. Keep the largest value under half the total, or split it in two.",
    },
    {
      question: "How many wedges can it take?",
      answer: "Five or six read well. With more, the flags start to overlap and thin wedges show too little of their cut face. Shorten the flag by lowering `fw` in `flag()` if you need a seventh.",
    },
  ],
  related: ["glass-test-tube-rack-bar-chart-with-dyed-liquid-that-rises-sloshes-and-settles-on-each-value", "strip-chart-recorder-line-chart-with-a-sprung-ink-pen-on-moving-grid-paper-and-two-data-sets"],
  tags: ["pie chart", "3d", "canvas", "cheese", "food", "data visualisation", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
