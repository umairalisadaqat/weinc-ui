const meta = {
  "slug": "pinned-panel-steps-crossfade-on-scroll",
  "category": "scroll-effects",
  "name": "Pinned Panel Steps Cross Fade",
  "keyword": "sticky scroll steps",
  "title": "",
  "description": "",
  "intro": "A bakery explains its two-day loaf in four steps inside one panel that stays pinned while you scroll. Each step holds for a stretch of scrolling, then cross-fades to the next with a small lift, and a thin bar along the top fills as the process moves on. The pin comes from position: sticky, so nothing measures layout to keep it in place.",
  "useWhen": [
    "A process, method or how-it-works section with three to five stages that should be read one at a time."
  ],
  "customize": [
    "Make `.w1pin-track` taller or shorter to give each step more or less scrolling.",
    "Add a step by adding an `li` and a `w1pin-s5` keyframe, then respacing the % stops.",
    "Change `--w1pin-clay` to recolour the numbers, bar and button."
  ],
  "accessibility": [
    "The steps are a real ordered list, so all four are in the page for screen readers even while only one shows.",
    "With reduced motion the panel stops pinning and the steps read as a plain list."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "sticky scroll steps",
    "pinned section",
    "scroll storytelling",
    "animation-timeline view"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere; sticky works everywhere",
  "reducedMotion": "The panel is not pinned and all four steps appear as a normal list, one under the other.",
  "perf": "Sticky positioning plus opacity and transform on four list items; the fallback does one small calculation per frame while scrolling."
};

export default meta;
