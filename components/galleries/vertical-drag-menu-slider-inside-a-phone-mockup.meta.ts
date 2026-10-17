export default {
  slug: "vertical-drag-menu-slider-inside-a-phone-mockup",
  category: "galleries",
  name: "Vertical Drag Menu Slider Inside a Phone Mockup",
  keyword: "vertical slider",
  tags: ["vertical slider", "phone mockup", "drag slider", "momentum", "app preview"],
  height: 704,
  collection: "carousel-slider",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Each swipe, button or key lands straight on the next drink with no coasting and no ease.",
  perf: "One transform on the screen's track per frame, only while a finger is down or the screen is settling.",
  intro: "A coffee bar's menu shown inside a drawn phone, one drink filling the screen at a time. Drag up or down on the screen and it follows your finger; a quick flick coasts past a drink or two before it eases onto the nearest one, and it stretches a little at the first and last. Good for previewing an app screen or a mobile-first menu on a desktop page.",
  customize: [
    "Change `FRICTION` for a longer or shorter coast, and `RUBBER` for how much the screen stretches past the ends.",
    "Resize the handset with `--w2pho-w` and `--w2pho-h`; each slide takes the full screen height so the snap follows automatically.",
    "Swap the graphite and copper colours through `--w2pho-bg` and `--w2pho-acc`.",
  ],
  accessibility: [
    "The screen claims only vertical drags with touch-action: pan-x, so a sideways swipe on a phone still scrolls the page, and up and down arrow keys plus two labelled buttons move one drink at a time.",
  ],
  useWhen: [
    "An app, ordering screen or mobile menu needs a believable hands-on preview on a marketing page.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
