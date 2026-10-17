export default {
  "slug": "paper-counter-preloader-that-hands-over-to-the-headline",
  "category": "loaders",
  "name": "Paper Counter Handover Preloader",
  "keyword": "counter preloader",
  "tags": [
    "preloader",
    "counter",
    "headline reveal",
    "studio",
    "loading screen"
  ],
  "height": 600,
  "section": true,
  "interactive": true,
  "collection": "preloader",
  "tech": "script",
  "support": "All current browsers",
  "reducedMotion": "The number stays put, the headline lines are already in place, and the paper cover just fades out.",
  "perf": "Text and one photo move by transform; the counter updates its text a few dozen times and then stops.",
  "intro": "The whole cover is the studio's paper colour with one oversized number counting the page's photographs. On load it slides up out of its mask while the three headline lines rise into theirs, so the counter seems to turn into the heading. The cover itself only fades. Works well for studios whose homepage leads with big type.",
  "customize": [
    "Set the paper, ink and accent through `--w2cnt-paper`, `--w2cnt-ink` and `--w2cnt-rust`.",
    "Change the headline by editing the three `.w2cnt-line` spans; keep one line per mask so each rises on its own.",
    "Slow the hand-over by raising the `.w2cnt-line` transition from `.9s` and the cover fade delay of `.45s`."
  ],
  "accessibility": [
    "The heading is real text from the start, so screen readers read it whether or not the lines have risen yet.",
    "Replay intro returns keyboard focus to itself once the cover has gone."
  ],
  "useWhen": [
    "A design or branding studio wants its headline to be the first thing people remember.",
    "The layout already uses very large type and the intro should feel like part of it."
  ],
  "faqs": [],
  "related": [],
  "title": "",
  "description": ""
} satisfies UiMeta;
