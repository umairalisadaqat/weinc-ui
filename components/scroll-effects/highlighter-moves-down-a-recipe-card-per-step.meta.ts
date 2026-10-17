export default {
  "slug": "highlighter-moves-down-a-recipe-card-per-step",
  "category": "scroll-effects",
  "name": "Highlighter Moves Down A Recipe Card",
  "keyword": "scrollytelling text highlight",
  "title": "",
  "description": "",
  "intro": "A deli walks down a handwritten recipe card one line at a time. The card stays pinned while a soft highlighter bar slides and stretches to cover the lines each step is about, from the dry ingredients to the bake. Suits recipes, contracts, poems, letters and any document where people should read along with commentary.",
  "useWhen": [
    "Annotating a short document, letter or recipe line by line, with a note on each part."
  ],
  "customize": [
    "Point a step at other lines with `translateY(calc(var(--w1rec-lh) * n))` and cover more lines with `scaleY()` on `.w1rec-mark`.",
    "Change line spacing on the card with `--w1rec-lh`.",
    "Swap the highlighter colour with the `background` and `.55` opacity on `.w1rec-mark`."
  ],
  "accessibility": [
    "The card is described once in text, and the steps repeat every line it marks, so the highlighter only adds emphasis."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scrollytelling",
    "text highlight",
    "annotation",
    "sticky scroll",
    "document"
  ],
  "height": 640,
  "section": true,
  "collection": "scrollytelling",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The highlighter is hidden and the whole card shows plainly beside the five steps as a list.",
  "perf": "One highlight bar moves with translate and scale; the card itself is static text and never re-lays out."
} satisfies UiMeta;
