const meta = {
  slug: "kinetic-type-line-stretching-with-scroll",
  category: "text-effects",
  name: "Kinetic Type Line Stretching With Scroll",
  keyword: "kinetic typography scroll animation",
  title: "",
  description: "",
  intro: "One heavy forest-green word sits on a ruled line across a cream page, and a smooth swell travels through its letters, pulling each one taller as it passes. Scrolling moves the swell along the word and briefly makes it stronger; with no scroll it wanders on its own. Letters grow upward from the baseline into reserved space, so nothing below the headline ever moves.",
  useWhen: [
    "A fitness, dance or stretching brand wants its headline to physically act out the word.",
    "A long editorial page needs a type moment that reacts to scrolling without hijacking it.",
  ],
  customize: [
    "Set the peak height with `MAX_STRETCH` and the scroll kick with `SCROLL_BOOST`; keep the title's top padding at least as large as the stretch.",
    "Change the word in `WORD` or `data-word`; long words work best because the swell needs room to travel.",
    "Recolour with `--w10kin-ink` and `--w10kin-bg` in the HTML version, or the hex classes in React.",
  ],
  accessibility: [
    "Screen readers hear the word once from a hidden span; the stretched letters are hidden. Reduced motion holds one gentle, fixed swell over the middle letters and never starts the loop.",
  ],
  faqs: [],
  related: [],
  tags: ["kinetic typography", "scroll text animation", "stretch text", "text animation", "variable headline"],
  height: 543,
  section: true,
  collection: "text-animation",
  tech: "css",
  reducedMotion: "The word rests with a soft, fixed swell over its middle letters and does not react to scrolling.",
  perf: "One transform per letter each frame from a small loop that reads scroll position once and stops off screen.",
};

export default meta;
