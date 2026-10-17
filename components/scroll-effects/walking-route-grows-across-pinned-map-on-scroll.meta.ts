export default {
  "slug": "walking-route-grows-across-pinned-map-on-scroll",
  "category": "scroll-effects",
  "name": "Walking Route Grows Across Pinned Map",
  "keyword": "scrollytelling map route",
  "title": "",
  "description": "",
  "intro": "A guided fell walk told as a route on a pinned map. Each step of text moves a pin to the next stop, draws in the leg just walked and pans the map to frame it, with a small readout of the distance so far. Suits tours, races, delivery rounds and any story that is really a journey.",
  "useWhen": [
    "A tour, trail, race course or travel itinerary where the order of places is the story."
  ],
  "customize": [
    "Move a stop by changing its circle, label and the matching `translate()` on `.w1map-pin` for that `data-step`.",
    "Change how close the map zooms with the `scale(1.3)` values on `.w1map-pan`.",
    "Recolour the walked route with the `stroke` on the `.w1map-seg` paths and `--w1map-accent`."
  ],
  "accessibility": [
    "The map has one text alternative that names every stop in order, and each stop is also a real list step.",
    "With reduced motion the map stops panning and shows the whole route with every leg drawn."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "map route",
    "sticky scroll",
    "svg map",
    "intersection observer"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The map shows the whole route with all three legs drawn and the pin at the inn, beside a plain list of stops.",
  "perf": "One IntersectionObserver swaps a data attribute; the pan and pin are transform transitions on one small SVG."
} satisfies UiMeta;
