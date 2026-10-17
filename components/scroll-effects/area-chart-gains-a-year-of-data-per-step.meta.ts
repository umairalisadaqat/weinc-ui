export default {
  "slug": "area-chart-gains-a-year-of-data-per-step",
  "category": "scroll-effects",
  "name": "Area Chart Gains Data Per Step",
  "keyword": "scrollytelling chart",
  "title": "",
  "description": "",
  "intro": "A solar co-op tells a two-year story with one pinned area chart. The first year is already drawn, the next step raises the second year from the baseline, then a highlighted band and a target line arrive as the text reaches them. Fits annual reports, impact pages and any data story with a clear before and after.",
  "useWhen": [
    "A single chart that should be read in layers, with each layer explained before the next one appears."
  ],
  "customize": [
    "Replace the data in the `area()` and `line()` paths; y is `270 - value * 4` and x steps evenly across 400 units.",
    "Move the target by changing the `y1` and `y2` of the line inside `.w1cht-goal`.",
    "Change the rise speed with the `1.1s` transition on `.w1cht-y2`."
  ],
  "accessibility": [
    "The chart's text alternative states the peak of each year and the target, so the figures do not depend on seeing the lines."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "svg chart",
    "data story",
    "area chart",
    "sticky scroll"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The chart shows both years, the summer band and the target line together, next to the four steps as a list.",
  "perf": "The second year rises with a scaleY transform and the rest fade with opacity; no path is redrawn while scrolling."
} satisfies UiMeta;
