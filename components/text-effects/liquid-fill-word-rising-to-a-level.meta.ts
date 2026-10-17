const meta = {
  slug: "liquid-fill-word-rising-to-a-level",
  category: "text-effects",
  name: "Liquid Fill Word Rising to a Level",
  keyword: "liquid fill text animation",
  title: "",
  description: "",
  intro: "A heavy outlined word on a soft dawn-peach background fills with teal water: the level rises over two seconds, then two wave layers keep rolling in opposite directions while a few bubbles drift upward inside the letters. Everything is one inline SVG with a text clip path, so it scales cleanly from a phone to a wide screen. It suits drinks, refill, wellness and progress messages.",
  useWhen: [
    "A drinks or water brand wants its key word to look poured rather than printed.",
    "You want to show a fill level, such as a funding or capacity goal, as a playful headline.",
  ],
  customize: [
    "Set how full it ends with `--w10lqf-level`: 0px is empty and about -250px reaches the top of the letters.",
    "Recolour the water through `--w10lqf-deep` and `--w10lqf-light`, and the letter edges through `--w10lqf-outline`.",
    "Change the word in all three `text` elements; `textLength` stretches it to the same width, so shorter words get wider letters.",
  ],
  accessibility: [
    "The SVG is hidden from screen readers and the heading carries the word in a visually hidden span. Reduced motion shows the letters already filled to the set level with calm, unmoving water.",
  ],
  faqs: [],
  related: [],
  tags: ["liquid text", "text fill animation", "svg text animation", "wave text", "text animation"],
  height: 629,
  section: true,
  collection: "text-animation",
  tech: "css",
  reducedMotion: "The letters appear already filled to their final level, with still waves and no bubbles.",
  perf: "Two wave paths and four bubbles move by transform inside one SVG clip, with no script beyond an off-screen pause.",
};

export default meta;
