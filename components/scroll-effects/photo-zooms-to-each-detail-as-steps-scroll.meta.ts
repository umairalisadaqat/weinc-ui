export default {
  "slug": "photo-zooms-to-each-detail-as-steps-scroll",
  "category": "scroll-effects",
  "name": "Photo Zooms To Each Detail",
  "keyword": "scrollytelling photo zoom",
  "title": "",
  "description": "",
  "intro": "One overhead photo stays pinned while a pottery studio walks through its class kit. Each step pans and scales the photo to frame the tool being described, with a small caption naming it. Works for menus, workshops, interiors and product flat lays where one good photo holds every detail.",
  "useWhen": [
    "You have one rich, high resolution photo and several details in it worth pointing out in turn."
  ],
  "customize": [
    "Aim a step at a new detail: for a point at x, y (0 to 1) and zoom s, use `translate(calc(-s * (x - .5) * 100%), ...)` on `.w1crp-img`.",
    "Swap the photo `src`, keep `object-fit: cover`, and recheck each step's numbers against it.",
    "Slow or speed the camera with the `1.1s` transition on `.w1crp-img`."
  ],
  "accessibility": [
    "The photo's text alternative lists every object the steps zoom to, so nothing is only in the picture."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "photo zoom",
    "image crop on scroll",
    "sticky scroll"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The full photo stays unzoomed above the five steps, which read as a plain list.",
  "perf": "Only a transform on one image changes, so each zoom runs on the compositor; the photo is loaded once at 1600px wide."
} satisfies UiMeta;
