const meta = {
  slug: "particle-headline-assembling-into-letters-canvas",
  category: "text-effects",
  name: "Particle Headline Assembling Into Letters",
  keyword: "particle text animation",
  title: "",
  description: "",
  intro: "Thousands of sand and amber specks drift in from a loose cloud and settle, left to right, into a large serif word on a dark roastery-brown hero. Once formed, the specks shimmer by less than a pixel, scatter away from a finger or cursor, and every eleven seconds loosen and gather again. It is built for a brand name or single word that deserves an entrance.",
  useWhen: [
    "A brand name or one-word headline should feel crafted from many small parts, such as coffee, grain, sand or stars.",
    "You want a pointer-reactive showpiece that still reads as a word in any still frame after the first second.",
  ],
  customize: [
    "Change the word in `WORD` (React) or `data-word` (HTML), and update the hidden heading to match.",
    "Retint the dust with the `COLORS` array; the first colour is used for most particles, the second for about a quarter.",
    "Lower `MAX_DOTS` for older phones, or raise `ASSEMBLE_MS` for a slower, more ceremonial arrival.",
  ],
  accessibility: [
    "The word lives in a visually hidden h1, the canvas is hidden from assistive tech, and reduced motion paints the settled word once with no loop.",
  ],
  faqs: [],
  related: [],
  tags: ["particle text", "canvas text animation", "text animation", "interactive headline", "particles"],
  height: 624,
  section: true,
  collection: "text-animation",
  tech: "canvas",
  reducedMotion: "The finished word is drawn once from still particles, with no gathering, shimmer or pointer response.",
  perf: "Up to 4,200 small squares redrawn per frame on a 2D canvas capped at 2x pixel density, paused when off screen.",
};

export default meta;
