const meta = {
  slug: "watercolour-pan-tin-colour-picker-with-a-sable-brush-that-loads-a-pan-and-blooms-a-wash-into-cotton-paper",
  category: "inputs",
  name: "Watercolour Pan Tin Colour Picker with a Sable Brush That Loads a Pan and Blooms a Wash into Cotton Paper",
  keyword: "watercolour colour picker react",
  title: "React Colour Picker as a Watercolour Tin | We.Inc",
  description: "Colour picker shaped like a watercolour tin: choose a pan and a sable brush loads it, then blooms a wash into cotton paper. Free React and HTML to copy.",
  intro: "A swatch picker dressed as a travel watercolour set. An enamelled tin lies open with twelve half pans below and three stained mixing wells in the lid, a red-handled round brush waits beside it, and a taped-down sheet of cold-pressed paper carries a single wash. Choose a pan and the brush swings over, works the cake until it shines, crosses to the paper and touches it. The new colour then spreads through the wet wash from that point with a ragged front, pushing a darker ring of pigment ahead of it, before the sheet dries a shade lighter and a pencilled note names the colour. The pans are a real radio group placed exactly over the drawing. On phones the tin sits above the paper and the pans grow to thumb size.",
  useWhen: [
    "A product page needs a colour choice of ten or so named shades and plain round swatches would feel flat.",
    "A stationery, craft or illustration brand wants its accent colour picker to look like the tools it sells.",
    "A journaling or mood app asks for a colour of the day and the act of choosing should feel calm.",
    "An invitation or card builder lets a customer pick the ink of a design from a short curated list.",
  ],
  customize: [
    "`pans` holds the colours in reading order. Each `rgb` is the tone of one wash on white paper and each `name` is both the accessible label and the pencilled note. Keep the count a multiple of `COLS`.",
    "`START` is the index painted when the page loads, and `DEMO` is the order the brush follows before a visitor makes a choice.",
    "Bloom speed is the `5` seconds in `bloom + dt / 5`, and drying time is the `3.2` beside it.",
    "The ragged front comes from `0.6 + 0.5 * vn(...)` in `startBloom`. Bring the second number down to 0.1 for a near circular spread.",
    "The table colour is `bg-[#a9b5a2]` with a paler radial centre on the outer element. A warm grey or a dusty blue both keep the white paper bright.",
  ],
  accessibility: [
    "The twelve pans are buttons with `role=\"radio\"` inside a `radiogroup`, each labelled with its pigment name, so the picker is complete without the canvas.",
    "One radio is in the tab order. Left and Right step through the pans, Up and Down jump between the two rows, Home and End go to the first and last pan.",
    "The name and hex line below is an `output` that becomes a polite live region once a person has chosen, so the automatic demo never interrupts a screen reader.",
    "With reduced motion the brush stays where it is and the sheet simply shows the chosen colour as a finished dry wash.",
  ],
  faqs: [
    {
      question: "How is the wet-in-wet bloom made without a fluid solver?",
      answer: "Every cell of a small grid gets an arrival time: its distance from the point the brush touched, stretched and squeezed by smooth noise. A front grows outward over about five seconds and each cell switches from the old pigment to the new one as the front passes, with extra density right on the front to draw the darker ring a real bloom leaves.",
    },
    {
      question: "Why does the paint look like it sits in the paper instead of on it?",
      answer: "The wash is not painted as a colour. It is stored as how much red, green and blue light the pigment lets through and is multiplied onto the paper texture, so the tooth of the sheet shows through. A second grey layer darkens the valleys of the paper and the outer edge, where pigment collects as water dries.",
    },
    {
      question: "How do I read the selected colour?",
      answer: "`sel` is the index of the chosen pan. Use `pans[sel].rgb` or the `hexOf` helper, and call your own handler from `choose` to pass the value to a form or a theme.",
    },
    {
      question: "Can I show more than twelve colours?",
      answer: "Add a third row by giving `pans` eighteen entries and raising the pan area: the tin height is worked out from `ph * 2`, so change that 2 to 3 in `tinH` and in the `halves` list. On phones a third row makes the piece about sixty pixels taller.",
    },
    {
      question: "Is the paper texture an image file?",
      answer: "No. The sheet is generated when the component mounts from three octaves of value noise, lit from the upper left, with a torn deckle edge cut from the same noise. Nothing is downloaded, which also means the texture stays sharp on high density screens.",
    },
  ],
  related: ["oil-paint-tube-colour-mixer-that-squeezes-beads-onto-an-enamel-tray-for-a-palette-knife-to-blend", "photo-gallery-on-a-cotton-paper-sheet-where-each-portrait-blooms-in-like-ink-through-wet-fibres"],
  tags: ["colour picker", "watercolour", "canvas", "radio group", "swatches", "paper", "skeuomorphic"],
  height: 728,
  interactive: true,
};

export default meta;
