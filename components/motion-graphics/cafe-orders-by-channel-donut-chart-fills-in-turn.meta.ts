const meta = {
  "slug": "cafe-orders-by-channel-donut-chart-fills-in-turn",
  "category": "motion-graphics",
  "name": "Café Orders by Channel Donut Chart",
  "keyword": "animated pie chart",
  "title": "",
  "description": "",
  "intro": "A monthly channel card for a café, set on deep navy. The four segments of the donut fill one after another around the ring, each circle drawn with pathLength 100 so its dash equals its share, and the legend rows fade in as their segment lands. The headline share sits in the centre as real text.",
  "useWhen": [
    "Splitting one total into two to five shares, such as orders by channel or time spent by task, when the biggest share is the story."
  ],
  "customize": [
    "Recolour the segments with `--m6dnt-a` to `--m6dnt-d`.",
    "For new shares, set each segment's `--m6dnt-len` to its share minus 0.9 and its `rotate()` to -90 plus the shares before it times 3.6.",
    "Remove the thin gaps between segments by setting the gap to 0 in both values."
  ],
  "accessibility": [
    "The ring is `role=\"img\"` with a label that reads all four shares, and a hidden list repeats them next to it.",
    "The legend colours always sit beside a name and a percentage, so no share depends on colour alone."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "donut chart",
    "pie chart",
    "pathLength",
    "stroke-dashoffset"
  ],
  "height": 560,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The ring is complete with all four segments, the centre figure and the legend in view.",
  "perf": "Four circle strokes repaint briefly as they fill in sequence over about 1.3 seconds, then the chart holds still."
} satisfies UiMeta;

export default meta;
