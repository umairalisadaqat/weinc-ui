const meta = {
  slug: "clear-acrylic-id-passes-in-a-slotted-block-that-lift-out-and-turn-with-neon-edges-and-a-floating-print",
  category: "animated-cards",
  name: "Clear Acrylic ID Passes in a Slotted Block That Lift out and Turn, with Neon Edges and a Floating Print",
  keyword: "3d id badge card react",
  title: "React 3D ID Badge Cards in Clear Acrylic | We.Inc",
  description: "ID badges cut from clear acrylic stand in a slotted block and the one you pick lifts out and turns to face you. Free React and Tailwind code, or HTML.",
  intro: "Three event passes cut from thick clear plastic, standing at an angle in diagonal slots in a brushed aluminium block on a dark blue stage. Each has a portrait printed on the back of the sheet and the event name, role and person's name printed in white on the front, so the lettering floats a sheet's thickness above the photograph and slides across it as the pass turns. The cut edges glow lime, ice blue or orange the way fluorescent sheet does, a clear margin runs round the print with a faint mirror image of it bent into the edge, and there is a strap slot at the top. One pass is always lifted out: it rises on a spring, swings round to face you and rocks slowly, while its empty slot shows in the block and its colour fades from the metal underneath. The scene picks the next pass by itself every few seconds and leans a little with the pointer. On a phone the whole block is scaled down to the width.",
  useWhen: [
    "A conference, festival or meetup page introduces speakers or crew and wants more presence than a row of avatars.",
    "A team page for a studio shows a small number of people, one in focus at a time.",
    "A membership or ticket tier picker where each option is an object the visitor picks up.",
    "A portfolio wants to show badge, signage or acrylic print work as it looks in the hand.",
  ],
  customize: [
    "People are the `passes` array: `name`, `role`, `no`, the `photo` with its `alt`, and `at`, which is the `object-position` used to frame the face. `tone` shows until the photograph loads.",
    "`edge` on each pass is the sheet colour. It tints the stacked outlines, the bevel on the front and the glow in the slot, so one hex value recolours the whole object.",
    "`THICK` is the sheet thickness and also how far the white ink floats above the print. `RIM` and `TOP` are the clear margins, and `BW` and `BH` the pass size.",
    "`REST` is the angle passes sit at in the block, `LIFT` is how high the chosen one rises and `HOLD` is how long it stays up when the scene is playing by itself.",
    "The block is `BLOCK` for its size plus two gradients, one on the top and one on the front. `event` holds the two strings printed on every pass and on the block.",
  ],
  accessibility: [
    "Each pass is a real button with `aria-pressed`, and its label gives the name, role and number and says whether it is lifted. Tab moves along the block and Enter or Space lifts a pass.",
    "The portrait keeps its own alt text. The mirrored copies in the margins are background images and the shadow copy of the lettering is hidden, so nothing is read twice.",
    "With reduced motion the chosen pass is drawn lifted with no travel, it does not rock, the scene does not lean with the pointer and nothing changes until a pass is pressed.",
    "The self-playing cycle stops for nine seconds after any press so it never takes a pass away from someone who has just chosen it.",
  ],
  faqs: [
    {
      question: "How is the thickness of the plastic drawn?",
      answer: "Between the back and the front of each pass sit seven empty rounded rectangles, two pixels apart, each with only a coloured border. Face on they hide behind one another. As the pass turns inside a `preserve-3d` parent the borders separate and read as one solid, glowing edge that follows the rounded corners.",
    },
    {
      question: "Why does the name seem to float above the photograph?",
      answer: "Because it does. The photograph is on a layer pushed back by half of `THICK` and the white lettering is on a layer pulled forward by the same amount. A blurred dark copy of the lettering lies one pixel in front of the photograph as its shadow. When the pass rotates the browser moves the three layers by different amounts, which is the parallax you see in a real printed sheet.",
    },
    {
      question: "What is the faint picture in the clear margin?",
      answer: "Thick acrylic bends light at a cut edge, so you see a squeezed mirror of whatever is next to it. Three narrow strips sit in the side and bottom margins, each holding a second copy of the portrait flipped with `scaleX(-1)` or `scaleY(-1)` and lined up so the flip happens exactly at the edge of the print.",
    },
    {
      question: "Can I show more than three passes?",
      answer: "Yes, add entries to `passes`. The slots and passes are spaced by `GAP` from the centre of the block, so widen `BLOCK.w` by one `GAP` for each extra pass and change the two places that use `i - 1` to centre the row on the new count.",
    },
    {
      question: "Does the lifted pass pass through the block?",
      answer: "No. Every pass stands with its bottom edge on the top face, over a dark slot drawn at the same angle. Lifting moves it straight up, so no two surfaces ever cross and the browser never has to split a layer to sort them.",
    },
  ],
  related: ["engraved-steel-membership-card-that-turns-on-its-edge-and-catches-a-fixed-lamp-in-its-lettering", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["card", "badge", "acrylic", "3d", "portrait", "team", "pass"],
  height: 680,
  section: true,
  interactive: true,
};

export default meta;
