const meta = {
  "slug": "paragraph-lines-sliding-up-from-a-mask",
  "category": "text-effects",
  "name": "Paragraph Lines Sliding Up from a Mask",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "A short serif statement set over four lines, each rising out of its own hidden slot a moment after the one above, the way a printed page might be revealed line by line. The last line turns italic in a soft bronze. Each line keeps its full height while hidden, so the paragraph never changes size.",
  "useWhen": [
    "An architecture, design or publishing site that leads with a considered sentence rather than a slogan."
  ],
  "customize": [
    "Write your own lines in the `LINES` array, or the `.ml-line` spans in the plain version; each line is its own mask, so choose the breaks where you want them.",
    "Spread the lines further apart in time with the `140ms` in the `.ml-in` delay.",
    "Swap the serif stack in `.ml-root` for a sans if your brand needs it; the effect does not depend on the font."
  ],
  "accessibility": [
    "The statement is read as one sentence from a hidden span, because the visible version is split into separately animated lines."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "line by line text animation",
    "mask reveal text",
    "slide up text css",
    "paragraph animation"
  ],
  "height": 520,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "All four lines are shown in place, with the last line in bronze italic.",
  "perf": "Four transformed blocks clipped by overflow: hidden; runs on the compositor with no repaint."
};

export default meta;
