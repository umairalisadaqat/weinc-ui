const meta = {
  slug: "shoe-size-foot-gauge-selector-with-a-sliding-steel-toe-bar-engraved-scales-read-through-cursor-windows-and-a-knurled-width-knob",
  category: "ecommerce",
  name: "Shoe Size Foot Gauge Selector with a Sliding Steel Toe Bar, Engraved Scales Read Through Cursor Windows and a Knurled Width Knob",
  keyword: "react shoe size selector",
  title: "React Shoe Size Selector as a Foot Gauge | We.Inc",
  description: "Shoe size picker drawn as a shop fitting gauge: drag the toe bar along the plate and read size and length through its windows. Free React and HTML code.",
  intro: "This is the measuring plate from a shoe shop floor, used as a size picker. A black enamel plate with a polished edge carries two painted scales: European sizes from 36 to 46 along one side and foot length in centimetres along the other, spaced so the two always agree. A brushed steel bar lies across the plate with a small window over each scale and a red hairline in each window. Drag the bar and it catches at every whole size the way a detent would, then settles with a short spring. The bright band on the steel shifts as the bar travels because the lamp stays where it is. A knurled knob in a short slot beside the heel cup sets narrow, regular or wide. The reading is repeated as a sentence under the plate. On a phone the plate stands upright with the heel at the bottom and every figure is turned to stay readable.",
  useWhen: [
    "A footwear product page wants a size control with more presence than a grid of small numbered squares.",
    "A fit finder or size guide needs to show that a size and a foot length in centimetres are the same measurement.",
    "A shop sells made-to-measure boots, skates or cycling shoes where width is chosen alongside length.",
    "A landing page for a shoe brand wants one object that visitors can handle before they scroll.",
  ],
  customize: [
    "`FIRST` and `LAST` set the size range. Each extra size needs 38 more pixels of plate, so raise `LEN` by `STEP` for every size you add.",
    "`footCm` converts a size to the foot length printed under the plate and drives the centimetre scale. Replace its formula to match your own size chart.",
    "`widths` holds the stops for the knob, each with a one-letter `key` painted beside the slot and a spoken `name`. Delete the second radiogroup and the `knob` drawing if you sell one width.",
    "`HAIR` colours both hairlines and the dot on the knob. The stage colour is the `bg-[#d9a62e]` class and its gradient on the outer `div`.",
    "The pair `260` and `21` in the frame loop is the spring that seats the bar. A damping of 32 removes the overshoot entirely.",
  ],
  accessibility: [
    "Sizes are native `input type=\"radio\"` elements sharing one `name` in a group labelled \"Shoe size\", so Tab enters the group and the arrow keys step through sizes with no script.",
    "Width is a second radio group labelled \"Width\" with its own three radios, reached with one more press of Tab.",
    "The canvas and the drag surface are hidden from assistive technology. The paragraph beneath is a polite live region that reads the size, foot length and width after each change.",
    "With reduced motion a press moves the bar straight to the nearest size without a spring or a drag animation.",
  ],
  faqs: [
    {
      question: "Are the size and centimetre scales really aligned?",
      answer: "Yes. A European size counts Paris points, each two thirds of a centimetre of last length, and the component assumes the foot is 1.5 cm shorter than the last. Both scales are placed from that one formula, so the hairline in the lower window crosses the correct length for the size in the upper one.",
    },
    {
      question: "How does the bar feel like it clicks into each size?",
      answer: "During a drag the bar does not track the pointer exactly. A sine wave with a period of one size is subtracted from the pointer position, which makes the bar linger at a mark and then hurry to the next. On release a spring carries it to the nearest whole size.",
    },
    {
      question: "How does it turn upright on a phone?",
      answer: "Everything is drawn in the plate's own coordinates, with one axis running heel to toe. Below 700 pixels a single rotation is applied before drawing, pointer positions are converted back the same way, and each number is counter-rotated so it reads normally.",
    },
    {
      question: "Can I show UK or US sizes?",
      answer: "Change the label passed to the `text` call that paints \"EU\", set `FIRST` and `LAST` to your range and rewrite `footCm` for that system. If the range includes half sizes as real choices, build `sizes` in steps of 0.5 and halve `STEP`.",
    },
    {
      question: "Where do I read the chosen values?",
      answer: "`sizes[size]` is the selected size number and `widths[width].name` is the width. Both are ordinary React state, so they can be lifted to a parent or placed in hidden form fields next to an add-to-basket button.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes"],
  tags: ["size", "selector", "radio", "slider", "shoes", "steel", "canvas", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
