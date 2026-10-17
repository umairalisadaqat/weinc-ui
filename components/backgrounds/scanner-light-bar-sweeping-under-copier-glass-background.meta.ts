const meta = {
  slug: "scanner-light-bar-sweeping-under-copier-glass-background",
  category: "backgrounds",
  name: "Scanner Light Bar Under Copier Glass",
  keyword: "css background animation",
  title: "",
  description: "",
  intro: "Seen from beneath the glass of a copier, a thin mint light bar glides up and down under a dim document, lifting its lines into view as it passes. It fits archiving services, document tools, print shops and any product about turning paper into files. On narrow screens the sheet slides down and to the side so the heading never sits on the brightest line.",
  useWhen: ["A scanning, archiving or records business needs a hero that shows what it does without a stock photo.", "A dark product page wants one slow, precise motion rather than floating shapes."],
  customize: ["Recolour the bar with `--cpy-light`; a warm `rgba(255,236,200,.9)` makes an older lamp, a pale blue reads as an office scanner.", "Set `--cpy-speed` to the seconds for one pass. Around `4s` feels busy, `10s` is calm.", "Change the document by editing `.cpy-lines` spacing (`5px` line, `17px` gap) or remove `.cpy-stamp` for a plain letter."],
  accessibility: ["The page, bar and dust are decorative and hidden from screen readers, so only the scanning service copy is announced.", "A dark band behind the text keeps light copy above 4.5:1 even when the bar crosses that part of the block."],
  faqs: [],
  related: [],
  tags: ["scanner", "light bar", "document", "dark", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  tech: "css",
  reducedMotion: "The light bar stops just below the middle of the sheet, leaving a lit stripe across the document.",
  perf: "A single full-height layer moves with transform and blends with screen; everything else is static paint.",
};

export default meta;
