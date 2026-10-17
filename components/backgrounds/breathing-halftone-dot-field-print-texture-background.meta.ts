const meta = {
  slug: "breathing-halftone-dot-field-print-texture-background",
  category: "backgrounds",
  name: "Breathing Halftone Dot Field",
  keyword: "css animated background",
  title: "",
  description: "",
  intro: "A field of halftone dots on cream paper swells and shrinks as two soft shadows wander beneath it, so the printed tone seems to breathe. A contrast filter turns the blurred shapes into crisp dots, then two blend layers recolour them in navy ink. It suits print studios, zines, editorial sites and anything with a handmade press feel.",
  useWhen: ["A print shop or publisher wants a texture that looks pressed rather than drawn on a screen.", "A light editorial page needs subtle motion that keeps a strict two colour palette."],
  customize: ["Change `--htn-ink` and `--htn-paper` for a different press pairing, such as a red `#b5322a` on off white `#f6f1e7`.", "Make the screen coarser or finer with `--htn-cell`; `16px` reads as a poster, `8px` as newsprint.", "Slow the swell with `--htn-speed`, or move the darkest patch by changing where `.htn-a` and `.htn-b` sit."],
  accessibility: ["The dots stay on the right of the block on desktop and fall to the bottom on phones, so the heading sits on clear paper.", "Every print layer is wrapped in `aria-hidden=\"true\"` and ignores the pointer."],
  faqs: [],
  related: [],
  tags: ["halftone", "print", "dots", "paper", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  tech: "css",
  reducedMotion: "The two ink shadows hold still, leaving one fixed patch of graded dots in the corner.",
  perf: "The contrast filter repaints the dot layer every frame, so it costs more than a transform; keep it to one block per page.",
};

export default meta;
