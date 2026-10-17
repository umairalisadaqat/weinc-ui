const meta = {
  slug: "ray-traced-glass-pendant-loader-that-fills-with-glowing-liquid-and-focuses-a-point-of-light-under-a-wall-sized-percentage",
  category: "loaders",
  name: "Ray-Traced Glass Pendant Loader That Fills with Glowing Liquid and Focuses a Point of Light under a Wall-Sized Percentage",
  keyword: "webgl loader react",
  title: "Ray-Traced Glass Bulb Progress Loader (React, WebGL) | We.Inc",
  description: "Free React progress loader drawn by one WebGL shader: a hanging glass bulb fills with glowing liquid and focuses a point of light beside a huge percentage.",
  intro: "A loading screen staged as a still life. A blown glass bulb hangs on a cord in front of a deep green paper sweep, and a fluorescent liquid rises inside it as the percentage climbs. The percentage itself is painted on the back wall in figures taller than the bulb, so the glass shows them upside down and the liquid lights them from the side. A narrow beam falls straight down the cord, and because the liquid is a lens the pool of light on the floor tightens as the bulb fills until, at one hundred, it snaps to a single burning point and a ring of light runs out across the paper. Under the picture sit a status line, a step counter and a button that empties the bulb and starts again. On phones the figures move above the bulb and everything stays inside the width of the screen.",
  useWhen: [
    "A publish, export or render step takes ten seconds or more and deserves something worth watching while it runs.",
    "The first load of an app or a game needs a splash screen that reports real progress instead of spinning forever.",
    "A launch page or portfolio wants one piece of live rendering that visitors will record and pass around.",
    "A long upload has named phases, and each phase should read as a sentence while one number keeps counting.",
  ],
  customize: [
    "`stages` holds the status lines. Each entry has a `note` and an `until`, the last percent that note covers.",
    "`demo` is the script the preview plays, as pairs of percent and seconds. For real progress remove the block marked in the frame loop and write your own number to `s.goal`.",
    "`SIP` and `GLOW` in the shader are what the liquid absorbs and what it gives back. `SIP = vec3(2.2, 0.5, 0.06)` with `GLOW = vec3(0.1, 0.5, 1.0)` turns it into blue ink.",
    "`PAPER` is the colour of the sweep and `PAINT` the colour of the figures. Keep the paper fairly dark or the glow has nothing to show against.",
    "`DROP` is how high the bulb hangs, in bulb radii. At 1.45 the light comes to a point exactly when the bulb is full; hang it higher and the point arrives early, then spreads again.",
    "The weight of the figures is the `600` in `figures()`, and their size is `capPx` in `draw`.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Progress is reported by a real `role=\"progressbar\"` element with `aria-valuenow` and an `aria-valuetext` that reads the percent and the current status line together.",
    "The status line sits in a polite live region, so each new phase is announced once while the number changes quietly.",
    "The only control is a real button with a visible focus ring. Nudging the bulb with a pointer is decoration and changes nothing a keyboard user needs.",
    "With reduced motion the bulb hangs still and full, the script does not play by itself, and pressing the button moves the level in plain steps with no swing, ripples or rolling figures.",
  ],
  faqs: [
    {
      question: "How do I drive it with real progress instead of the demo?",
      answer: "Everything follows one number, `s.goal`, from 0 to 100. Delete the demo block at the top of the frame loop and set `s.goal` from your upload event, your fetch reader or your build log. The liquid chases that number on a spring, so even jumpy updates look like something being poured.",
    },
    {
      question: "Why does the light on the floor change shape as it fills?",
      answer: "The shader treats the bulb as the lens it would be. For each point on the floor it follows fifty-six rings of the overhead beam down through the glass, the air above the liquid, the flat surface and the curved bottom, and adds up how much lands there. A half-full bulb is a weak lens that makes a wide soft disc. A full one is a ball lens whose focus sits just under it, which is where the floor has been put.",
    },
    {
      question: "Is the glass actually refracting or is it a trick?",
      answer: "Each ray is followed through the outer wall, the inner wall, the liquid surface and any bubble in its way, bending by the real indices for glass and water and reflecting where the angle is too shallow to get out. That is why the wall appears upside down in the liquid and the right way up in the empty part above it.",
    },
    {
      question: "Why are the figures inside the picture and not HTML text?",
      answer: "So the scene can use them. Ten digits and a percent sign are drawn once to a small canvas in your page's font, and the shader sets the number from that sheet. The glass can then bend them, the liquid can light them, and a changing digit rolls like a counter without any new upload.",
    },
    {
      question: "How heavy is it to run?",
      answer: "There is no ray marching: the sphere, the liquid surface, the cap and the room are all solved exactly, so a pixel costs a few dozen arithmetic steps. The buffer is capped at about 1.3 million pixels, the loop stops when the section is off screen or the tab is hidden, and if frames run long it gives up a step of resolution.",
    },
    {
      question: "What does a browser without WebGL show?",
      answer: "A still made from CSS circles and gradients in the same layout: the bulb, the liquid at the right height, the pool of light and the percentage as real text. The progress bar semantics and the button never depended on the canvas.",
    },
  ],
  related: [
    "ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo",
    "glass-rain-gauge-progress-meter-that-fills-drop-by-drop-with-a-meniscus-and-tips-out-when-full",
    "mechanical-watch-movement-loader-with-swinging-balance-wheel-and-breathing-hairspring",
  ],
  tags: ["loader", "progress", "webgl", "ray tracing", "shader", "glass", "caustics", "percentage"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
