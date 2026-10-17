const meta = {
  "slug": "pottery-class-bookings-ranked-as-horizontal-bars",
  "category": "motion-graphics",
  "name": "Class Bookings Ranked as Horizontal Bars",
  "keyword": "animated bar chart",
  "title": "",
  "description": "",
  "intro": "A ranking card for a pottery studio's end of term notes. Five classes are listed in order, each bar sweeping out from the left with scaleX a beat after the one above, and the booking count appears at the tip once the bar has arrived. On narrow screens the class name sits above its bar so long names never get squeezed.",
  "useWhen": [
    "Ranking a short list of named things, such as services, products or classes, where the names are too long to fit under vertical bars."
  ],
  "customize": [
    "Change each class's value with `--v` on its `.m6rnk-r` rule, and set `--m6rnk-max` a little above the largest value.",
    "Recolour the leader with `--m6rnk-hi` and the rest with `--m6rnk-bar`.",
    "Adjust the stagger by changing the step in the `.m6rnk-t` delay rules."
  ],
  "accessibility": [
    "The ranked list is hidden from screen readers in favour of a `role=\"img\"` label that reads the whole ranking, plus a hidden list of every booking count."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "horizontal bar chart",
    "ranking",
    "scaleX",
    "report card"
  ],
  "height": 600,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The ranking is shown complete, each bar at its length with its count beside it.",
  "perf": "Five bars scale and five numbers fade on the compositor in just over a second; after that nothing runs."
} satisfies UiMeta;

export default meta;
