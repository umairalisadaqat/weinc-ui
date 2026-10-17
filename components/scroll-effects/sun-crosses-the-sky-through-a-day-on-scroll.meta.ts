export default {
  "slug": "sun-crosses-the-sky-through-a-day-on-scroll",
  "category": "scroll-effects",
  "name": "Sun Crosses The Sky Through A Day",
  "keyword": "scroll storytelling",
  "title": "",
  "description": "",
  "intro": "A boat trip told through the hours of one day. A pinned seascape shifts sky colour with each step while the sun swings along its arc and the boat crosses the bay, with a clock in the corner naming the hour. Suits day tours, event schedules and any timeline where the time of day sets the mood.",
  "useWhen": [
    "A schedule or itinerary across one day, where each step happens at a different hour."
  ],
  "customize": [
    "Move the sun for a step with its `rotate()` angle on `.w1sky-arm`; minus 90 is the left horizon, 90 the right.",
    "Repaint each hour by editing the gradients on `.w1sky-l1` to `.w1sky-l4`.",
    "Change where the boat sits with the `translateX()` value in `cqi` for each step on `.w1sky-boat`."
  ],
  "accessibility": [
    "The scene has a text alternative giving the four times and where the sun stands, and each hour is a real step heading."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "time of day",
    "sticky scroll",
    "css scene",
    "timeline"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The scene holds still at evening, with the sun low and the boat in the bay, above all four hours as a list.",
  "perf": "Four stacked gradient layers fade with opacity and two elements move with transform; the scene uses no images."
} satisfies UiMeta;
