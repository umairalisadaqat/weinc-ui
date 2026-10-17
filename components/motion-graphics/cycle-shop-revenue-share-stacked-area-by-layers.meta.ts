const meta = {
  "slug": "cycle-shop-revenue-share-stacked-area-by-layers",
  "category": "motion-graphics",
  "name": "Revenue Share Stacked Area Chart",
  "keyword": "animated chart",
  "title": "",
  "description": "",
  "intro": "A four-year review card for a bike shop, showing how revenue split between repairs, parts and rentals. The bands fade in from the bottom up, then each year's share appears inside its band, so the widening rentals layer is the last thing to land. The plot stretches to any width, keeping the percentages in proportion on a phone as well as a wide report.",
  "useWhen": [
    "Showing how a whole divides into a few parts over several periods, such as revenue by service or visits by source."
  ],
  "customize": [
    "Recolour the bands with `--m6stk-rep`, `--m6stk-par` and `--m6stk-ren`.",
    "Change a share by editing the y points of the band paths (2.32 units per percent) and the matching percentage label.",
    "Make the plot taller or shorter with the 300px height on `.m6stk-plot`; the bands stretch to fit."
  ],
  "accessibility": [
    "The plot has `role=\"img\"` with a label describing the change in each band, and a hidden list reads every share for every year."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "stacked area chart",
    "share of total",
    "opacity animation",
    "annual review"
  ],
  "height": 640,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "All three bands and their twelve percentages are shown at once with nothing moving.",
  "perf": "Three filled shapes fade in by opacity and twelve labels follow, all within about 1.5 seconds; after that nothing repaints."
} satisfies UiMeta;

export default meta;
