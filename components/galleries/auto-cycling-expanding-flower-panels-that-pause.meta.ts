const meta = {
  slug: "auto-cycling-expanding-flower-panels-that-pause",
  category: "galleries",
  name: "Auto Cycling Expanding Flower Panels That Pause",
  keyword: "auto playing image accordion",
  title: "",
  description: "",
  intro: "A florist's weekly bunches shown as photo panels that open one after another by themselves, with a fine bar under each caption counting down to the next. The moment a visitor points at a panel, tabs into it or taps it, the slideshow stops and stays on their choice. A Pause and Play button sits above, and phones stack the panels.",
  useWhen: [
    "A shop window or homepage band should feel alive before anyone touches it, without hiding anything behind arrows.",
    "Stock changes weekly and you want each item to get a turn in the spotlight.",
  ],
  customize: [
    "Set the time each panel stays open with `CYCLE_MS` in React or `--dur` on `.w5cyc-stage` in HTML.",
    "Change the slide feel with the `.9s` and easing on `.w5cyc-panel`; a slower curve suits a calmer brand.",
    "Recolour the countdown bar and accents by replacing `#e3b7a3`.",
  ],
  accessibility: [
    "The slideshow has a visible Pause button, stops for good once someone interacts, and pauses while the block is scrolled out of view.",
    "With reduced motion it never starts, the button is removed and the first bunch is simply shown open.",
  ],
  faqs: [],
  related: [],
  tags: ["autoplay gallery", "expanding panels", "slideshow", "florist", "image accordion"],
  height: 768,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Nothing advances by itself; the first panel is open and the others open instantly when chosen.",
  perf: "The timer is a CSS animation on one thin bar, paused off screen, with a class change every few seconds.",
};

export default meta;
