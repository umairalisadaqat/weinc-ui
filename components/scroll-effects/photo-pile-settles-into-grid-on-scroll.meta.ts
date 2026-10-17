const meta = {
  "slug": "photo-pile-settles-into-grid-on-scroll",
  "category": "scroll-effects",
  "name": "Photo Pile Settles Into a Grid",
  "keyword": "scroll gallery animation",
  "title": "",
  "description": "",
  "intro": "Six coastal prints start as a loose, rotated pile in the middle of a dark table and slide out to their places in a tidy grid as you scroll. Every print keeps its white border and shadow throughout, so the pile reads like real paper. The start position of each print is three variables, with a separate set for the two-column phone layout.",
  "useWhen": [
    "A photographer, print shop or portfolio gallery that wants a tactile moment before the work lines up."
  ],
  "customize": [
    "Change `--x`, `--y` and `--r` on each `.w1pil-p` to arrange a different pile.",
    "Widen `animation-range: cover 18% cover 52%` so the sort takes more scrolling.",
    "Swap the photos and captions; keep them square or change `aspect-ratio` on the images."
  ],
  "accessibility": [
    "Each print is a list item with a figure, a real caption and full alt text, and the grid order matches the reading order."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scroll gallery animation",
    "photo grid reveal",
    "scattered photos",
    "animation-timeline view"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "The prints sit straight in their grid from the start, with no pile and no demo scroll.",
  "perf": "Six transformed figures on one scroll timeline; the fallback observer fires once for the whole grid."
};

export default meta;
