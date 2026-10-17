const meta = {
  "slug": "hand-drawn-underline-drawing-under-one-word",
  "category": "text-effects",
  "name": "Hand-Drawn Underline Under One Word",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "A pen stroke draws itself under a single word in the headline, followed by a lighter second pass a moment later, the way someone underlines in a notebook. It holds, then lifts off in the direction it was drawn. The stroke is an inline SVG sized to the word, so it follows the word wherever the line wraps.",
  "useWhen": [
    "A friendly service page where one word in the promise deserves the emphasis a person would give it by hand."
  ],
  "customize": [
    "Move the `.ud-mark` span to whichever word you want underlined; the SVG stretches to that word's width.",
    "Reshape the stroke by editing the two `d` paths in the SVG; keep `pathLength=\"1\"` so the drawing timing still works.",
    "Change the ink with `--ud-accent` and the line weight with `stroke-width` on `.ud-svg path`."
  ],
  "accessibility": [
    "The underline SVG is `aria-hidden` and the sentence is ordinary text, so assistive technology reads the headline as written."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "animated underline",
    "svg underline animation",
    "hand drawn underline css",
    "text highlight"
  ],
  "height": 480,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "Both strokes are already drawn under the word and stay there.",
  "perf": "Animates stroke-dashoffset on two short SVG paths; a tiny repaint of the underline only."
};

export default meta;
