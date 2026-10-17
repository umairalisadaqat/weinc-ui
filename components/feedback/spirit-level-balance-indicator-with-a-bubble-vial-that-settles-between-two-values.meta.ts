const meta = {
  slug: "spirit-level-balance-indicator-with-a-bubble-vial-that-settles-between-two-values",
  category: "feedback",
  name: "Spirit Level Balance Indicator with a Bubble Vial That Settles Between Two Values",
  keyword: "react balance indicator component",
  title: "React Balance Indicator: Spirit Level Bubble | We.Inc",
  description: "Status indicator drawn as a spirit level: the bubble runs uphill when the values drift apart and centres when they match. Free React code and HTML to copy.",
  intro: "A builder's level in orange anodised aluminium resting on an oak shelf that pivots on a steel bracket. Two numbers sit under its ends. When they are equal the shelf is flat and the bubble rests between the two black rings of the centre vial. Let one side pull ahead and that end of the shelf sinks, the bubble slides up towards the lighter end, overshoots a touch and settles. The vial is the part worth looking at: yellow-green spirit in a barrel-shaped glass tube, a pale bubble with a dark refracted rim, a hard white highlight along the glass and a bright patch on the floor of the tube where the bubble acts as a lens. Small upright vials sit in round ports near each end. Plus and minus buttons change either number, and pressing one end of the shelf makes it dip and spring back. On phones the tool is redrawn as a short torpedo level without the hand holes, and the two figures stay side by side.",
  useWhen: [
    "A support, sales or inventory view compares what came in with what went out and the question is simply whether they are keeping pace.",
    "A budgeting or time-tracking screen wants to show planned against spent without a red and green bar.",
    "A trades, joinery or renovation site wants a status widget in its own visual language.",
    "A workload page shows two people or two teams and needs a kind way to say that one is carrying more.",
  ],
  customize: [
    "`sides` names the two ends and gives their starting numbers. To drive it from data, call `show([left, right])` whenever your values change and delete the demo effect.",
    "`TILT_GAIN` decides how sharply the shelf reacts. At 40 a split of 55 to 45 leans four degrees. Lower it to 15 for values that are usually far apart.",
    "`LEVEL_BAND` is how close counts as level, as a share of full lean. 0.075 keeps the bubble inside the rings. The pill in the middle turns dark green on the same test.",
    "`ANODISE` is three stops of the body colour, light to dark. `[\"#4f8fe8\", \"#2d6cd0\", \"#1d4f9e\"]` gives a blue level. Rename `chamfer` stops to match.",
    "`SPIRIT` is the liquid from top to bottom of the tube. Keep the fifth stop the lightest, since that is the band of light on the floor of the vial.",
  ],
  accessibility: [
    "Both values are large text with their labels above them, and the verdict, either Level or which side leads and by how much, is written in the pill between them.",
    "The pill is a polite live region, so pressing a plus or minus button reads the new verdict aloud.",
    "All four buttons are 44 pixels across, have names like One more opened, and show an orange focus ring. The drawing itself takes no keyboard focus because it adds no information the text lacks.",
    "Reduced motion removes the self-running demonstration and the swing. The shelf and bubble are drawn directly at their resting place after each change.",
  ],
  faqs: [
    {
      question: "Which way should the bubble move?",
      answer: "Uphill. A bubble is the lightest thing in the tube, so it travels to the highest point, which is the end of the level that has risen. In this component the larger number weighs its end down, so the bubble ends up nearer the smaller number.",
    },
    {
      question: "How is the bubble's movement worked out?",
      answer: "Two springs in a chain. The shelf angle is pulled towards the lean that the two numbers call for and wobbles slightly as it arrives. The bubble is pulled towards the spot that the current angle calls for, with its own drag, so it lags the shelf and sloshes once. It stretches a little while moving fast and bumps softly off the end of the tube.",
    },
    {
      question: "Why does the shadow show through the holes?",
      answer: "The body is painted once into an off-screen image and the hand holes are erased from it with a destination-out fill. The wall shadow is made from that same image, so it has the holes too. Both are then drawn at the shelf's angle each frame.",
    },
    {
      question: "Can it compare more than two things?",
      answer: "Not well. A level answers one question about one pair. For three or more values place several of these in a row, each comparing an item against the average, or switch to a bar chart.",
    },
    {
      question: "Can I use the level without the shelf and bracket?",
      answer: "Yes. In `build`, remove the block that paints the oak, and in `draw` remove the bracket and pivot pin. Set `PT` to 0 in `layoutFor` so the body sits on the pivot line. The level then tilts in the air above its own shadow.",
    },
  ],
  related: ["brass-balance-scale-price-builder-with-feature-weights-and-coins-that-drop-until-the-beam-levels", "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target"],
  tags: ["spirit level", "balance", "status", "bubble", "canvas", "glass", "indicator", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
