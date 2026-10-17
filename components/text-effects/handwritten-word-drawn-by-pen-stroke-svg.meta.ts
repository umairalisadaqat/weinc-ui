const meta = {
  slug: "handwritten-word-drawn-by-pen-stroke-svg",
  category: "text-effects",
  name: "Handwritten Word Drawn by Pen Stroke",
  keyword: "handwriting animation svg",
  title: "",
  description: "",
  intro: "A joined-up script \"hello\" in navy ink writes itself across faintly ruled cream paper in one unbroken stroke, loops and all, then an underline swash flicks in beneath it. The word holds for several seconds, fades like drying ink and is written again. The letters are a single hand-drawn SVG path, so the pen moves the way a real hand would rather than revealing a font.",
  useWhen: [
    "A stationery, wedding or letter-writing brand wants a greeting that feels personally written.",
    "You want a handwriting reveal without loading a script font or any animation library.",
  ],
  customize: [
    "Change the ink with `--w10pen-ink` and the nib weight with `--w10pen-weight`.",
    "Slow the writing by raising `--w10pen-cycle`; the write takes the first thirty percent of each loop.",
    "To write another word, draw it as one path in a vector editor, paste its `d` value and keep `pathLength=\"1\"`.",
  ],
  accessibility: [
    "The heading carries the word in a hidden span and the drawing is hidden from screen readers. With reduced motion the word and swash appear fully written and stay put.",
  ],
  faqs: [],
  related: [],
  tags: ["handwriting animation", "svg stroke animation", "signature animation", "stroke-dashoffset", "text animation"],
  height: 560,
  section: true,
  collection: "text-animation",
  tech: "css",
  reducedMotion: "The script word and its underline are shown fully written in still ink.",
  perf: "Two SVG paths animate stroke-dashoffset and opacity, which repaints only the small drawing; no script beyond an off-screen pause.",
};

export default meta;
