export default {
  slug: "context-cursor-caret-over-text-ring-over-buttons",
  category: "cursors",
  name: "Context Cursor With Caret and Ring",
  keyword: "context aware cursor",
  title: "",
  description: "",
  intro:
    "One small clay-coloured cursor that changes shape with what lies under it: a dot over empty page, a blinking text caret that settles onto the middle of each line inside a paragraph, and a hand-sized ring around the pointer over buttons. It fits a newsletter, journal or long article page where reading and clicking sit close together.",
  useWhen: ["A reading-first page such as a newsletter archive, studio journal or essay with a few clear calls to action."],
  customize: [
    "Tag any element with `data-c=\"text\"` or `data-c=\"btn\"` to choose which shape appears over it.",
    "Change `--w2car-ring` (58px in React) to size the button ring and `--w2car-clay` to recolour the dot and caret.",
    "Remove the `w2car-blink` animation line if you prefer a caret that stays solid.",
  ],
  accessibility: [
    "Normal cursors stay for touch, keyboard and reduced motion users; for a mouse the custom shapes hide during keyboard focus so the dark focus outline is always visible.",
  ],
  faqs: [],
  related: [],
  tags: ["custom cursor", "text caret", "hover state", "newsletter"],
  height: 548,
  section: true,
  collection: "cursor-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The custom cursor never appears and the regular arrow, text and hand cursors work as usual.",
  perf: "One element moved with transform plus a short opacity blink; the loop and blink pause off screen.",
} satisfies UiMeta;
