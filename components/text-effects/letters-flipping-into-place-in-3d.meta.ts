const meta = {
  "slug": "letters-flipping-into-place-in-3d",
  "category": "text-effects",
  "name": "Letters Flipping into Place in 3D",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "Each letter swings up from below on a horizontal hinge, overshoots a touch and settles, one after another along the line, like cards turned face up. The last word picks up an amber accent for the time. After a long hold the letters tip away from the top and the line plays again.",
  "useWhen": [
    "A timetable, opening hours or event notice where the key detail should arrive with a bit of mechanical character."
  ],
  "customize": [
    "Change how far each letter swings with `rotateX(-100deg)` in the first keyframe, and the spring with the `1.45` in its cubic-bezier.",
    "Move the accent to a different word by changing the `.fl-w:last-child` selector, or recolour it with `--fl-accent`.",
    "Deepen or flatten the 3D look with `perspective: 700px` on `.fl-w`; lower numbers exaggerate it."
  ],
  "accessibility": [
    "Screen readers read the timetable sentence once from a hidden span and skip the flipping letters."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "3d text animation",
    "flip text css",
    "letter flip animation",
    "rotating letters"
  ],
  "height": 500,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "Every letter stands upright and still, with the time shown in amber.",
  "perf": "3D transforms and opacity on about 25 letter spans, composited by the browser with no repaint."
};

export default meta;
