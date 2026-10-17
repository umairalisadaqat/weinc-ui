export default {
  slug: "eased-ring-cursor-that-grows-and-snaps-to-links",
  category: "cursors",
  name: "Eased Ring Cursor That Snaps to Links",
  keyword: "cursor follower",
  title: "",
  description: "",
  intro:
    "A thin ring trails a small dot that marks the exact click point. Over a link the ring stops following freely, slides onto the link's arrow button or label, grows to frame it and fills with a faint wash, while still leaning slightly toward the pointer. It suits an architecture or design studio index where each row is a big, deliberate click.",
  useWhen: ["A project index or case study list where every row is a single large link."],
  customize: [
    "Lower `EASE` toward 0.1 for a slower, floatier ring, or raise it toward 0.3 for a snappy one.",
    "Set `PULL` to 0 for a ring that locks dead centre on a link, or 0.35 for one that strains toward the pointer.",
    "Change `--w2rng-ink` and the `.w2rng-fill` wash colour to recolour the ring for a dark page.",
  ],
  accessibility: [
    "The system cursor only disappears for a mouse inside the section with motion allowed, and the ring hides during keyboard focus so the blue focus outline stays clear.",
  ],
  faqs: [],
  related: [],
  tags: ["cursor follower", "magnetic cursor", "custom cursor", "hover effect"],
  height: 620,
  section: true,
  collection: "cursor-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The ring and dot never appear and the normal system cursor stays.",
  perf: "Two elements moved with transform in one frame loop, plus one rectangle read per frame while snapped; paused off screen.",
} satisfies UiMeta;
