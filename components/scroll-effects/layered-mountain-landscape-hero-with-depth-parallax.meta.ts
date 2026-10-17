const meta = {
  slug: "layered-mountain-landscape-hero-with-depth-parallax",
  category: "scroll-effects",
  name: "Layered Mountain Landscape Hero With Depth Parallax",
  keyword: "parallax scrolling",
  title: "Parallax Scrolling Hero: Layered Mountain Landscape | We.Inc",
  description: "Free parallax scrolling hero with drawn mountain ridges that slide at different depths behind the headline. React and plain HTML, CSS and JS versions.",
  intro: "A dawn mountain scene for a small valley lodge, drawn as four inline SVG ridges, a low sun and a band of drifting mist. As the section scrolls, each layer slides at its own rate, so the far peaks seem to hang back while the dark foreground carries the buttons up and away. The headline sits between the sky and the ridges, which lets the nearer hills rise over it. On phones the ridges stretch to the screen width and the copy stays centred above them.",
  useWhen: [
    "A lodge, outdoor gear shop or trail guide wants its landing page to open on a sense of distance instead of a flat photo.",
    "You need a parallax hero that weighs almost nothing, because every layer is a short SVG path rather than a large image.",
    "The rest of the page is calm and editorial, and one moment of depth at the top is all the motion it needs.",
    "A seasonal campaign needs a quick restyle, since repainting the scene is a matter of changing five fill colours.",
  ],
  customize: [
    "Change how far back each ridge sits with its `data-depth` attribute (or the `depth` value in the `LAYERS` array): 0 travels with the page, 1 stands still, and values between 0.2 and 0.7 read as believable distance.",
    "Repaint the sky with `--w6lnd-sky-top` and `--w6lnd-sky-low`, and the ground with `--w6lnd-ground`; keep the front ridge fill equal to the ground so the hero runs into the next section without a seam.",
    "Swap the mountains for your own skyline by replacing the `d` path in each layer. Keep the 1440 by 400 viewBox and close every path along the bottom edge with `V400 H0Z`.",
    "To drive it from the page scroll instead of the preview box, set `PAGE = true` and remove `height` and `overflow-y` from `.w6lnd`.",
  ],
  accessibility: [
    "The ridges, sun and mist are inside `aria-hidden` wrappers, so a screen reader meets only the lodge name, the heading, one sentence and two links.",
    "With reduced motion requested, the script still fades the scroll hint but never moves a layer, and the mist stops; the scene rests in its composed starting position.",
    "The preview box is a focusable region with a label, so keyboard users can scroll it with the arrow keys, and the dark text on the pale sky stays well above 4.5 to 1.",
  ],
  faqs: [
    {
      question: "How does the depth effect work without background-attachment: fixed?",
      answer: "Every layer is a normal absolutely positioned element inside a hero with overflow hidden. On each scroll frame the script multiplies the scroll distance by the layer's depth and moves it down by that amount with translate3d. Far layers therefore climb more slowly than the content, which is what the eye reads as distance. Fixed backgrounds are skipped because iOS ignores them and desktop browsers repaint them on every scroll.",
    },
    {
      question: "Why does the headline disappear behind the hills as I scroll?",
      answer: "It is a layer too, placed between the sky and the ridges with a depth of 0.5. The two nearer ridges move faster than the text, so they rise over it. If you would rather keep the heading on top, give its wrapper a higher z-index than the ridges and a depth of 0.",
    },
    {
      question: "Can I use photographs instead of drawn ridges?",
      answer: "Yes, as long as each photo is a cut-out with a transparent sky, saved as PNG or WebP with explicit dimensions. Drawn SVG ridges are lighter and scale to any width without blurring, which is why this version uses them.",
    },
    {
      question: "Will it stutter on phones?",
      answer: "The scroll listener is passive and only asks for one animation frame at a time, and each frame writes a single transform per layer, which the browser handles on the compositor. When the hero is off screen an IntersectionObserver stops both the frame requests and the mist animation.",
    },
    {
      question: "How strong should the parallax be?",
      answer: "Keep the nearest moving layer close to the page speed and the furthest one well short of standing still. Big differences make headlines hard to read while they move and can bother people who are sensitive to motion, which is also why reduced motion turns the effect off.",
    },
  ],
  related: [
    "parallax-starfield-particle-background-with-slow-drift",
    "kinetic-type-line-stretching-with-scroll",
    "scroll-linked-paragraph-words-brighten-as-you-read",
  ],
  tags: ["parallax", "landscape hero", "svg layers", "depth", "scroll effect"],
  height: 640,
  section: true,
  collection: "smooth-scroll-and-parallax",
  standalone: true,
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The landscape stays in its composed starting position and the mist stops drifting.",
  perf: "One transform per layer per scroll frame from a passive listener, paused with the mist when the hero leaves the screen.",
};

export default meta;
