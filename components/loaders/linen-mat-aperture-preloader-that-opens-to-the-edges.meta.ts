export default {
  "slug": "linen-mat-aperture-preloader-that-opens-to-the-edges",
  "category": "loaders",
  "name": "Linen Mat Aperture Preloader",
  "keyword": "intro animation website",
  "tags": [
    "preloader",
    "aperture",
    "linen",
    "loading screen",
    "frame reveal"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The mat stays whole and fades away in one step, leaving the photo and panel in place.",
  "perf": "Four flat sides slide by transform and one photo scales; the window shadow is drawn once and only faded.",
  "intro": "A cream mat, like the card around a framed print, covers a linen shop's page with a small window cut in the middle, so the fabric photo can be seen arriving through it. When the images are in, the four sides of the mat slide out to the edges and the photo eases back to full size. Fits textiles, framing and craft shops.",
  "customize": [
    "Change the mat colour with `--w2mat-mat` and the inner shadow around the window with `--w2mat-shadow`.",
    "Make the window bigger or smaller by changing the `34%` sizes on the four sides and on `.w2mat-edge` together.",
    "Edit the shop name in `.w2mat-name` and the status words in `.w2mat-pct`."
  ],
  "accessibility": [
    "The mat is decorative and hidden from assistive technology, while the shop name stays a real link in the header."
  ],
  "useWhen": [
    "A product's texture is the selling point and a glimpse of it during loading builds interest.",
    "The look should feel printed and framed rather than digital."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
