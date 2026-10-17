const meta = {
  slug: "glass-rain-gauge-progress-meter-that-fills-drop-by-drop-with-a-meniscus-and-tips-out-when-full",
  category: "feedback",
  name: "Glass Rain Gauge Progress Meter That Fills Drop by Drop with a Meniscus and Tips Out When Full",
  keyword: "react liquid progress bar glass",
  title: "React Liquid Progress Bar in a Glass Gauge | We.Inc",
  description: "Progress meter drawn as a glass rain gauge: drops land, the water rises against a printed scale and a tap pours it out. Free React code and HTML to copy.",
  intro: "A progress meter you read the way a gardener reads rainfall. A tall glass measuring tube stands on a pale table with a scale from 0 to 50 printed round its front in dark blue enamel. Drops fall into the open top, each one sends a ring across the surface, throws up a few beads and leaves a bubble or two that climb back out, and the level creeps up the scale. The surface is drawn as it looks from slightly above: a pale oval with a dark line along the front where the water climbs the wall of the tube. When the water reaches the top line the gauge waits a moment, then is lifted, turned over and poured out onto the table before it is set down to start again. A tap or the Enter key does the same at any time. While it is tipped the water keeps a level surface inside the slanted tube and leaves by the lip. The drawing fills the width of a phone screen and the percentage is always written underneath.",
  useWhen: [
    "A long job such as a backup, import or export needs a progress display that is pleasant to watch for a minute or more.",
    "A fundraising, savings or sign-up target wants something more memorable than a bar that turns green.",
    "A garden, farm, weather or water brand needs a status object that belongs to its own world.",
    "A dashboard has one quota, such as storage or monthly usage, that is worth giving room on the page.",
  ],
  customize: [
    "`START` is the level on load, from 0 to 1. To drive the gauge from real progress, set `s.p` from your own value inside the effect and delete the block that adds `PER_DROP`.",
    "`CAPACITY` and `gauge.unit` set the printed scale and the caption. `100` with `%` turns it into a plain percentage tube with a number at every ten.",
    "`WATER` is the red, green and blue of the liquid. `[176, 58, 46]` reads as cordial, `[196, 148, 40]` as oil.",
    "`EVERY` is the gap in seconds between caught drops and `PER_DROP` is how much each one adds. Halve both for the same speed with busier rain.",
    "Set `LOOP` to `false` if the gauge should stay full until somebody taps it.",
  ],
  accessibility: [
    "The drawing is hidden from screen readers. A `progressbar` element carries the label, the value from 0 to 100 and a spoken form such as 31 of 50 mm.",
    "The glass is a real `button` named for what it does, reachable by Tab, with a teal focus ring drawn round the tube.",
    "The amount and the percentage are printed under the gauge as text with strong contrast on the pale table, so the picture is never the only source.",
    "With reduced motion nothing falls and nothing tips. The gauge is drawn once at its level, and the button switches between empty and the starting level.",
  ],
  faqs: [
    {
      question: "How is the glass drawn without WebGL?",
      answer: "With layered gradients on a 2D canvas. The tube is darkest where its wall is seen edge-on, a hard white strip stands in for a window on the left, a softer one for the room on the right, and the thick base and foot get their own bands of light and dark. The printed ticks are short arcs of an ellipse, which is what makes the scale look wrapped round a cylinder.",
    },
    {
      question: "What keeps the water level while the tube is tipped?",
      answer: "The inside of the tube is treated as a rectangle that turns with the glass. Each frame the code finds the height of a horizontal line that leaves the right amount of that rectangle below it, by halving the search range fourteen times. When that line rises above the lip, the difference flows out as beads.",
    },
    {
      question: "Can I show a fixed value with no rain?",
      answer: "Yes. Set `EVERY` to a very large number so no drops are caught and set `START` to your value. The surface, the meniscus and the reflections are all still drawn, and the caption reads the same number.",
    },
    {
      question: "Why does the caption show both an amount and a percentage?",
      answer: "The amount matches the scale printed on the glass, so the picture and the text agree. The percentage is what most progress displays need. Remove either span from the paragraph at the bottom if you only want one.",
    },
    {
      question: "Will it slow the page down?",
      answer: "The loop draws a few dozen gradients and a few short lists of drops, rings and bubbles. It stops completely when the gauge is scrolled out of view or the tab is in the background.",
    },
  ],
  related: ["ink-drop-progress-indicator-that-blooms-through-a-glass-of-water-one-drop-per-step", "beehive-frame-progress-meter-whose-wax-cells-fill-with-honey-and-cap-over-as-the-job-finishes"],
  tags: ["progress", "glass", "water", "gauge", "canvas", "rain", "meter"],
  height: 740,
  interactive: true,
};

export default meta;
