const meta = {
  slug: "letterpress-card-testimonials-in-webgl-pinned-with-brass-pins-to-a-linen-board-where-the-chosen-card-unpins-and-lifts-into-focus",
  category: "testimonials",
  name: "Letterpress Card Testimonials in WebGL Pinned with Brass Pins to a Linen Board Where the Chosen Card Unpins and Lifts into Focus",
  keyword: "webgl testimonial cards react",
  title: "React WebGL Testimonials on Pinned Letterpress Cards | We.Inc",
  description: "Free WebGL testimonial section: thick letterpress cards pinned to a sunlit linen board. The chosen card unpins and floats forward while the board falls soft.",
  intro: "Four thick cotton cards hang on a linen board, each held by a round brass pin and printed like letterpress stationery: a deep bitten initial inked in the colour of the painted edge, a ruled line, a name and a blind-pressed trade and town. Warm sun falls through a window with glazing bars and a little leaf shade, so every bite in the paper catches a highlight on one shoulder and a shadow on the other. Choosing a speaker pulls that card's pin out, lets the card peel off the board, swing round and float toward the camera on a spring, while the pin is pushed back into the empty spot. A second pass blurs the board by distance, so the lifted card is the only sharp thing in the frame and the quote, set large in normal page text on the left, reads cleanly over soft linen. On phones the board sits above the quote, and without WebGL a flat version of the same cards is drawn with CSS.",
  useWhen: [
    "A craft business, print studio or small maker wants client words to feel handmade rather than pulled from a review widget.",
    "You have a few short quotes and no portraits, and want typography and material to carry the section instead of faces.",
    "The page already uses warm, natural colours and a grid of rounded review boxes would break the mood.",
    "You want a quote section that moves on its own in a hero-sized slot but still reads as plain text to search engines and screen readers.",
  ],
  customize: [
    "Edit the `cards` array: `quote`, `name`, `trade` and `place` fill both the page text and the printed card, `edge` is the painted edge and initial ink, and `ink` is a darker shade used for text on the page so it keeps its contrast.",
    "Board, paper and ink colours are the `LINEN`, `PAPER` and `INKC` constants in the scene shader, written as linear colour. `SUN` sets the colour and strength of the window light, and `sun` in the effect sets where it comes from.",
    "`SLOTS` places each card on the board with its own tilt. The lifted position is `lift` inside `layout()`, with separate values for phone and desktop.",
    "`LIFT_SPRING` and `LIFT_DAMP` shape how the card arrives (lower damping gives more overshoot), `PIN_SPEED` sets how quickly the pin travels and `HOLD_MS` the pause before the next card is taken down.",
    "The bite depth is `D` in the card branch of the shader and the softness of the shoulders is the `blur(2.2px)` in `buildAtlas`. Raise `uMaxR` in the second pass for a stronger out-of-focus board.",
  ],
  accessibility: [
    "The quote, name and trade are real text in a `figure` with `blockquote` and `figcaption` inside a polite live region, so a new speaker is read out once. The canvas is hidden from assistive technology because it repeats that text.",
    "Previous and next buttons and a row of named card buttons with `aria-pressed` work by mouse, touch and keyboard, and the left and right arrow keys change cards when focus is inside the section.",
    "Automatic changes pause while the pointer or keyboard focus is inside. With reduced motion the cards jump straight to their resting places and the scene is drawn once per change instead of animating.",
  ],
  faqs: [
    { question: "How is the letterpress bite made?", answer: "Each card face is drawn once into a canvas atlas. One channel holds a blurred mask of all the type, which the shader treats as depth: it reads the slope of that mask next to each pixel and tilts the paper's surface normal, so the sun lights one wall of every letter and shades the other. A second channel marks where ink sits and a third says whether that ink is the edge colour or black." },
    { question: "Where does the depth of field come from?", answer: "The scene is drawn into a texture first, with the blur size for each pixel stored in the alpha channel from its distance to the focus plane. A second pass gathers 48 samples in a spiral and only accepts a sample if its own blur is large enough to reach the pixel, which keeps the sharp card from smearing into the soft board behind it." },
    { question: "Why does the pin come out before the card moves?", answer: "Each card runs a tiny state machine. The pin first rises to a held height, the card is only allowed to lift once the pin is clear, and halfway through the lift the pin is pushed back into the board. Going back, the order reverses, so the pin is never left floating over a card that is still pinned." },
    { question: "Is the quote readable by search engines?", answer: "Yes. The large quote and its credit are ordinary HTML beside the canvas. The cards only print each person's initial, name and trade, which repeat information already in the text." },
    { question: "Will it slow a laptop down?", answer: "The cards and pins are found with exact ray and box tests rather than a long march, and only shadows and contact shading step through the distance field. The canvas is capped at 1.6 million pixels and a pixel ratio of 1.5, lowers its own resolution if frames run long, and stops when it is off screen or the tab is hidden." },
  ],
  related: [
    "cork-board-testimonials-with-pinned-portrait-postcards-that-swing-unpin-and-turn-over-to-a-handwritten-note",
    "framed-portrait-testimonials-in-webgl-with-a-leaning-two-sided-frame-that-swings-on-its-corner-and-claps-back-onto-a-sunlit-wall",
    "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce",
  ],
  tags: ["testimonials", "webgl", "letterpress", "depth of field", "paper", "brass", "physics", "editorial"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
