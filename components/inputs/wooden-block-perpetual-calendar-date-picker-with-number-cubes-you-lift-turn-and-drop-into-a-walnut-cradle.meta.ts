const meta = {
  slug: "wooden-block-perpetual-calendar-date-picker-with-number-cubes-you-lift-turn-and-drop-into-a-walnut-cradle",
  category: "inputs",
  name: "Wooden Block Perpetual Calendar Date Picker with Number Cubes You Lift, Turn and Drop into a Walnut Cradle",
  keyword: "wooden block calendar date picker react",
  title: "React Date Picker as a Wooden Block Calendar | We.Inc",
  description: "Date picker built as a perpetual calendar: maple number cubes and a month bar lift out of a walnut cradle, turn and drop back. Free React and HTML to copy.",
  intro: "A date picker shaped like the block calendar that sits on a shop counter. Two maple cubes carry the day in tall engraved numerals and a long maple bar underneath carries the month, all held in a dark walnut cradle. Nothing here is a flat picture: every block is a real box built from CSS 3D faces, wrapped in wood grain that is generated in the browser, so the top and the end grain come into view as the whole calendar leans towards the pointer. Changing the date lifts a cube clear of the cradle, rolls it a quarter turn so the new numeral comes up from underneath, and drops it back with a small bounce while its shadow tightens. The month bar slides forward out of its slot before it turns. On a phone the calendar shrinks to fit a 360 pixel screen and the date is repeated in plain text below with two arrow buttons.",
  useWhen: [
    "A supper club, studio class or pop-up takes bookings for one date at a time and wants the choosing to feel like an object on the counter.",
    "A gift, homeware or toy shop needs a delivery date field that looks like something it would sell.",
    "A wedding or birthday page asks for a single day and month, where the year is always the next time that date comes round.",
    "A landing page needs one small showpiece control above the fold in place of a grid of numbered squares.",
  ],
  customize: [
    "`VENUE` and `NOTE` are the two halves of the small line under the date. `OPEN_ON` is the weekday the calendar opens on, counted from 0 for Sunday.",
    "The maple is the pair of colours passed to `wood(...)` for `maple`, `[190, 142, 88]` and `[240, 212, 166]`. Swap them for `[70, 40, 30]` and `[150, 96, 70]` to get cherry, and change the ink colour `#2a1608` to cream if the blocks go dark.",
    "`NUMERALS` is the font stack for the engraving. Any heavy face with lining figures works; keep `fontSize: 176` near nine tenths of the cube size `S`.",
    "`S`, `BAR` and `CHEEK_H` set the cube, the month bar and the height of the cradle sides in pixels. The three `scale-[...]` classes on the wrapper set how large the whole thing is at each screen width.",
    "Set `AUTOPLAY` to false to stop the calendar stepping a day at a time before anyone has touched it.",
  ],
  accessibility: [
    "The cubes together are one `spinbutton` named Day and the bar is a second named Month. Each reports its number, and the day also reads out the weekday and month as its value text.",
    "Up and Right move forward, Down and Left move back, Page Up and Page Down jump a week or a quarter, Home and End go to the ends. Day steps roll over into the next month.",
    "Keyboard focus draws a white band round the faces of the block that has it, because an outline cannot follow a shape that is turned in 3D.",
    "The Previous day and Next day buttons and the live text between them work without touching the blocks at all. With reduced motion the blocks change face without lifting or rolling and the calendar stops swaying.",
  ],
  faqs: [
    {
      question: "Why does a new numeral come up from underneath and not from the top?",
      answer: "The top of each cube is in view, so whatever is printed there cannot change without the viewer seeing it. The face underneath is hidden, so the next numeral is written there and rolled up to the front. Going back a day rolls the other way, because the numeral that was just on the front is the one now sitting on top.",
    },
    {
      question: "How is the wood made without image files?",
      answer: "A small function fills a canvas pixel by pixel when the component mounts. Stretched noise gives long grain with darker pores, and rings around a point far off the corner give end grain. The canvases become data addresses used as backgrounds, with a different offset on every face so no two faces match.",
    },
    {
      question: "Where does the year come from?",
      answer: "A block calendar has no year, so the picker works out the next time the chosen day and month occur, starting from today. That year decides the weekday in the readout and whether February has 29 days.",
    },
    {
      question: "How do I read the chosen date in my form?",
      answer: "The `pick` state holds the month and the day, and `date` is the matching Date object. Put its ISO string in a hidden input, or call your own handler in an effect that watches `pick`.",
    },
    {
      question: "Can visitors drag the blocks?",
      answer: "Yes. Dragging a cube up rolls it on and dragging down rolls it back, one step for every 34 pixels. A plain press on the right cube adds a day, on the left cube adds ten, and on the bar moves to the next month.",
    },
  ],
  related: ["moon-phase-dial-date-picker-with-an-enamel-day-ring-you-turn-and-a-cratered-moon-lit-for-that-night", "tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away"],
  tags: ["date picker", "perpetual calendar", "wooden blocks", "css 3d", "skeuomorphic", "booking", "spinbutton"],
  height: 720,
  interactive: true,
};

export default meta;
