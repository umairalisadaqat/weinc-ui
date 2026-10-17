export default {
  slug: "masked-strip-photo-transition-drag-slider-with-momentum",
  category: "galleries",
  name: "Masked Strip Photo Transition Drag Slider",
  keyword: "css image transition slider",
  tags: ["image slider", "css transition", "drag slider", "momentum", "strip reveal"],
  height: 700,
  collection: "carousel-slider",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The next cabin photo and its text appear at once, with no strip wipe and no coasting rail.",
  perf: "Strips move with CSS transform transitions on their own layers; the script only runs while the rail is dragged or settling.",
  intro: "A cabin rental's five stays, with a tall photo on the left and one text card at a time on the right. Drag either side and the text rail coasts on with momentum; when a new card lands, the next photo rises and falls into place through six masked strips that alternate direction. Fits a small hospitality or property site with a few strong pictures.",
  customize: [
    "Set `STRIPS` for more or fewer bands, and the stagger in milliseconds where each strip's `transition-delay` is written.",
    "Tune the wipe with `--w2cab-dur` and the cubic-bezier on `.w2cab-on .w2cab-strip img`.",
    "Change the forest and moss palette through `--w2cab-bg`, `--w2cab-ink` and `--w2cab-acc`.",
  ],
  accessibility: [
    "Only the first strip of each photo carries the alt text and hidden photos are marked aria-hidden, so a screen reader hears one description per cabin.",
  ],
  useWhen: [
    "Holiday cabins, guest rooms or venues where each photo needs a short paragraph beside it.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
