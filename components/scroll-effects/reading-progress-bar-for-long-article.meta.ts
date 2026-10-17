const meta = {
  "slug": "reading-progress-bar-for-long-article",
  "category": "scroll-effects",
  "name": "Reading Progress Bar for a Long Article",
  "keyword": "scroll progress bar",
  "title": "",
  "description": "",
  "intro": "A boatyard journal article with a slim teal bar under its sticky header that fills from left to right as you read. The fill is one element scaled on the x axis by a CSS scroll timeline, so it tracks the scroll position exactly with no script, and a small listener does the same job in browsers that lack timelines.",
  "useWhen": [
    "Long articles, guides or case studies where readers like to know how much is left."
  ],
  "customize": [
    "Change `--w1bar-accent` for the fill and `--w1bar-rail` for the empty track.",
    "Set the `height` on `.w1bar-rail` for a thicker or thinner bar.",
    "For a bar tied to the whole page, switch `scroll(nearest block)` to `scroll(root)` and fix the header to the top."
  ],
  "accessibility": [
    "The bar is marked aria-hidden because it repeats what the scroll position already tells assistive tech; the article keeps real headings and a blockquote.",
    "The scrolling box takes keyboard focus with a label."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scroll progress bar",
    "reading progress indicator",
    "animation-timeline scroll",
    "article header"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "The bar still follows the scroll position, since it reports where you are, but nothing eases and the demo scroll stays off.",
  "perf": "One scaled element on the scroll timeline; the fallback writes a single transform per frame while scrolling."
};

export default meta;
