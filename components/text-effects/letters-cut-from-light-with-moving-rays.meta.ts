const meta = {
  slug: "letters-cut-from-light-with-moving-rays",
  category: "text-effects",
  name: "Letters Cut From Light With Moving Rays",
  keyword: "light rays text animation",
  title: "",
  description: "",
  intro: "Wide capitals glow warm white against a midnight blue wall, as if cut through it with a lamp behind, and soft shafts of light pour out of every letter. The hidden light source wanders slowly, so the beams swing and lengthen like dusk light through a stained window. It fits venues, galleries, churches and evening events where atmosphere matters more than speed.",
  useWhen: [
    "An evening venue, concert series or exhibition wants a hero word that feels lit rather than printed.",
    "You want slow, cinematic motion behind a short word, with no pointer interaction needed.",
  ],
  customize: [
    "Change the word in `WORD` (React) or `data-word` (HTML), and keep the hidden h1 in step with it.",
    "Shift the light colour with the two `LIGHT` stops; a cool `#dff3ff` to `#8cc8ff` pair gives moonlight instead.",
    "Trade quality for speed with `RAYS`: 14 still looks good on phones, while `DRIFT` sets how quickly the beams swing.",
  ],
  accessibility: [
    "The canvas is decorative and hidden from screen readers, with the word in a visually hidden heading. Reduced motion paints one still frame with the beams frozen at an angle.",
  ],
  faqs: [],
  related: [],
  tags: ["light rays text", "god rays", "canvas text animation", "glowing text", "text animation"],
  height: 628,
  section: true,
  collection: "text-animation",
  tech: "canvas",
  reducedMotion: "One still frame: the lit letters with their beams frozen at a gentle angle.",
  perf: "About twenty-six scaled copies of a prepared text image blend into a third-size buffer each frame, then one blurred upscale; paused off screen.",
};

export default meta;
