const meta = {
  slug: "text-on-circular-path-rotating-badge",
  category: "text-effects",
  name: "Text on a Circular Path Rotating Badge",
  keyword: "text on circular path animation",
  title: "",
  description: "",
  intro: "A bakery hero on warm flour-white paper with a stamped seal beside the headline: an outer ring of bold capitals turns slowly clockwise while an inner ring of copper italics drifts the other way around a dark centre with a wheat ear. Both rings are SVG text on a circle, stretched with textLength so the words close up with no gap whatever font loads.",
  useWhen: [
    "A café, bakery or craft brand wants a seal or stamp that feels alive next to a static headline.",
    "You need curved text that stays crisp at any size and is easy to edit as plain words.",
  ],
  customize: [
    "Slow or quicken the turn with `--w10orb-turn`; the inner ring always runs at two thirds of that speed in reverse.",
    "Edit `OUTER` and `INNER`; if a phrase is much longer, lower the font size so the letters do not crowd.",
  ],
  accessibility: [
    "The badge SVG is hidden from assistive tech and its message is given once in a hidden sentence; the headline and button are ordinary text. Reduced motion leaves both rings still.",
  ],
  faqs: [],
  related: [],
  tags: ["circular text", "text on path", "rotating text", "svg textpath", "badge animation"],
  height: 560,
  section: true,
  collection: "text-animation",
  tech: "css",
  reducedMotion: "Both rings of lettering stay still, so the badge reads like a printed stamp.",
  perf: "Two SVG groups rotate by transform on slow linear loops, with no script beyond an off-screen pause.",
};

export default meta;
