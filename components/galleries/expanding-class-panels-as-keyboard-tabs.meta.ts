const meta = {
  slug: "expanding-class-panels-as-keyboard-tabs",
  category: "galleries",
  name: "Expanding Class Panels as Keyboard Tabs",
  keyword: "accessible expanding tabs",
  title: "",
  description: "",
  intro: "A pottery studio's class list built as photo panels that are also a proper tab set. Each closed panel is a tab labelled with the class name; the open one shows its photo, price, length and weekly time. Arrow keys, Home and End move between classes the way screen reader users expect from tabs, and hover and tap open them as well. Phones get stacked rows.",
  useWhen: [
    "The options are true alternatives, such as courses, plans or services, where tab semantics fit better than an accordion.",
    "Keyboard users should be able to step through every option with arrow keys instead of tabbing past each one.",
  ],
  customize: [
    "Edit the classes in `CLASSES`; the booking button below the stage picks up the open class name.",
    "Widen or narrow the closed tabs with `--c` on `.w5tab-stage`, keeping `--n` equal to the number of classes.",
    "Change how dark the closed panels look with the alpha in `.w5tab-tint`.",
  ],
  accessibility: [
    "Uses role tablist, tab and tabpanel with aria-selected, aria-controls and a roving tabindex, so Tab enters the set once and lands next in the open panel.",
    "Only the selected panel is exposed; the others are removed with the hidden attribute in the HTML version and not rendered in React.",
  ],
  faqs: [],
  related: [],
  tags: ["tabs", "expanding panels", "keyboard navigation", "aria tabs", "course list"],
  height: 796,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Tabs switch instantly and the class details appear without the slide or the rising fade.",
  perf: "Selecting a tab moves a handful of layers with transforms and fades one panel in; it is idle otherwise.",
};

export default meta;
