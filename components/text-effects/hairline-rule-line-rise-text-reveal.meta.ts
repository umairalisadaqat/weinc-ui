const meta = {
  slug: "hairline-rule-line-rise-text-reveal",
  category: "text-effects",
  name: "Hairline Rule Line Rise",
  keyword: "line reveal animation",
  title: "",
  description: "",
  intro: "A one pixel rule draws under each line of a large sans headline, then the words rise up out of it as if the line had been cropped from below. The lines follow each other in order and retract the same way. Built for architecture, editorial and studio sites on a white page.",
  useWhen: ["A restrained headline where the motion should feel drafted rather than decorative."],
  customize: ["Recolour the rule with `--hlu-rule`; a darker grey makes the drawing stage more visible.", "Change `--hlu-stagger` for a quicker or slower cascade between lines.", "Swap the three entries in `LINES` (or the three spans in the plain version) for your own phrase."],
  accessibility: ["Lines are real text inside the h1, only moved and clipped, so the heading reads in order with no extra markup."],
  faqs: [],
  related: [],
  tags: ["line by line text reveal", "editorial text animation", "mask text reveal", "css hairline"],
  height: 495,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "All three lines rest in place with their hairlines fully drawn.",
  perf: "A transform on each line and a scaleX on each rule; almost free to run, paused off screen.",
};

export default meta;
