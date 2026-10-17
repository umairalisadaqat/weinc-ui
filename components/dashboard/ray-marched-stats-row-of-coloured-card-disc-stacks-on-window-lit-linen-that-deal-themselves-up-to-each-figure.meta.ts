const meta = {
  slug: "ray-marched-stats-row-of-coloured-card-disc-stacks-on-window-lit-linen-that-deal-themselves-up-to-each-figure",
  category: "dashboard",
  name: "Ray-Marched Stats Row of Coloured Card Disc Stacks on Window-Lit Linen That Deal Themselves Up to Each Figure",
  keyword: "react stats row webgl",
  title: "3D Stats Row of Card Disc Stacks in WebGL (React) | We.Inc",
  description: "Free React stats row where three figures stand as piles of coloured card discs on linen, ray marched in WebGL, that drop in or lift away when the period changes.",
  intro: "Three shop figures, each shown twice: once as a big number set in tight grotesque type, and once as a pile of thin dyed card discs standing on a pale linen cloth. Each disc stands for a fixed amount printed under its number, so the height of a pile is the figure itself rounded to whole discs. Late light comes through a window on the left, so the cloth carries the soft bars of its frame and each pile throws a long shadow to the right. Pick another period and the piles rebuild one after another: missing discs drop in from above and land with a small bounce, spare ones lift off the top and tip away, and the numbers count along with the cards that have actually landed. Tapping a figure throws the top cards of its pile into the air to fall back in order. On phones the three figures sit in a narrow row under the piles and the period buttons wrap under the heading.",
  useWhen: [
    "A shop or studio dashboard opens with three headline figures and you want them to feel counted out by hand rather than plotted.",
    "You compare one period with earlier ones and want the size of the change to be something people watch happen.",
    "An annual review or investor page needs a single striking still image of three numbers that still reads as data.",
    "You want a working example of ray marching thin repeated geometry, soft window shadows and progressive anti-aliasing without a 3D library.",
  ],
  customize: [
    "`stats` holds the three labels, the amount one disc stands for (`unit`) and each card colour as a hex value. Keep a stack under about 45 discs by raising `unit` for large figures.",
    "`periods` holds the figures for each button. Add a fourth row and a fourth button appears; the demo walks through every row in order.",
    "`T` is the thickness of one card and `R` its radius in scene units. A thicker `T` such as 0.08 turns the cards into chunky poker-style chips with fewer, taller layers.",
    "The window light is `sa` and `se` in `draw()`: its bearing and height in radians. Raise `se` toward 0.8 for shorter, midday shadows; the mullion spacing is the `vec2(1.55, 2.2)` in the shader's `window` function.",
    "The fall is set in `step()`: `19` is gravity, `0.2` the bounce kept on landing and `34` the milliseconds between one card and the next.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Each figure is a real button whose label reads the number, what it counts and what one disc stands for, and a hidden table lists every period.",
    "The period buttons sit in a labelled group and use `aria-pressed`, so the chosen period is announced, and every control is reachable with Tab and has a visible focus ring.",
    "Nothing depends on hovering: moving the pointer only tilts the view slightly, and the same tap or Enter press that knocks a pile works from the keyboard.",
    "With reduced motion the piles jump straight to their new heights, the view stops following the pointer and the self-running demo never starts.",
  ],
  faqs: [
    {
      question: "How can a pile of forty separate discs be drawn quickly in a shader?",
      answer: "Discs at rest sit at known heights, so for any point the shader works out which layer it is level with and only measures the distance to that disc and the two either side. Cards in the air are kept in a short list of their own. Every pile also has a bounding cylinder, so rays that pass beside it skip the work entirely.",
    },
    {
      question: "Is the height of a pile exact?",
      answer: "It is the figure divided by the disc unit and rounded to the nearest whole disc, which is why each number carries a line saying what one disc is worth. The number above the pile is always the exact figure once the cards have settled.",
    },
    {
      question: "Why does the image get sharper a moment after it stops moving?",
      answer: "While nothing moves, every frame is traced with the camera nudged by a fraction of a pixel and the lens opened slightly, then blended into the frames before it. After about forty passes the edges are smooth, the grain of the linen resolves and the far cloth falls gently out of focus.",
    },
    {
      question: "What shows when WebGL 2 is not available?",
      answer: "A flat front view made from CSS gradients: three striped piles in the same card colours, sized from the same disc counts, with an elliptical top and a soft shadow. The numbers, buttons and table are ordinary markup and work exactly the same.",
    },
    {
      question: "Can I connect it to live figures?",
      answer: "Yes. Replace the `values` arrays with your own numbers and call the same `go` function when they change. Each pile works out how many discs it needs from where it is now, adds or removes them one at a time, and the number follows the cards.",
    },
  ],
  related: [
    "ray-traced-cast-glass-column-bar-chart-that-rises-through-steel-collars-and-throws-amber-to-ruby-light-across-a-white-floor",
    "savings-chart-of-minted-coin-stacks-where-each-deposit-drops-a-coin-that-wobbles-and-settles",
    "big-headline-hero-with-stats-row",
  ],
  tags: ["stats row", "kpi", "webgl", "ray marching", "dashboard", "3d chart", "paper", "data visualisation"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
