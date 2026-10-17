const meta = {
  "slug": "timeline-spine-draws-dots-light-on-scroll",
  "category": "scroll-effects",
  "name": "Timeline Spine Draws and Dots Light Up",
  "keyword": "scroll timeline animation",
  "title": "",
  "description": "",
  "intro": "A family mill history laid out as a vertical timeline whose dark line grows down the page in step with your reading, while each year dot fills with amber the moment it crosses the middle of the box. The line is a scaled pseudo element and the dots are scaled fills, so only transform and opacity move.",
  "useWhen": [
    "A company history, project log or changelog that reads top to bottom by date."
  ],
  "customize": [
    "Set `--w1tln-mid` to half the scrolling area (50vh on a normal page) to move the reading line.",
    "Change `--w1tln-glow` for the lit dot colour and `--w1tln-ink` for the line.",
    "Lower the bottom padding on `.w1tln-wrap` if you do not need the last entry to reach the middle."
  ],
  "accessibility": [
    "The history is an ordered list with a heading per year; the dots are decorative and hidden from screen readers.",
    "Reduced motion shows the full line and every dot already lit."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "scroll timeline animation",
    "vertical timeline",
    "scroll progress line",
    "animation-timeline view"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "The full line and all six lit dots show at once, with no drawing or demo scroll.",
  "perf": "One scaled line and six small dot fills on scroll timelines; the fallback reads seven rectangles per frame while scrolling."
};

export default meta;
