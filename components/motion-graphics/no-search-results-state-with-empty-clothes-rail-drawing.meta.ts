const meta = {
  "slug": "no-search-results-state-with-empty-clothes-rail-drawing",
  "category": "motion-graphics",
  "name": "No Search Results State with Empty Clothes Rail",
  "keyword": "empty state illustration",
  "title": "",
  "description": "",
  "intro": "A no results page for a small clothing shop's search. Under the filled search field, a clothes rail draws itself in terracotta with three empty hangers, and a magnifying glass circles in over it, while the heading names the search and two actions offer a way out. On phones the search field drops below the shop name.",
  "useWhen": [
    "The results page of a shop, recipe or document search when nothing matched and the visitor needs a nudge to try again."
  ],
  "customize": [
    "Recolour the rail and hangers with `--m4srch-pen`; the magnifier uses the ink colour.",
    "Change the words in the input's `value` and in the heading together so they always match the real query."
  ],
  "accessibility": [
    "The field has a real label and sits in a form with `role=\"search\"`.",
    "The empty state is told by the result count and the heading; the rail drawing is `aria-hidden`."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "no results",
    "empty state",
    "search page",
    "svg line drawing"
  ],
  "height": 600,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The rail, hangers and magnifier are drawn and still above the message.",
  "perf": "Twelve short strokes repaint for about 1.5 seconds, then the page is static."
} satisfies UiMeta;

export default meta;
