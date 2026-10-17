const meta = {
  "slug": "headline-lines-rise-from-masks-on-scroll",
  "category": "scroll-effects",
  "name": "Headline Lines Rise From Masks",
  "keyword": "text reveal on scroll",
  "title": "",
  "description": "",
  "intro": "Three large serif statements for an architecture practice, each split into lines that slide up from behind their own hidden edge as they scroll into view. Lines follow each other by a small step, and the caption under every statement fades in last. It suits a principles or about section on a dark, quiet page.",
  "useWhen": [
    "An about page that makes its case in a few short, confident sentences."
  ],
  "customize": [
    "Change the line breaks by editing the text inside each `.w1msk-l` span; every span is one masked line.",
    "Raise `--k` on `.w1msk-m:nth-child(2)` and `(3)` to space the lines further apart.",
    "Swap `--w1msk-bg` and `--w1msk-ink` for a light version."
  ],
  "accessibility": [
    "Each statement is one real `h2`, so the line spans read as a single heading.",
    "Reduced motion shows every line already in place, with no demo scroll."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "text reveal on scroll",
    "masked line reveal",
    "animation-timeline view",
    "editorial headline"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "All three statements and captions are shown in place, fully readable, with nothing sliding.",
  "perf": "Only transforms on nine line spans plus three caption fades, so scrolling stays on the compositor."
};

export default meta;
