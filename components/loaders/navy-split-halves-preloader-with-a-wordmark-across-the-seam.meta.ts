export default {
  "slug": "navy-split-halves-preloader-with-a-wordmark-across-the-seam",
  "category": "loaders",
  "name": "Navy Split Halves Preloader",
  "keyword": "split screen preloader",
  "tags": [
    "preloader",
    "split reveal",
    "hotel",
    "loading screen",
    "wordmark"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The halves never part; the navy cover fades out over the finished photo and card.",
  "perf": "Two half-height layers and one photo move by transform, and the hairline is a single scaled line.",
  "intro": "A navy cover is split at its middle, with the hotel's name sitting across the seam and a gold hairline growing along it as the room photos load. Then the halves part, one up and one down, the photo eases out of a zoom and the booking card rises. Good for hotels, guest houses and anything with a strong wordmark.",
  "customize": [
    "Change the cover, seam and card colours through `--w2spl-navy`, `--w2spl-gold` and `--w2spl-ivory`.",
    "Swap the word inside both `.w2spl-mark` paragraphs; they must match so the two halves line up into one name.",
    "Size the split name with the `clamp()` on `.w2spl-mark`; keep it short enough to fit one line on a phone."
  ],
  "accessibility": [
    "The split name is decoration only; the hotel name stays in the page header as a real link.",
    "The booking card text keeps dark navy on ivory for strong contrast over the photo."
  ],
  "useWhen": [
    "A hotel or restaurant has a short name that looks good set very large.",
    "The page opens on one full-bleed photograph with a small card over it."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
