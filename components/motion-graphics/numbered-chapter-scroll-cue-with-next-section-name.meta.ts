const meta = {
  "slug": "numbered-chapter-scroll-cue-with-next-section-name",
  "category": "motion-graphics",
  "name": "Numbered Chapter Scroll Cue With Next Section Name",
  "keyword": "scroll down arrow animation",
  "title": "",
  "description": "",
  "intro": "A furniture workshop's catalogue opens on a graphite first screen with a framed chair photo. The cue in the lower left reads 01 / 04 in large figures, with four ticks and the name of the next chapter, Chairs. A small oak mark slides from the first tick toward the second while the arrow nods, so the cue says both where you are and what comes next.",
  "useWhen": [
    "A long page split into a known number of chapters, such as a catalogue, case study or annual review, where the reader benefits from knowing how much follows."
  ],
  "customize": [
    "Change `01`, `/ 04` and the Next label to match your own chapter count and the id of the section that follows.",
    "Add or remove ticks in the `.m5num-t-off` path; each tick is 18 units long with a 6 unit gap."
  ],
  "accessibility": [
    "The big figures are hidden from screen readers and replaced with a spoken Chapter 1 of 4, followed by the visible Next: Chairs."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scroll indicator",
    "chapter counter",
    "catalogue hero",
    "css animation"
  ],
  "height": 620,
  "section": true,
  "interactive": true,
  "collection": "scroll-down-arrow-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The figures, the four ticks and the arrow stand still, with the first tick marked, and the link jumps to Chairs.",
  "perf": "A short SVG line and a small arrow move with transform and opacity; both pause when the cue fades or the piece scrolls away."
} satisfies UiMeta;

export default meta;
