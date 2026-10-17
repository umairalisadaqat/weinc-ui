const meta = {
  "slug": "word-rows-drift-sideways-with-scroll",
  "category": "scroll-effects",
  "name": "Word Rows Drift Sideways With Scroll",
  "keyword": "scroll marquee text",
  "title": "",
  "description": "",
  "intro": "Three oversized rows of market produce names that slide sideways as the section scrolls past, the outlined middle row moving against the two around it. Nothing loops on a timer: the rows only move while the visitor scrolls, which keeps the energy of a ticker without the constant motion. A plain stall list and opening hours sit underneath.",
  "useWhen": [
    "A market, festival or venue page that wants a bold band of words between the intro and the details."
  ],
  "customize": [
    "Raise or lower `--w1dri-shift` to change how far the rows travel.",
    "Edit the words in each `.w1dri-row`; repeat them so the row stays wider than the screen.",
    "Change `-webkit-text-stroke` on `.w1dri-b` or drop the class for a solid middle row."
  ],
  "accessibility": [
    "The drifting rows are aria-hidden and their contents also appear as a real list, so nothing is only in the decoration."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scroll marquee text",
    "horizontal scroll text",
    "animation-timeline view",
    "big typography"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "The rows sit still, slightly offset, and every word and the stall list stay readable.",
  "perf": "Three wide text layers moved by transform on the scroll timeline; the fallback reads three rectangles per frame while scrolling."
};

export default meta;
