const meta = {
  slug: "strip-chart-recorder-line-chart-with-a-sprung-ink-pen-on-moving-grid-paper-and-two-data-sets",
  category: "dashboard",
  name: "Strip Chart Recorder Line Chart with a Sprung Ink Pen on Moving Grid Paper and Two Data Sets",
  keyword: "react animated line chart canvas",
  title: "React Animated Line Chart Drawn by an Ink Pen | We.Inc",
  description: "Line chart drawn by a pen recorder on a canvas: grid paper feeds past a stylus that inks each value, with a second data set. Free React and HTML code.",
  intro: "A line chart that is being drawn while you watch. Cream grid paper with sprocket holes travels through the bed of a hammered blue-grey instrument case, and a small carriage on two chrome rods carries a stylus up and down to ink the curve. Every month gets a ring on the line and its figure written above it, so the twelve values can be read straight off the sheet. Each year starts with a rubber stamp naming the channel. Press key B and the feed races: the remaining paper and one whole new year shoot under the pen in about a second and the other series is left lying on the bed in blue. A window on the case shows the reading under the pen in amber digits, and the feed knob turns with the paper. Click or tap the paper to knock the desk, and the pen shakes on its spring and writes the tremor into the line. All figures are invented demo data. Under 760 pixels the controls move below the bed and the months shrink to initials.",
  useWhen: [
    "A monitoring, uptime or logging product wants a hero that shows a signal being recorded instead of a finished static chart.",
    "You are comparing this year with last year for a single measure, such as bookings or revenue, and want the switch to be an event.",
    "A science, weather, seismology or medical device site needs a chart that looks like laboratory equipment.",
    "A retro hardware themed dashboard needs a slow, calm live element that never stops moving.",
  ],
  customize: [
    "Edit `sets`: each channel has a `key` printed on its button, a `label`, an `ink` colour and twelve `values`. Change `months` and `monthNames` together if your periods are not months.",
    "`FULL` is the value at the top grid line. The printed numbers 0 to 100 on the sheet are written in the `year` branch of `paper()` if you need other steps.",
    "`FEED` is the idle paper speed in design pixels a second. `mw` in `layoutFor` is the width of one month, which decides how much of the year fits on the bed.",
    "The pen spring is `520` (stiffness) and `15` (friction) in the frame loop. Drop the friction to 6 and the stylus rings for longer after a knock.",
    "The case colour is the three stops of `coat`, and the sheet colour is the three stops of `sheet`. `GREEN` is the printed grid ink.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. A visually hidden `table` lists all twelve months and values for the selected channel and is rebuilt when you switch.",
    "The two channel keys are real buttons with `aria-pressed` and names such as \"Last year, channel B\". The paper is a third button that knocks the recorder; it is decoration and safe to skip.",
    "The summary line, with the highest and lowest month, turns into a polite live region only after the first key press, so the automatic demo stays silent.",
    "With reduced motion the paper does not feed. The finished curve is drawn once, and choosing a channel replaces it in a single step with no race and no shake.",
  ],
  faqs: [
    {
      question: "How is the curve between the monthly points worked out?",
      answer: "The twelve values are joined with a Catmull-Rom spline that wraps round from December to January. It passes exactly through every month, so the rings sit on the true values, and the pen simply asks for the height of that curve at the piece of paper under it.",
    },
    {
      question: "Why does the pen overshoot a little on steep climbs?",
      answer: "While the paper idles the stylus is not placed on the curve. It is a weight pulled towards it by a spring with some friction, stepped four times a frame. On a sharp turn it lags and swings past by a hair, which is what a real galvanometer pen does. During the fast feed the spring is bypassed so the new curve comes out clean.",
    },
    {
      question: "Does the chart ever end?",
      answer: "No. The year repeats, so the recorder keeps drawing January after December for as long as the page is open. Only the stretch of paper on the bed is kept in memory. Points that have rolled off the left edge are dropped every frame.",
    },
    {
      question: "Can I plot live data instead of a fixed year?",
      answer: "Yes. Replace `valueAt` with a function that returns your latest reading and ignore its paper position. Remove the month rings in `stamp` or call it when a new sample arrives. The spring, the paper and the ink trail work unchanged.",
    },
    {
      question: "What happens to the old line when I change channel?",
      answer: "It stays on the paper, as it would on a real roll. Each stored point remembers which channel inked it, so the red stretch keeps its colour as it is carried off to the left and the blue one follows it. The stamp at the next year line names the new channel.",
    },
  ],
  related: ["stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob", "glass-test-tube-rack-bar-chart-with-dyed-liquid-that-rises-sloshes-and-settles-on-each-value"],
  tags: ["line chart", "chart recorder", "seismograph", "canvas", "ink", "skeuomorphic", "live data"],
  height: 760,
  interactive: true,
};

export default meta;
