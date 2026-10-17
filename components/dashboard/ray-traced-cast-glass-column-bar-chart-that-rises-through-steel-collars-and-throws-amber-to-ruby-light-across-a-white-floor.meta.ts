const meta = {
  slug: "ray-traced-cast-glass-column-bar-chart-that-rises-through-steel-collars-and-throws-amber-to-ruby-light-across-a-white-floor",
  category: "dashboard",
  name: "Ray-Traced Cast Glass Column Bar Chart That Rises Through Steel Collars and Throws Amber to Ruby Light Across a White Floor",
  keyword: "3d bar chart react webgl",
  title: "3D Glass Bar Chart in WebGL (React, Tailwind) | We.Inc",
  description: "Free React bar chart whose bars are columns of coloured glass, ray traced in a WebGL shader on a sunlit white floor, with two data sets and a real data table.",
  intro: "A bar chart built as a still life. Six square columns of cast glass stand in a row on a white floor, each one as tall as its month, graded from amber at one end to ruby at the other. A low sun sits behind them, so every column lays a stripe of its own colour across the floor toward the camera, and the month names are printed on the floor in front. The total is set very large beside the scene and is read off the glass, so it rolls while the columns move. Two pill buttons swap between this year and last year: each column slides up or down through a stainless collar, a beat after its neighbour, and its stripe of light stretches with it. Pressing a column or its month button shows that month alone. A hidden table carries both sets of figures, labelled as demo data. On phones the scene sits on top and the type and buttons stack below it.",
  useWhen: [
    "A dashboard or annual review has one small series, six to eight numbers, that deserves the whole first screen.",
    "You are comparing two periods of the same measure and want the change itself to be the moment people watch.",
    "A studio, hotel, gallery or product brand wants its figures to look made rather than plotted.",
    "You need a showpiece for transmission, total internal reflection and coloured shadow running live without a 3D library.",
  ],
  customize: [
    "`sets` holds the two series and the words under the number. Give both the same count of values as `labels`, and change `SCALE` so the tallest value lands near 2.5 scene units.",
    "`glass` is the colour each column lets through, as red, green and blue from 0 to 1. Six rows of `[0.2, 0.6, 1.0]` to `[0.05, 0.1, 0.7]` gives a run of blues.",
    "`PITCH` and `HALF` set the gap between columns and half their width. With more than seven columns drop `PITCH` to about 0.62.",
    "The sun is `sa` and `se` in `draw()`: its bearing and its height in radians. A lower `se` such as 0.45 makes the stripes of light much longer.",
    "The weight of the move lives in the frame loop: `82` and `11.5` are the spring and drag for a column going up, `150` and `9.5` for one coming down, and the `105` in `go()` is the delay in milliseconds between one column and the next.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. A visually hidden table with a caption, column headers and row headers gives every month for both years plus the totals.",
    "The two data set buttons and the six month buttons are real buttons with `aria-pressed`, and each month button's label reads the full month name with its figure.",
    "Everything a pointer can do on the glass can be done from the month buttons with Tab and Enter, so nothing depends on hovering.",
    "With reduced motion the sun stops drifting, the automatic swap never starts and the columns jump straight to the new heights.",
  ],
  faqs: [
    {
      question: "How are the glass columns drawn without a 3D engine?",
      answer: "Each column is an axis-aligned box, and a ray meets a box with three divisions and a few comparisons. The fragment shader bends the ray on the way in, follows it across the inside, mirrors it off any face it strikes beyond the critical angle and lets it out where it can. Colour is taken away along the distance travelled, which is why thick paths look deeper than thin ones.",
    },
    {
      question: "Why is each shadow bright in the middle and darker along one side?",
      answer: "For every point on the floor the shader walks toward the sun through the glass. If the path goes in one face and out the opposite one, the light keeps its direction and arrives tinted. If it leaves through a neighbouring face it is turned aside, so that strip of floor only receives a little coloured skylight. Real glass blocks in sunshine show the same split.",
    },
    {
      question: "Does the big number always match the chart?",
      answer: "Yes. Each frame the heights of the columns are converted back to values and summed, and that is what the headline shows. While the columns are moving it passes through the values in between, and when they settle it lands on the exact total of the set.",
    },
    {
      question: "How many bars can it take before it slows down?",
      answer: "The cost per pixel grows with the count because floor points test every column for shadow. Six to eight hold a steady frame rate on an ordinary laptop. The component also measures its own frame time and lowers its resolution if frames start to run long.",
    },
    {
      question: "What appears when WebGL 2 is missing?",
      answer: "A front view made from CSS gradients: six coloured bars with skewed colour falling away from their feet, sized from the same numbers. The headline, the buttons and the table are ordinary markup and work the same.",
    },
    {
      question: "Can I feed it live figures?",
      answer: "Replace the `values` arrays with props or fetched numbers and call the same `go` path when they change. The columns will spring from wherever they are to the new heights, and the printed month names are redrawn from `labels` when the component mounts.",
    },
  ],
  related: ["ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper", "glass-test-tube-rack-bar-chart-with-dyed-liquid-that-rises-sloshes-and-settles-on-each-value", "savings-chart-of-minted-coin-stacks-where-each-deposit-drops-a-coin-that-wobbles-and-settles"],
  tags: ["bar chart", "3d chart", "webgl", "ray tracing", "glass", "shader", "data visualisation", "dashboard"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
