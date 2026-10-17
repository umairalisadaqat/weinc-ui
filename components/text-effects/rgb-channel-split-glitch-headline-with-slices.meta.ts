const meta = {
  slug: "rgb-channel-split-glitch-headline-with-slices",
  category: "text-effects",
  name: "RGB Channel Split Glitch Headline",
  keyword: "glitch text effect",
  title: "RGB Split Glitch Text Effect in Pure CSS | We.Inc",
  description: "Free glitch text effect in pure CSS: red and cyan copies of a headline tear into horizontal slices in two short bursts, then settle. React and HTML versions.",
  intro: "A dark hero headline whose red and cyan colour channels sit two pixels apart, like a slightly misaligned monitor, and tear into horizontal slices during two brief bursts in every cycle. Between bursts the type rests, so the line stays easy to read. It is pure CSS: two pseudo elements copy the text from a data attribute, and clip-path cuts the slices. On phones the headline wraps and the copies wrap with it.",
  useWhen: [
    "A music, gaming or nightlife site wants one headline with an analogue, broadcast feel without turning the whole page into noise.",
    "You need a glitch that reads clearly at rest, so a screenshot or a slow reader still sees clean words most of the time.",
    "You want the effect without a script, because the headline sits in a static page or an email landing page with no build step.",
  ],
  customize: [
    "Recolour the channels with `--w10rgb-red` and `--w10rgb-cyan`. Keep them roughly opposite on the colour wheel so the fringes stay distinct on a dark background.",
    "Make the bursts rarer by raising `--w10rgb-cycle` from 4.6s to something like 8s. The burst length scales with it, so also move the 3% to 9% keyframes closer together if you want them to stay snappy.",
    "Change the words in three places: the hidden `w10rgb-sr` span, the `data-text` attribute and the visible text inside `w10rgb-word`. The pseudo elements read `data-text`, so a mismatch leaves a ghost of the old words.",
    "Move the slices by editing the `inset()` percentages. The first value is the cut from the top and the third the cut from the bottom, so `inset(40% 0 40% 0)` leaves a thin band through the middle.",
  ],
  accessibility: [
    "Screen readers get the headline once from a visually hidden span; the visible copy and both coloured pseudo copies are marked `aria-hidden`, so the text is never read three times.",
    "Each cycle has two bursts of under half a second, which keeps the flicker far below three flashes per second. With reduced motion turned on, the bursts stop and only the static two pixel split remains.",
    "The animation pauses when the section scrolls out of view, and the button keeps a visible focus ring in the cyan accent.",
  ],
  faqs: [
    {
      question: "How does a CSS glitch text effect work?",
      answer: "The text is drawn three times. The base copy is normal, and two pseudo elements repeat it from `content: attr(data-text)` in different colours. Animating `clip-path: inset()` shows only a horizontal band of each copy while `transform` pushes that band sideways, which looks like a torn video line.",
    },
    {
      question: "Why use mix-blend-mode screen on the coloured copies?",
      answer: "Screen blending adds light, so where red and cyan overlap the off-white base they stay white and only the edges show colour. Without it, the top copy would hide the base text and the headline would turn cyan.",
    },
    {
      question: "Is a glitch effect safe for people with photosensitive epilepsy?",
      answer: "It can be if it is brief and small. This one runs two short bursts per cycle and moves thin slices rather than flashing large bright areas, and it switches off completely for visitors who ask their system for less motion. Avoid speeding the cycle up to many bursts per second.",
    },
    {
      question: "Can I use this on several lines of text?",
      answer: "Yes. The pseudo copies are positioned over the whole word box with `inset: 0`, so they wrap exactly like the base text. Very long paragraphs look busy, though, so keep it for a headline or a short label.",
    },
    {
      question: "Does it work on a light background?",
      answer: "Screen blending only brightens, so on white the fringes disappear. For a light page switch the pseudo elements to `mix-blend-mode: multiply` and use darker channel colours such as a deep red and a teal.",
    },
  ],
  related: [
    "css-text-effects-and-hover-animations-collection-with-copyable-css-for-every-effect",
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
  ],
  tags: ["glitch text effect", "glitch text css", "rgb split", "clip-path animation", "css headline"],
  height: 560,
  section: true,
  collection: "glitch-text-effect",
  standalone: true,
  tech: "css",
  reducedMotion: "The headline stays still with a fixed two pixel red and cyan offset and no slicing.",
  perf: "Two pseudo elements animate clip-path and transform in short stepped bursts; no JavaScript beyond an off-screen pause.",
};

export default meta;
