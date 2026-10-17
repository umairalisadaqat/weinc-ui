const meta = {
  slug: "crt-phosphor-flicker-headline-amber-terminal",
  category: "text-effects",
  name: "CRT Phosphor Flicker Headline",
  keyword: "crt text effect css",
  title: "",
  description: "",
  intro: "Amber monospace type glowing on a curved, vignetted tube screen set inside a warm bezel. The phosphor dims by a few percent at uneven moments, a faint bright band rolls slowly down the glass, and a block cursor ticks after the headline. It is a quiet, believable monitor rather than a loud malfunction, and fits repair shops, archives and developer tools.",
  useWhen: [
    "A workshop, archive or command line product wants a hero that looks like an old terminal without hurting legibility.",
    "You need a glitch-family effect calm enough for a whole paragraph, since the flicker never drops below ninety percent brightness.",
  ],
  customize: [
    "Switch to a green screen by setting `--w10crt-phosphor` to `#7dff9b` and `--w10crt-glow` to a matching translucent green.",
    "Slow or quicken the rolling band with `--w10crt-roll`, and remove the cursor by deleting the `w10crt-caret` span.",
  ],
  accessibility: [
    "The text is ordinary heading and paragraph markup, the cursor is hidden from screen readers, and amber on near-black passes contrast easily. Reduced motion holds full brightness, parks the band and stops the cursor blinking.",
  ],
  faqs: [],
  related: [],
  tags: ["crt text effect", "terminal text css", "phosphor glow", "retro monitor", "flicker animation"],
  height: 720,
  section: true,
  collection: "glitch-text-effect",
  tech: "css",
  reducedMotion: "A steady amber screen at full brightness with the scan band parked near the top and a solid cursor.",
  perf: "Opacity flicker and one translated gradient band; the layered text shadows are painted once and then only faded.",
};

export default meta;
