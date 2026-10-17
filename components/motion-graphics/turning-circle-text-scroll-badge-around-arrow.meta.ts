const meta = {
  "slug": "turning-circle-text-scroll-badge-around-arrow",
  "category": "motion-graphics",
  "name": "Turning Circle Text Scroll Badge Around Arrow",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A coffee roaster's dark photo hero with a round badge in the lower right corner. The words Scroll down and This week's roasts run around the edge of the badge and turn slowly, a full circle every sixteen seconds, while a copper arrow in the middle nods downward. On phones the badge moves to the bottom centre under the text.",
  "useWhen": [
    "A moody photo hero for a food, drink or craft brand that wants a cue with some character in an otherwise empty corner."
  ],
  "customize": [
    "Rewrite the ring in the `textPath`, then tune `textLength` until the words close the circle without a gap or overlap.",
    "Change `--m5ring-turn` for a faster or slower ring, and the `m5ring-nudge` duration for the arrow."
  ],
  "accessibility": [
    "The ring text is drawn in SVG and hidden from screen readers, so the link carries a visually hidden label naming where it goes."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "circle text animation",
    "rotating badge",
    "scroll down arrow",
    "svg textPath"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The badge sits still with its words in place and the arrow centred, and clicking it jumps to the roasts.",
  "perf": "One SVG group rotates and one arrow shifts by transform; both loops are paused once the badge fades or the hero is off screen."
} satisfies UiMeta;

export default meta;
