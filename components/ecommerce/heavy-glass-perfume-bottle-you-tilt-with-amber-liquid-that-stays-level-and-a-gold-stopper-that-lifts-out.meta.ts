const meta = {
  slug: "heavy-glass-perfume-bottle-you-tilt-with-amber-liquid-that-stays-level-and-a-gold-stopper-that-lifts-out",
  category: "ecommerce",
  name: "Heavy Glass Perfume Bottle You Tilt with Amber Liquid That Stays Level and a Gold Stopper That Lifts Out",
  keyword: "perfume product hero react canvas",
  title: "React Canvas Product Hero: Perfume Bottle | We.Inc",
  description: "Perfume bottle on a canvas: tilt the thick glass and the amber liquid stays level and sloshes, while the gold stopper lifts out. Free React and HTML code.",
  intro: "A fragrance bottle standing on black stone, painted every frame on a canvas with no image files. The glass is a square shouldered block with a thick foot that soaks up the colour of the scent, a hard white streak down one side and a faint mirror image in the table. Drag the bottle sideways and it leans over on its bottom corner while the liquid keeps to the horizon. Let go and it drops back, rocks from corner to corner, and the surface swings and ripples until it calms. Press the gold cap, or the button under the stage, and the stopper rises on a spring with its glass rod and a drop hanging from the tip, and the caption swaps to the list of notes. Amber light that has come through the liquid lies on the table as a pool that shifts with the lamp. Below 640 pixels the two buttons move beneath the caption.",
  useWhen: [
    "A fragrance, spirits or skincare product page needs a hero object and you have no studio photography yet.",
    "You want visitors to handle the product for a second before they read the notes and the price.",
    "A launch page for a single scent should carry one quiet centrepiece on a dark background.",
    "A gift guide entry needs something richer than a packshot thumbnail.",
  ],
  customize: [
    "`scent` at the top holds the name and type printed on the glass, the size, the price and the `notes` line shown while the stopper is out.",
    "`FILL` is how full the bottle is from 0 to 1. Keep it under 0.8 so the surface never reaches the shoulder when the glass leans.",
    "The liquid colour is the list of hex stops passed to `hgrad` under the comment about the scent. Swap the ambers for `#0d3b2e` through `#3fd0a0` for a green juice, and change the pool colours in `draw` to match.",
    "`BW`, `BH`, `WALL` and `BASE` are the width, height, wall thickness and foot thickness of the glass. A `BASE` of 50 gives a very heavy foot.",
    "`LIFT` is how far the stopper travels. The rocking is the `13` (pull of gravity) and `-0.42` (bounce kept at each landing) in the frame loop.",
  ],
  accessibility: [
    "Both actions have real buttons under the stage: one lifts or seats the stopper and carries `aria-pressed`, the other gives the bottle a knock, so nothing depends on dragging.",
    "The notes line is a polite live region, which means a screen reader hears the notes when the stopper comes out.",
    "The canvas and the drag surface are hidden from assistive technology; name, size and price are plain text.",
    "With reduced motion the bottle stands upright, the stopper changes position at once and nothing plays by itself.",
  ],
  faqs: [
    {
      question: "How does the liquid stay level while the bottle leans?",
      answer: "The bottle is drawn in its own rotated frame. The surface is a line through the middle of the fill height whose slope is the tangent of the bottle angle minus the liquid's own angle, which undoes the rotation. That liquid angle sits on a spring and is kicked by every change in the bottle angle, which is where the slosh comes from.",
    },
    {
      question: "What makes it read as glass on a dark background?",
      answer: "Clear glass is mostly visible at its edges. The body is a dark, see-through fill with a bright outline, a narrow hard streak inset from one side, a soft slanted pane near the top and a second outline for the inner wall. The thick foot is filled with bands of the liquid colour, the way a heavy base gathers and returns light.",
    },
    {
      question: "Can I put my own bottle shape in?",
      answer: "The outline is one rounded rectangle helper called with separate top and bottom radii, used for the body, the cavity and the cap. Change the measurements for a taller or flatter flask. A curved silhouette would mean replacing that helper with your own path in the four places it draws the body.",
    },
    {
      question: "Why is there a second, hidden canvas?",
      answer: "The bottle is painted once per frame onto an off-screen canvas, then copied twice: flipped and faded for the reflection in the stone, and upright on top. That keeps the reflection exact without drawing every gradient a second time.",
    },
    {
      question: "Does dragging scroll the page on a phone?",
      answer: "The drag surface has `touch-none`, so a finger on the stage leans the bottle and the page stays put. The caption and buttons sit outside that surface and scroll normally.",
    },
  ],
  related: ["velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light", "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes"],
  tags: ["perfume", "glass", "liquid", "canvas", "product hero", "luxury", "physics"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
