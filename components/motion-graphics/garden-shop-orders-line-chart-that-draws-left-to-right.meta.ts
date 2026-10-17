const meta = {
  "slug": "garden-shop-orders-line-chart-that-draws-left-to-right",
  "category": "motion-graphics",
  "name": "Garden Shop Orders Line Chart That Draws",
  "keyword": "animated line chart",
  "title": "",
  "description": "",
  "intro": "A season report card for a garden shop. The line traces the months from left to right at an even pace, and each point's dot and order count appear just as the line reaches it, so the eye follows the climb to June and the slow fall after. A pale fill settles underneath once the line is drawn. Labels are HTML laid over the SVG, so they stay readable on a phone.",
  "useWhen": [
    "Showing one figure over time, such as monthly orders, visits or bookings, when the shape of the year is the point of the card."
  ],
  "customize": [
    "Recolour the line with `--m6lin-plot`, the fill with `--m6lin-fill` and the peak with `--m6lin-peakc`.",
    "To plot your own months, change the y values in both the line and area paths and move each dot and `.m6lin-lab` rule to match.",
    "Slow or quicken the drawing with the 1.15s duration on `.m6lin-path`, and scale the `.m6lin-k` delays by the same amount."
  ],
  "accessibility": [
    "The chart is `role=\"img\"` with a label naming the start, peak and end values, and a hidden list gives the order count for every month."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "line chart",
    "stroke-dashoffset",
    "svg chart",
    "season report"
  ],
  "height": 715,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The line is fully drawn with its fill, dots and every monthly count in place.",
  "perf": "One path repaints while it draws for just over a second, and eight dots and labels fade on the compositor; then the card is static."
} satisfies UiMeta;

export default meta;
