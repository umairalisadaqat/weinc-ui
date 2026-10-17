export default {
  slug: "document-toolbar-icons-that-animate-on-hover-focus-and-tap",
  category: "motion-graphics",
  name: "Document Toolbar Icons That Animate on Hover",
  keyword: "animated svg icons",
  tags: ["animated icons", "toolbar", "svg icons", "hover animation", "icon buttons"],
  height: 420,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Every icon stays still at rest and the button only changes its tint on hover, focus or tap.",
  perf: "Each icon moves one SVG group with a short keyframe; the small script only adds a class and pauses everything off screen.",
  intro: "Eight line icons in an editing toolbar for a catalogue draft, each with its own small gesture: the bell swings from its hook, the sync arrows make half a turn, the bin lid tips open, the plane flies out and back. Hover, keyboard focus and a tap all play it, and a slow idle cycle shows the set before anyone touches it.",
  customize: [
    "Change `--m3tlb-accent` for the active tint and `--m3tlb-stroke` for the weight of every icon.",
    "Set `STEP` to slow the idle tour, or delete the `setInterval` line to turn it off.",
    "Each gesture is one keyframe such as `m3tlb-swing` or `m3tlb-lid`; soften the degrees there for a quieter set.",
  ],
  accessibility: [
    "Every icon sits beside a visible word inside a real button, so the SVGs are hidden from screen readers and the favourite button reports its state with aria-pressed.",
  ],
  useWhen: [
    "An editor, file manager or settings screen needs icon buttons that answer a hover without a tooltip library.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
