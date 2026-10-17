export default {
  "slug": "forest-curtain-preloader-that-lifts-with-a-curved-edge",
  "category": "loaders",
  "name": "Forest Curved Curtain Preloader",
  "keyword": "page loading animation css",
  "tags": [
    "preloader",
    "curtain",
    "cabins",
    "loading screen",
    "curved reveal"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The curtain does not lift; it fades out over the meadow photo, which is already in its final place.",
  "perf": "One layer and its curved hem lift together by transform, so the hem costs nothing extra to move.",
  "intro": "A deep green curtain names a cabin rental and shows a progress line filling as the hero photo and cabin card load. When they finish, the whole curtain lifts away with a soft curved hem trailing below it, the meadow photo drifts up into place and the headline and card follow. Good for stays, retreats and outdoor brands.",
  "customize": [
    "Recolour the curtain, the progress line and the light text with `--w2lft-forest`, `--w2lft-moss` and `--w2lft-cream`.",
    "Make the hem deeper or flatter by changing the `150px` height of `.w2lft-curve`, and keep the lift distance in `.w2lft.is-out .w2lft-cover` at least that much larger.",
    "Change the status words in `.w2lft-foot` to suit the brand."
  ],
  "accessibility": [
    "Text over the photo sits on a dark gradient so the cream headline keeps its contrast at every width.",
    "The cabin card is a figure with a caption, and on phones it drops out without hiding anything the headline does not already say."
  ],
  "useWhen": [
    "A holiday let or retreat opens on one large landscape photograph.",
    "You want a reveal that feels softer than a straight-edged panel."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
