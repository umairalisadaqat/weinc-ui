export default {
  "slug": "sand-tile-mosaic-preloader-for-a-photography-gallery",
  "category": "loaders",
  "name": "Sand Tile Mosaic Preloader",
  "keyword": "grid preloader animation",
  "tags": [
    "preloader",
    "tile reveal",
    "gallery",
    "loading screen",
    "mosaic"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The mosaic does not break apart; the whole dark cover fades in one step to show the exhibition page.",
  "perf": "Twenty-four small layers scale and fade once each; nothing repaints after the sweep ends.",
  "intro": "A dark mosaic of twenty-four tiles hides a gallery page while its two photographs load, with a short status line counting them. Once both are in, the tiles shrink away in a diagonal sweep from the top left, a little like prints coming off a wall. Suits galleries, photographers and archives with a calm, printed feel.",
  "customize": [
    "Change the tile and page colours through `--w2til-tile` and `--w2til-sand`.",
    "Use a finer grid by raising the `repeat(6, 1fr)` and `repeat(4, 1fr)` counts and adding matching tile spans and delays.",
    "Speed up the sweep by lowering the `0.045s` step used in the tile `nth-child` delays."
  ],
  "accessibility": [
    "The exhibition title is a real heading, and both photos carry alt text that describes what hangs in them."
  ],
  "useWhen": [
    "A gallery or photographer's homepage opens with images that should not appear half-drawn.",
    "The brand is quiet and printed, and a grid feels more fitting than a sliding panel."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
