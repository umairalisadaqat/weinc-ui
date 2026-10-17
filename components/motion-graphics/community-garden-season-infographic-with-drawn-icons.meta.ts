const meta = {
  "slug": "community-garden-season-infographic-with-drawn-icons",
  "category": "motion-graphics",
  "name": "Community Garden Season Infographic",
  "keyword": "animated infographic",
  "title": "",
  "description": "",
  "intro": "A season summary band for a community garden's newsletter page. Each of the three line icons draws itself in gold, a seedling, a harvest basket and a ticked calendar, and its figure and short label rise in beside it, left to right. The numbers are plain text in a list, so they can be read, copied and translated like the rest of the page.",
  "useWhen": [
    "An annual review, impact page or newsletter that wants to show a few headline figures with a little more care than a row of numbers."
  ],
  "customize": [
    "Swap the gold line colour with `--m6inf-icon` and the background with `--m6inf-bg`.",
    "Replace a figure and its label in the markup; the layout fits values up to about six characters.",
    "Redraw an icon with your own 48 by 48 paths, keeping `pathLength=\"1\"` on each so it draws in the same way."
  ],
  "accessibility": [
    "The figures and labels are real list text in reading order, and the icons beside them are hidden from screen readers."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "infographic",
    "stat panel",
    "line icons",
    "annual review"
  ],
  "height": 560,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The icons are fully drawn and all three figures with their labels are visible straight away.",
  "perf": "Ten short icon strokes repaint as they draw and six text blocks fade, finished in about 1.4 seconds."
} satisfies UiMeta;

export default meta;
