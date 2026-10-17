export default {
  "slug": "terracotta-double-wipe-preloader-for-a-ceramics-shop",
  "category": "loaders",
  "name": "Terracotta Double Wipe Preloader",
  "keyword": "wipe preloader css",
  "tags": [
    "preloader",
    "wipe transition",
    "ceramics",
    "loading screen",
    "shop"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "Both clay panels stay where they are and the cover fades out in one soft step.",
  "perf": "Two full-size layers translate once and two photos fade in; no loop runs after the reveal.",
  "intro": "A dark clay panel with the shop's name and a percentage covers the page while the two product photos load. When they are in, the dark panel wipes off to the right with a terracotta panel a beat behind it, and the vases rise into place one after the other. Fits small shops with a warm, handmade look.",
  "customize": [
    "Recolour the two wipe layers with `--w2wip-front` and `--w2wip-back`.",
    "Make the wipe go left instead by changing both `translateX(101%)` values to `translateX(-101%)`.",
    "Widen the gap between the two layers by raising the `.16s` delay on `.w2wip-back`."
  ],
  "accessibility": [
    "Each photo has alt text and a visible caption, so the products read the same with or without the images."
  ],
  "useWhen": [
    "A maker's shop opens on product photography and a layered colour wipe matches its palette."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
