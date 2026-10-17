const meta = {
  "slug": "bakery-weekly-sales-bar-chart-grows-from-the-axis",
  "category": "motion-graphics",
  "name": "Bakery Weekly Sales Bar Chart",
  "keyword": "animated bar chart",
  "title": "",
  "description": "",
  "intro": "A weekly sales card for a bakery's owner report. Seven bars rise from the axis one after another, Saturday's in terracotta, and each day's loaf count fades in above its bar as it lands. The bars are plain elements grown with scaleY from their bottom edge, so the card can sit in any page layout and still read on a phone.",
  "useWhen": [
    "A short report, newsletter or dashboard card that compares one figure across the days of a week or a handful of categories."
  ],
  "customize": [
    "Set each day's value with the `--v` number on its `.m6bar-c` rule and the matching text in the bar label and hidden list.",
    "Change `--m6bar-unit` to make the chart taller or shorter; the gridlines follow it.",
    "Pick the standout colour with `--m6bar-hi` and the other bars with `--m6bar-bar`."
  ],
  "accessibility": [
    "The plot has `role=\"img\"` with a label that names the highest and lowest day, and a visually hidden list repeats all seven counts."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "bar chart",
    "scaleY",
    "sales report",
    "svg chart"
  ],
  "height": 600,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "All seven bars stand at their values with every count visible from the start.",
  "perf": "Seven bars scale on the compositor and seven labels fade, all done in about 1.2 seconds, then the card is still."
} satisfies UiMeta;

export default meta;
