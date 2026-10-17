const meta = {
  slug: "glass-test-tube-rack-bar-chart-with-dyed-liquid-that-rises-sloshes-and-settles-on-each-value",
  category: "dashboard",
  name: "Glass Test Tube Rack Bar Chart with Dyed Liquid That Rises, Sloshes and Settles on Each Value",
  keyword: "react liquid bar chart",
  title: "React Liquid Bar Chart in Glass Test Tubes | We.Inc",
  description: "Bar chart drawn as glass test tubes in a rack: dyed liquid climbs to each value, sloshes, bubbles and settles. Copy the React code or the HTML free.",
  intro: "A week of numbers shown as seven test tubes standing in a brushed aluminium rack. Each tube holds a different dye, and the height of the liquid against the enamel graduations is the value for that day. On load the tubes fill from empty with a short delay between neighbours, a few bubbles race to the surface, and the surface tips and rocks before it lies flat. Switching between this week and last week pumps every tube up or down to its new reading. Hover, tap or tab to a tube and it lifts a little way out of the rack while the line under the chart reads out that day. Sweep the pointer across the rack and the liquid in each tube you cross gets a knock. The figures are invented demo data and are also written out in a hidden table, so nothing depends on seeing the drawing. Below 700 pixels the rack is rebuilt narrower with thinner tubes, still seven across, and fits a 360 pixel phone.",
  useWhen: [
    "A small dashboard has one weekly figure, such as orders, bookings or sign-ups, and deserves more charm than grey rectangles.",
    "A science, brewing, skincare or food brand wants a chart that looks like it belongs in its own lab.",
    "You need a hero object for a reporting or analytics product page that visitors can poke at.",
    "A classroom or kids' learning site is teaching how a bar chart maps a number to a height.",
  ],
  customize: [
    "Put your own numbers in `sets`. Each entry has a `label` for its switch and one value per tube. Add a third entry and a third switch appears.",
    "`FULL` is the reading at the top graduation. Set it a little above your largest value so no tube ever brims over.",
    "`dyes` holds one hex colour per tube. Use a single colour seven times for a sober chart, or two alternating shades.",
    "`days` and `dayNames` are the short label stamped on the base and the long one read to screen readers. Change `UNIT` to name what is being counted.",
    "In the frame loop, `70` is the stiffness of the rise and `9.5` its damping. Raise the damping to 17 and the liquid stops overshooting.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Over each tube sits a real `button` whose label is the full day and its value, so the chart can be walked with Tab.",
    "The two data set switches are buttons with `aria-pressed`, and a visually hidden `table` repeats the seven values with row and column headers.",
    "The status line only becomes a live region after you touch a control, so the self-running demo never interrupts a screen reader.",
    "Reduced motion draws every tube at its final level with a flat surface and no bubbles, and switching data sets redraws once.",
  ],
  faqs: [
    {
      question: "How does the liquid get its slosh?",
      answer: "Each tube keeps two small simulations. The level is a weight on a spring pulled towards the value, so it overshoots slightly. The surface angle is a second spring that gets a shove whenever the level speeds up or slows down, when the tube is lifted, or when the pointer crosses it. The surface is drawn as a tilted ellipse on top of a tilted block of colour.",
    },
    {
      question: "Why does the glass look round when it is a flat drawing?",
      answer: "A cylinder of liquid is darkest at the walls and has a bright core a little to one side, so the fill is a six-stop sideways gradient. On top go a long white reflection that moves with the pointer, a thinner one on the far wall, a rolled lip, and a bright spot where the round bottom focuses light like a lens. The colour pooled on the base under each tube finishes it.",
    },
    {
      question: "Can the tubes show more or fewer than seven values?",
      answer: "Yes. The number of tubes follows the length of `days`. For more than seven on a phone, lower `gap` and `tw` in the narrow layout so the rack still fits inside 380 design pixels.",
    },
    {
      question: "How do the tubes pass through the top rail?",
      answer: "The rack is painted into two off-screen layers. The back layer has the base, posts and the far half of the rail with dark holes. The tubes are drawn next. The front layer is the near half of the rail with the same holes cut out of it, so each tube appears to drop through a bored hole.",
    },
    {
      question: "Is this accurate enough for real reporting?",
      answer: "The settled level is exact, and the number above each lip is the true value. It is a display piece though: with no gridlines across the whole rack, comparing two close values takes a look at the numbers. For dense data use a plain chart.",
    },
  ],
  related: ["stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob", "moon-phase-dial-date-picker-with-an-enamel-day-ring-you-turn-and-a-cratered-moon-lit-for-that-night", "phosphor-oscilloscope-live-metric-display-with-a-lingering-trace-and-persistence-knob"],
  tags: ["bar chart", "liquid", "glass", "canvas", "test tube", "data visualisation", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
