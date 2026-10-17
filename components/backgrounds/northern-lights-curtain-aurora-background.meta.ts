const meta = {
  slug: "northern-lights-curtain-aurora-background",
  category: "backgrounds",
  name: "Northern Lights Curtain Aurora",
  keyword: "aurora background css",
  title: "Aurora Background in CSS: Northern Lights Curtains | We.Inc",
  description: "Free aurora background in pure CSS: soft green curtains with vertical rays sway over a spruce ridge and a starry night. React and plain HTML versions.",
  intro: "A night sky over a dark spruce ridge where three translucent curtains of green light lean, stretch and sway. Each curtain is a vertical colour fade cut into uneven rays by a CSS mask, so it reads as hanging light rather than a blurry blob, and its top edge fades into a dusky rose the way real auroras do. A film grain layer keeps the dark blues smooth. On phones the ridge stays pinned to the bottom edge while the curtains scale with the section.",
  useWhen: [
    "A travel, cabin or winter tour page wants the night sky to sell the trip before anyone reads a word.",
    "You need an aurora effect that stays believable, with muted greens and visible rays instead of a neon glow.",
    "The page must stay light: no canvas, no script loop and nothing that keeps the main thread busy.",
    "A dark product launch or event page wants slow, atmospheric motion that never pulls focus from the headline.",
  ],
  customize: [
    "Retint the light with `--nlc-green` and `--nlc-rose` on `.nlc-hero`; they are plain r, g, b triples so the alpha steps in the gradient keep working.",
    "Slow the sway by raising `--nlc-speed` from `22s` to `34s`. The three curtains derive their own durations from it, so they stay out of step.",
    "Change the ray pattern in the `.nlc-rays` mask: the stops repeat every 80px, so widening the gaps between the solid `#000` stops gives fewer, broader rays.",
    "Swap the spruce ridge for your own skyline by replacing the `RIDGE` path; the SVG keeps a 1440 by 120 viewBox and pins itself to the bottom edge.",
  ],
  accessibility: [
    "Everything in `.nlc-sky`, including the ridge SVG, sits inside one `aria-hidden` wrapper with pointer events turned off, so assistive technology meets only the hero text and link.",
    "With reduced motion requested, all animations stop and the curtains rest in their middle pose, which still reads as a full aurora.",
    "The headline carries a soft dark text shadow and the curtains stay translucent, which keeps white type well above 4.5 to 1 even where the brightest green passes behind it.",
  ],
  faqs: [
    {
      question: "How are the aurora rays made without canvas?",
      answer: "Each curtain has a child element with a vertical gradient from green to rose. A repeating linear gradient used as a mask cuts that colour into thin vertical strips of different strengths. The child slides sideways slowly, so the rays seem to flicker along the curtain while the fade at the edges stays put.",
    },
    {
      question: "Why do the curtains lean and stretch instead of sliding?",
      answer: "Real auroras ripple in place more than they travel. The sway keyframes combine a small translate with skewX and scaleY from the bottom edge, which makes each curtain fold and lift like fabric in a draught.",
    },
    {
      question: "Is mask-composite supported widely enough?",
      answer: "The curtain uses both the standard `mask-composite: intersect` and the prefixed `-webkit-mask-composite: source-in`, which covers current Chrome, Edge, Safari and Firefox. If a very old browser ignores the second mask, the curtain simply shows wider edges.",
    },
    {
      question: "Does it stop when the visitor scrolls past it?",
      answer: "Yes. A small IntersectionObserver adds a data attribute to the section when it leaves the viewport, and one CSS rule pauses every animation inside it until it returns.",
    },
    {
      question: "How do I keep the colours from looking neon?",
      answer: "Keep the green desaturated and let the curtains blend with `mix-blend-mode: screen` at under full opacity. Brighter, purer greens or a pink top at high strength quickly tip the scene into a poster look.",
    },
  ],
  related: [
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
    "css-gradient-backgrounds-collection-with-mesh-grain-patterns-and-copy-css",
  ],
  tags: ["aurora", "northern lights", "css", "night sky", "hero background", "grain"],
  height: 640,
  section: true,
  collection: "animated-gradient-background",
  standalone: true,
  tech: "css",
  reducedMotion: "The curtains stop in a middle pose over the ridge, so the still sky still shows a full aurora.",
  perf: "Three blurred curtain layers move by transform on the compositor and one observer pauses them off screen; no frame loop.",
};

export default meta;
