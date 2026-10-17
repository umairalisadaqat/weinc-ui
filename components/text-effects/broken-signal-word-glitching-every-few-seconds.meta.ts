const meta = {
  slug: "broken-signal-word-glitching-every-few-seconds",
  category: "text-effects",
  name: "Broken Signal Word Glitch",
  keyword: "glitch text css",
  title: "",
  description: "",
  intro: "An editorial serif headline on warm paper where only one word misbehaves: about once every five seconds, the highlighted word jolts sideways and splits into rose and teal slices for a third of a second, then sits still again. The rest of the sentence never moves. It makes a point with a single word, which suits repair, support and rescue services.",
  useWhen: [
    "A light, typographic page needs one word to act out its meaning without the whole hero feeling noisy.",
    "You want a glitch on a pale background, where the usual screen-blended neon look would wash out.",
  ],
  customize: [
    "Space the bursts further apart with `--w10sig-every`; at 8s the glitch becomes a rare surprise.",
    "Pick another word by editing the hidden `w10sig-sr` span, the `data-text` value and the visible word together.",
    "Retint the slices through `--w10sig-rose` and `--w10sig-teal`; they use multiply blending, so darker tones show best on paper.",
  ],
  accessibility: [
    "Assistive tech reads the sentence once in order, with the glitching word supplied by a hidden span. The burst lasts about a third of a second per cycle, and reduced motion leaves the highlighted word perfectly still.",
  ],
  faqs: [],
  related: [],
  tags: ["glitch word", "glitch text css", "light glitch effect", "editorial headline", "highlighted word"],
  height: 754,
  section: true,
  collection: "glitch-text-effect",
  tech: "css",
  reducedMotion: "The headline is calm and still, with the key word sitting on its soft rose highlighter mark.",
  perf: "One word with two pseudo copies that only change during a brief stepped burst, so the page is idle most of each cycle.",
};

export default meta;
