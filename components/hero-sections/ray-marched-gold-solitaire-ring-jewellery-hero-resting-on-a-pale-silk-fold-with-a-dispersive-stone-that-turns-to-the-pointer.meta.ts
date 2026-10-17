const meta = {
  slug: "ray-marched-gold-solitaire-ring-jewellery-hero-resting-on-a-pale-silk-fold-with-a-dispersive-stone-that-turns-to-the-pointer",
  category: "hero-sections",
  name: "Ray-Marched Gold Solitaire Ring Jewellery Hero Resting on a Pale Silk Fold with a Dispersive Stone That Turns to the Pointer",
  keyword: "jewellery hero section react webgl",
  title: "Gold Solitaire Ring Hero Section (React, WebGL) | We.Inc",
  description: "Free React jewellery hero: a gold ring with a brilliant-cut stone stands in a fold of pale silk, throwing coloured fire as the pointer turns it.",
  intro: "A first screen for a jeweller that wants the piece to feel photographed, not drawn. A yellow gold solitaire stands upright in a fold of champagne silk, lit from a window behind and to the left. One fragment shader traces the whole still life: the band reflects the room, the silk and its own inside; the stone is cut as 73 real facets, and red, green and blue light are bent by slightly different amounts inside it, so the window breaks into flecks of colour as the ring turns. Light that passes through the stone lands on the silk as small coloured sparks inside the ring's shadow. Every frame looks through a different point of a small lens and a different spot inside each pixel, and the frames are blended, which gives smooth edges and a real soft background. Moving the pointer across the section turns the ring on a weighted spring; left alone it rocks slowly by itself.",
  useWhen: [
    "A jeweller, watchmaker or small goldsmith is launching one signature piece and wants a first screen that sells the material.",
    "There is no studio shoot yet, or the brand wants a hero that reacts when a visitor moves rather than a fixed photo.",
    "The page is calm and editorial, with a big serif headline and one clear action such as choosing a ring size.",
  ],
  customize: [
    "`piece` at the top holds the house name, the three headline lines (the middle one is set in italic gold), the sentence under it, both links and the small note.",
    "`GOLD` is how strongly the metal reflects red, green and blue. `[0.95, 0.93, 0.88]` turns it into white gold or platinum and `[1.0, 0.62, 0.42]` into rose gold.",
    "`STONE_TINT` colours the stone. Plain white reads as a diamond; `[0.55, 0.7, 1.0]` gives a pale sapphire and `[1.0, 0.6, 0.7]` a pink one.",
    "`IOR` sets how much each colour bends inside the stone. Pull the three numbers closer together for a calmer stone with less colour; spread them for more fire.",
    "`SILK` is the colour of the cloth. Darker silk works too, but switch the text colours such as `text-[#24170c]` to a light shade to keep contrast.",
  ],
  accessibility: [
    "The headline is a real `h1`, followed by the sentence and the two links in reading order. The canvas is hidden from assistive technology because it only shows the ring.",
    "Turning the ring does not need a pointer: two labelled buttons in the lower right turn it left and right, and every control has a visible focus ring.",
    "With reduced motion the ring does not rock by itself and the copy does not slide in. A few frames are gathered into one sharp still, then drawing stops until someone asks it to turn.",
    "The darkest brown text on the pale silk stays well above 4.5 to 1. The italic middle line is a deeper gold chosen for the same reason.",
  ],
  faqs: [
    {
      question: "Where does the coloured sparkle in the stone come from?",
      answer: "Each pixel on the stone is traced three times, once for red, once for green and once for blue, and each uses a slightly different index of refraction. The rays bounce around inside the facets up to six times before they escape and look up the room around them. Because the three colours leave at slightly different angles, a bright window pane can appear red in one facet and blue in the next.",
    },
    {
      question: "Is the stone a model file?",
      answer: "No. The cut is written as a list of flat faces (table, star, bezel, girdle and pavilion facets) worked out when the module loads and pasted into the shader. A ray against the stone is a quick test against those planes, so the edges stay perfectly crisp at any size.",
    },
    {
      question: "Why do the edges look so clean for a shader?",
      answer: "Every frame the camera moves by a fraction of a pixel and looks through a different point of a small lens. Those frames are blended into a running average, which smooths the edges of the gold and the facets and lets the silk in the distance fall softly out of focus. When the ring turns quickly the blend favours the newest frame so nothing smears.",
    },
    {
      question: "How heavy is it to run?",
      answer: "The drawing buffer is capped at about 1.1 million pixels and 1.5 device pixels per CSS pixel. Only pixels near the ring pay for the gold and stone, the silk uses a short height march, and if frames run long the canvas gives up resolution in steps. Drawing stops when the section is off screen or the tab is hidden.",
    },
    {
      question: "What shows when WebGL is missing?",
      answer: "A still made in CSS: a soft champagne backdrop with a band of light, a gold ring built from a conic gradient and a square-set stone. The copy and buttons are ordinary HTML and do not change.",
    },
  ],
  related: [
    "ray-marched-frosted-glass-serum-dropper-hero-standing-in-shallow-water-on-pale-stone-with-caustics-and-pointer-ripples",
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
    "velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light",
  ],
  tags: ["hero", "webgl", "ray tracing", "shader", "jewellery", "gold", "gemstone", "dispersion", "silk", "product"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
