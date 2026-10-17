const meta = {
  slug: "pull-down-wall-chart-tabs-on-spring-rollers-that-snap-up-to-uncover-the-chart-hanging-behind",
  category: "navigation",
  name: "Pull-Down Wall Chart Tabs on Spring Rollers That Snap up to Uncover the Chart Hanging Behind",
  keyword: "skeuomorphic tabs react",
  title: "React Skeuomorphic Tabs: Roller Wall Charts | We.Inc",
  description: "Tabs built as a rack of schoolroom wall charts: each chart snaps up onto its spring roller to uncover the one hanging behind. Free React and HTML to copy.",
  intro: "A rack of four linen-backed wall charts on varnished wooden rollers, hung from two steel hangers on a sage plaster wall. Each roller sits a step lower than the one in front of it, so the charts hang in a cascade and every black bottom slat shows beneath the last. The tab is the brass label holder on that slat, with a brass ring under it. Choose a chart further back and the ones in front wind up one after another, speeding up as the spring takes them, and each slat rattles when it reaches its roller; choose one nearer the front and it is pulled back down with a small bounce. The chart on show is the tab panel: a plate number, a title, a photograph in a ruled frame with a figure caption, a paragraph and three numbered notes, all as real text. On a phone the charts are redrawn narrower and longer with the photograph above the words.",
  useWhen: [
    "A school, museum, club or course page has three to five subjects that deserve a full illustrated panel each.",
    "You want tabs where the order means something, because the charts further back stay hidden until the nearer ones are out of the way.",
    "The page already has a classroom, nautical or natural history feel and flat pill tabs would look out of place.",
    "Each panel is one picture, one short paragraph and a few key points.",
  ],
  customize: [
    "`charts` holds everything: `tab` is the word in the brass holder, `title`, `body` and `notes` are the printed text, `photo` and `alt` the picture, `paper` and `text` the colour of the sheet and its body type, and `ink` the colour of the title, rules and numbered dots, so one chart can be dark while the rest are pale.",
    "`WIDE` and `SLIM` are the two sets of measurements. `L` is how long a chart hangs, `photoH` the height of the picture and `holder` the width of the brass label holder.",
    "`STEP` is how much lower each roller sits than the one in front. Raise it to show more of the charts behind, lower it for a tighter stack.",
    "The wall is `bg-[#9fae9c]` on the section and the slat is `#1b1816`. The two soft bars of window light are the last block in the section; delete it for an evenly lit wall.",
    "The wind-up lasts `0.44` seconds and follows `ease: [0.6, 0, 0.9, 0.5]`; the pull-down is the spring with `stiffness: 150` and `damping: 15`. Raise the damping for no bounce.",
  ],
  accessibility: [
    "The brass holders are buttons with `role=\"tab\"`, `aria-selected` and `aria-controls`. They live on the moving slats, so an empty `role=\"tablist\"` element adopts them with `aria-owns`; keep that list in step if you change the ids.",
    "Only the chosen tab is in the tab order. Left and right arrows move to the neighbouring chart and wrap round, and Home and End jump to the first and last.",
    "Each chart is a `role=\"tabpanel\"` labelled by its tab. Charts that are rolled up or covered carry `aria-hidden`, so a screen reader meets one panel at a time.",
    "With reduced motion the charts change places at once, with no winding, bounce or rattle, and the rack stops changing charts by itself.",
  ],
  faqs: [
    {
      question: "How does a chart look as if it winds onto the roller?",
      answer: "Nothing is scaled or squashed. The paper is a normal block inside a box whose `clipPath` cuts it off at the centre line of its roller. Moving the paper up with a transform makes it vanish at that line, and the roller on top is stretched a little with `scaleY` while paper is wound on it, so it looks fatter when the chart is up.",
    },
    {
      question: "Why are the tabs split between the top and the bottom of the rack?",
      answer: "Because that is where the slats really are. A chart that is wound up has its slat tucked under its roller at the top, and a chart that is down has its slat at the bottom. The holders are staggered from left to right, so no tab ever sits behind another one whichever chart is showing.",
    },
    {
      question: "Can I have more than four charts?",
      answer: "Five or six work. Add entries to `charts` and the rack grows downwards by `STEP` for each one. Past six the brass holders start to crowd at phone width, so shorten the tab words or lower `holder` in `SLIM`.",
    },
    {
      question: "How much text fits on a chart?",
      answer: "About thirty five words of body and three short notes at the sizes given. For longer copy raise `L` in both sets of measurements; the section works out its own height from that number.",
    },
    {
      question: "How do I stop the charts changing by themselves?",
      answer: "Remove the effect that calls `setInterval`. As written it stops for good the first time a tab is pressed or reached with the keyboard, and it waits while the pointer is over the rack.",
    },
  ],
  related: ["woven-ribbon-tab-bar-with-a-thread-marker-that-unpicks-and-restitches-itself", "oak-card-index-box-faq-with-tabbed-question-cards-that-rise-out-and-stand-against-the-open-lid"],
  tags: ["tabs", "wall chart", "roller", "brass", "paper", "skeuomorphic"],
  height: 792,
  section: true,
  interactive: true,
};

export default meta;
