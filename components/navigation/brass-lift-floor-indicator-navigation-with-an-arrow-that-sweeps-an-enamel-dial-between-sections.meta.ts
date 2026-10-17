const meta = {
  slug: "brass-lift-floor-indicator-navigation-with-an-arrow-that-sweeps-an-enamel-dial-between-sections",
  category: "navigation",
  name: "Brass Lift Floor Indicator Navigation with an Arrow That Sweeps an Enamel Dial Between Sections",
  keyword: "react elevator floor indicator navigation",
  title: "React Section Navigation: Lift Floor Indicator | We.Inc",
  description: "Section navigation drawn as an old lift indicator: a blued arrow sweeps an enamel scale from floor to floor. Copy the React code or the HTML version free.",
  intro: "The half-moon dial that used to sit above the doors of a hotel lift, used here as a set of tabs. A brushed brass plate carries an ivory enamel band with five floors fired into it, each with a section name beneath its numeral. Press a floor and the blued steel arrow sets off at the steady pace of a lift car, passes the floors in between and eases onto the mark. While it is moving, the Up or Down lamp on the base bar burns amber, and when it lands the numeral turns oxblood and the line under the dial changes to that section. The brushing on the brass is circular, so the highlights slide round the plate as your pointer crosses it. The dial is one canvas that shrinks with the screen, and the five press areas stay 44 pixels wide on a phone.",
  useWhen: [
    "A site has four to six top-level sections and the header can afford to be an object instead of a row of words.",
    "A hotel, an apartment building or an architecture practice wants navigation that looks like part of the building.",
    "A long single page is split into stacked chapters and you want moving between them to feel like going up and down.",
    "A step count or level picker in a game or a booking flow needs a display that shows the journey, not only the arrival.",
  ],
  customize: [
    "`floors` holds every stop. `mark` is the large numeral on the enamel, `name` the small word under it, and `note` the sentence shown beneath the dial. Four or six entries space themselves out.",
    "`SWEEP` is the angle in degrees from the first floor to the last. 128 suits five; widen it to 150 for six so the names do not crowd.",
    "`SPEED` is the car's travel rate in radians a second. At 1.15 the full run takes about two seconds. Use 2.5 if the dial drives real page changes and people should not wait.",
    "`LAMP` colours both direction lamps. `#7fd6a2` gives the green of a later, post-war installation.",
    "The stone wall behind is `bg-[#e6dfd2]` plus one `radial-gradient` on the root. Swap both for `#1a1512` tones to hang the dial on dark panelling.",
  ],
  accessibility: [
    "The canvas is hidden from assistive tech. Over each numeral sits a real `button` with `role=\"tab\"`, `aria-selected` and a spoken label such as Floor 2, Studio.",
    "Only the current floor is in the tab order. Right and Up go one floor higher, Left and Down one lower, Home and End jump to the ground and top floors.",
    "The text block under the dial is the `tabpanel` and a polite live region, so the destination is announced as soon as it is chosen, before the arrow gets there.",
    "With reduced motion the arrow is drawn already at the chosen floor, the lamps stay dark and the idle tour of the building never runs.",
  ],
  faqs: [
    {
      question: "Why does the arrow not use an ordinary spring?",
      answer: "A spring covers a long distance faster than a short one, which looks like a gauge needle. A lift car has one running speed. Here the pull toward the target is capped, and so is the velocity, so a trip of four floors takes four times as long as a trip of one. Only the last few degrees are eased, the way a car levels at the landing.",
    },
    {
      question: "How do I make a floor change the page content?",
      answer: "`floor` is plain React state holding the index of the chosen entry. Render your own sections from it in place of the two paragraphs inside the `tabpanel`, or call your router in `choose`. If each floor is a separate URL, turn the buttons into links and keep `aria-current` on the active one.",
    },
    {
      question: "What makes the brass look brushed and not flat?",
      answer: "Three layers. A conic gradient centred on the pivot gives the broad bright and dark wedges. Over it lies a cached image of about five hundred faint arcs of random strength, which is the grain. Then the mouldings and engraving are stroked twice, once dark and once pale and offset by a pixel, so each cut has a lit edge.",
    },
    {
      question: "Can the numerals be words or icons?",
      answer: "Words of two or three letters fit at the 34 pixel serif size. For anything longer, put a number in `mark` and the word in `name`, which is set in small capitals under the numeral and turned to follow the curve of the scale.",
    },
    {
      question: "Does the demo keep running while someone is using it?",
      answer: "No. The idle tour only starts once six seconds have passed without a press, and pointer movement over the piece pushes that back as well. It also stops when the dial scrolls out of view or the browser tab is hidden.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob"],
  tags: ["lift", "elevator", "brass", "dial", "tabs", "canvas", "navigation", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
