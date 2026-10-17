const meta = {
  "slug": "stacked-letter-tiles-logo-that-unfolds-like-paper",
  "category": "motion-graphics",
  "name": "Stacked Letter Tiles That Unfold",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "Three graphite tiles carrying the letters O, D and E fold down one after another from a hinge on their top edge, like a strip of card being opened. A shade inside each tile lifts as it turns flat. On phones the stack lies sideways and unfolds left to right beside the studio's contact details.",
  "useWhen": [
    "A short name set as stacked initials or tiles, where opening in sequence gives the letters a printed, tactile feel."
  ],
  "customize": [
    "Change the letters inside the three `b` tags, and the tile size with `--m1fld-size`.",
    "Recolour the tiles and letters with `--m1fld-tile` and `--m1fld-letter`.",
    "Alter the gap between folds by editing the `.3s` and `.6s` delays on `.t2` and `.t3`."
  ],
  "accessibility": [
    "The stack is one `role=\"img\"` labelled with the studio name; the separate letters are hidden so it is not spelled out."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "unfold animation",
    "3d logo reveal",
    "letter tiles",
    "css perspective"
  ],
  "height": 520,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "All three letter tiles lie flat and the contact card is fully visible straight away.",
  "perf": "Three tiles rotate in 3D and their shades fade, both compositor work, finishing in about 1.3 seconds."
} satisfies UiMeta;

export default meta;
