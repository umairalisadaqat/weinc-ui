const meta = {
  slug: "css-gradient-backgrounds-collection-with-mesh-grain-patterns-and-copy-css",
  category: "backgrounds",
  name: "100 CSS Gradient Backgrounds to Copy: Mesh, Grain, Patterns and Aurora",
  keyword: "css gradient background",
  title: "100+ CSS Gradient Backgrounds to Copy (Mesh, Grain) | We.Inc",
  description: "Free CSS gradient backgrounds: 108 linear, radial, conic, mesh, grain, pattern and aurora styles. Copy plain CSS or a Tailwind class in one click.",
  intro: "A library of 108 CSS gradient backgrounds sorted into thirteen families: linear, radial, conic, layered mesh, soft pastel, deep and dark, duotone, grain overlays, dot, grid, stripe, checker and wave patterns, blurred blobs, aurora bands, paper textures and a handful of slow animated ones. Every tile shows a short headline on top so you can judge legibility, not just colour. One click copies a self-contained rule built on a single background value, and a second button copies the same thing as a Tailwind arbitrary class wherever that is practical. Filter by family, narrow to light or dark backgrounds, and pause the moving ones. On phones the grid drops to one column and the family chips scroll sideways.",
  useWhen: [
    "A hero or pricing band needs colour behind it and you want something more considered than a two-stop fade between brand colours.",
    "You are building a dark product page and need a backdrop with depth, such as a lit corner or a soft aurora, that keeps white text readable.",
    "A blog, portfolio or newsletter wants a printed feel, which the grain, newsprint, kraft and linen entries give without loading an image file.",
    "Empty states, cards and section dividers need a subtle dot grid, graph paper or pinstripe that sits quietly behind content.",
  ],
  customize: [
    "Every entry lives in the `BACKGROUNDS` array at the top. Change any hex value in its `bg` string and the tile, the copied CSS and the Tailwind class all update together.",
    "Mesh entries are stacked `radial-gradient(at X Y, colour 0px, transparent 50%)` layers over a base colour. Move a pool by editing its `at` position, or widen it by raising `50%` to `65%`.",
    "Grain strength comes from the `noise(freq, alpha)` helper. Raise `alpha` from `0.3` to `0.45` for a rougher print, or lower `freq` to `0.5` for bigger, softer speckles.",
    "Pattern spacing is the size after the slash, for example `0 0 / 18px 18px` on Dot Grid. Make it `28px 28px` for a sparser grid.",
    "Animation speed sits in each `anim` value. Changing `bgk-tide 16s` to `30s` gives a slower drift; the copied snippet carries the same timing.",
  ],
  accessibility: [
    "Headline colour on each tile follows its `dark` flag, so the sample text demonstrates a readable pairing. If you flip a background from light to dark, flip the flag too.",
    "Filters and the tone switch are real buttons with `aria-pressed`, and a polite live region announces when something is copied.",
    "Animated backgrounds stop under `prefers-reduced-motion`, both in this gallery and inside every copied snippet, and the Pause motion button freezes them for anyone else.",
  ],
  faqs: [
    {
      question: "How do I add a gradient background in plain CSS?",
      answer: "Copy a snippet and paste it into your stylesheet, then add the class to an element, for example `<section class=\"bg-morning-mesh\">`. Because each one is a single `background` declaration, it also works inline in a `style` attribute.",
    },
    {
      question: "How do I use these gradients in Tailwind?",
      answer: "Press the Tailwind button to copy an arbitrary property class such as `[background:linear-gradient(160deg,#e0f2fe_0%,#fef3c7_100%)]` and put it in `className`. Underscores stand in for spaces. Grain and animated entries have no Tailwind button because data URIs and keyframes are cleaner in a stylesheet.",
    },
    {
      question: "What is a mesh gradient in CSS?",
      answer: "CSS has no native mesh gradient, so the effect is built by stacking several radial gradients, each fading from a colour to transparent, over a plain base colour. Where the pools overlap they blend into the soft, painterly look that design tools call a mesh.",
    },
    {
      question: "How is the grain made without an image?",
      answer: "A tiny inline SVG uses the `feTurbulence` filter to draw fractal noise, and that SVG is layered on top of the gradient as a data URI. The browser renders it once and tiles it, so there is no extra request.",
    },
    {
      question: "How do I use one in a React component?",
      answer: "Either paste the CSS into your global stylesheet and use the class name, or pass the value straight in: `<div style={{ background: \"radial-gradient(...)\" }}>`. For the animated ones, keep the keyframes in a stylesheet because inline styles cannot declare them.",
    },
    {
      question: "Are the animated backgrounds heavy?",
      answer: "They are kept slow and few. Most move `background-position`, which repaints the element, so use them on one hero rather than dozens of cards. The two that animate a registered custom property need a current browser and simply hold still in older ones.",
    },
  ],
  related: [
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
    "marbled-paper-webgl-background-with-floating-inks-combed-into-feathers-on-a-wet-size-bath",
    "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light",
  ],
  tags: ["css gradient", "gradient background", "mesh gradient", "css background", "tailwind gradient", "grain", "patterns", "aurora"],
  height: 1600,
  section: true,
  interactive: true,
};

export default meta;
