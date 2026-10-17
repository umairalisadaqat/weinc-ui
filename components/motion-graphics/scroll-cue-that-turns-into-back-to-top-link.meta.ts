const meta = {
  "slug": "scroll-cue-that-turns-into-back-to-top-link",
  "category": "motion-graphics",
  "name": "Scroll Cue That Turns Into Back to Top Link",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A community garden page whose scroll cue rides along at the bottom right instead of staying in the hero. It invites you down to the beds, fades away while you read, and returns at the foot of the page as Back to top: the arrow turns to point up, the words cross-fade and the link now leads to the top. One control does both jobs.",
  "useWhen": [
    "A short page of three or four sections where a separate back-to-top button would be one control too many."
  ],
  "customize": [
    "Rewrite the two labels in `.m5flp-l1` and `.m5flp-l2`; the grid stacks them so the pill fits the longer one.",
    "Move the point where it flips by changing the `height` of `.m5flp-endmark` in the footer."
  ],
  "accessibility": [
    "The script swaps `aria-hidden` between the two labels and changes the `href`, so the link's name always matches where it goes.",
    "Choosing Back to top moves focus to the hero, so keyboard users start again from the top."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "back to top",
    "scroll down arrow",
    "sticky cue",
    "css transition"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The arrow still flips and the labels still change at the bottom, but instantly, with no nodding, and the links jump.",
  "perf": "Two IntersectionObservers flip a few attributes; the only loop is a tiny arrow nod that pauses while the cue is hidden."
} satisfies UiMeta;

export default meta;
