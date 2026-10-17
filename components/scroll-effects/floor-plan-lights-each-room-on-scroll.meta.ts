export default {
  "slug": "floor-plan-lights-each-room-on-scroll",
  "category": "scroll-effects",
  "name": "Floor Plan Lights Each Room",
  "keyword": "scrollytelling floor plan",
  "title": "",
  "description": "",
  "intro": "A holiday cottage tour where a pinned floor plan lights one room per step. The room being described glows warm, rooms already visited stay softly lit, and the rest wait in the dark. Good for rentals, venues, show homes and office moves where people want to picture the layout before they arrive.",
  "useWhen": [
    "Describing a building, venue or flat room by room, in the order a visitor would walk through it."
  ],
  "customize": [
    "Redraw the plan by editing the `rooms` rectangles and the wall `path`; each room's glow uses the same rectangle.",
    "Warm or cool the light with the `stop-color` values in `#w1pln-glow`.",
    "Change how bright visited rooms stay with the `.22` opacity rule."
  ],
  "accessibility": [
    "The plan has a text alternative describing where each room sits, and every room is also a step with its own heading."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "floor plan",
    "svg",
    "property tour",
    "sticky scroll"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "Every room on the plan is lit at once, and the five room descriptions follow as a plain list.",
  "perf": "Five gradient rectangles fade with opacity; nothing else on the plan changes while scrolling."
} satisfies UiMeta;
