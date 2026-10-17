const meta = {
  "slug": "marker-highlight-wiping-behind-a-phrase",
  "category": "text-effects",
  "name": "Marker Highlight Wiping Behind a Phrase",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "A yellow marker sweeps behind the second half of a headline, low on the letters like a real highlighter, and runs line by line when the phrase wraps on a phone. It rests for a while, then clears toward the right. Clean slate type on white keeps it practical for a local trade or a help page.",
  "useWhen": [
    "A white, practical homepage where one promise in the headline should stand out without a colour change in the words."
  ],
  "customize": [
    "Pick the marker colour with `--mh-accent`; pale yellow, mint or a soft peach all keep dark text readable.",
    "Make the mark thicker or thinner with the `62%` height in `background-size`, and lift it with the `85%` in `background-position`.",
    "Wrap a different phrase in `.mh-mark` to move the highlight; it can span several lines."
  ],
  "accessibility": [
    "The highlight is a background behind ordinary text, so the words never change and dark ink on yellow stays well above 4.5:1."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "highlight text animation",
    "marker highlight css",
    "text highlight effect",
    "background wipe"
  ],
  "height": 480,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "The phrase sits fully highlighted, with no sweep.",
  "perf": "Animates background-size on one inline span, a small repaint of that phrase; no JavaScript needed for the effect."
};

export default meta;
