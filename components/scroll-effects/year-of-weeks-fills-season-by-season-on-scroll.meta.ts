export default {
  "slug": "year-of-weeks-fills-season-by-season-on-scroll",
  "category": "scroll-effects",
  "name": "Year Of Weeks Fills By Season",
  "keyword": "scrollytelling calendar",
  "title": "",
  "description": "",
  "intro": "A farm veg box shows its year as 52 small squares, one per weekly delivery. Each season's step fills its row with a quick stagger in that season's colour and names what is in the boxes. A unit chart like this suits subscriptions, school terms, training plans and anything counted in weeks.",
  "useWhen": [
    "Explaining a schedule or subscription where people want to see the whole year at a glance."
  ],
  "customize": [
    "Recolour a season with `--w1wks-c` on `.w1wks-q1` to `.w1wks-q4`.",
    "Change the ripple across a row with the `--d` delay on each square (0.035s per week).",
    "Write your own produce into each `.w1wks-crop` line under its row."
  ],
  "accessibility": [
    "The calendar is one image with a text alternative listing every season and its crops; the squares themselves are hidden."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "unit chart",
    "calendar",
    "sticky scroll",
    "stagger"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "All four rows are filled from the start, each with its crops, next to the four seasons as a list.",
  "perf": "Fifty-two small squares fade and scale in with CSS transitions, only when their season's step becomes active."
} satisfies UiMeta;
