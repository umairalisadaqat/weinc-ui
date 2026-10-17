const meta = {
  "slug": "rolling-word-rotator-in-a-fixed-width-slot",
  "category": "text-effects",
  "name": "Rolling Word Rotator in a Fixed Slot",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "A two-line headline where the second line is a slot that rolls upward through four phrases, pausing on each one. The slot is sized to the longest phrase before anything moves, so the rule underneath and the copy below never shift. Good for a service business that does several things and wants to name them without a list.",
  "useWhen": [
    "A repair shop, clinic or trade site that wants to name its main jobs in one headline."
  ],
  "customize": [
    "Edit the `WORDS` array (or the `.wr-reserve` and `.wr-reel` spans in the plain version). Keep the first phrase repeated at the end of the reel so the loop closes cleanly.",
    "Adding a fifth phrase means adding a stop to `@keyframes wr-roll`: each step moves the reel up by another `1.08em`, the same value as the slot height.",
    "Slow down or speed up the pauses with `--wr-speed`, and recolour the rolling phrase through `--wr-accent`."
  ],
  "accessibility": [
    "Screen readers hear one sentence naming every phrase, while the rolling reel is hidden from them, so nothing is announced on each change."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "word rotator",
    "rotating text css",
    "text slider",
    "headline animation"
  ],
  "height": 500,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "The slot stays on the first phrase and the reel does not move.",
  "perf": "One transformed element moves a few times per cycle; no JavaScript beyond the pause observer."
};

export default meta;
