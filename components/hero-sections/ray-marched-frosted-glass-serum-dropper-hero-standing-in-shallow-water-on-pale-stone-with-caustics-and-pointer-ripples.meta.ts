const meta = {
  slug: "ray-marched-frosted-glass-serum-dropper-hero-standing-in-shallow-water-on-pale-stone-with-caustics-and-pointer-ripples",
  category: "hero-sections",
  name: "Ray-Marched Frosted Glass Serum Dropper Hero Standing in Shallow Water on Pale Stone with Caustics and Pointer Ripples",
  keyword: "skincare hero section react webgl",
  title: "Frosted Serum Dropper Hero Section (React, WebGL) | We.Inc",
  description: "Free React skincare hero: a frosted glass dropper of amber serum stands in shallow water on pale stone, with moving caustics and rings wherever you touch.",
  intro: "A bright first screen for a skincare launch, lit like a still life shot at noon by a pool. A frosted glass dropper bottle, half full of amber serum, stands on a slab of pale limestone under a finger of clear water. One fragment shader traces it all: light through the etched glass and the oil, the soft amber glow the serum throws into the bottle's own shadow, and caustic lines that the moving surface focuses onto the stone. Moving the pointer over the water sends rings out from that spot, a press sends a bigger one, and until someone touches it a drop lands by itself every few seconds. The serif headline, one line of copy and two links sit on the left; on phones they stack at the top and the bottle stands below them.",
  useWhen: [
    "A skincare, bath or wellness brand is launching one hero product and has no studio photography of it yet.",
    "The brand language is calm and clean, and a still photo would undersell the idea of water, light and texture.",
    "A first screen should invite a few seconds of play before the visitor reads the button, without hiding the copy.",
    "You want to show a browser can do frosted glass, coloured shadows and caustics with no 3D library and no image files.",
  ],
  customize: [
    "`product` at the top holds the house name, the three headline lines (the middle one is set in italic amber), the copy, both links and the size note.",
    "`SERUM` is how fast the oil absorbs red, green and blue. `[2.6, 0.6, 0.35]` gives a sea green tonic; `[0.1, 0.25, 0.6]` a pale honey. The glow in the shadow follows it.",
    "`STONE` and `SAND` are the slab and the deeper floor in linear light. Darker stone such as `[0.3, 0.3, 0.3]` gives slate; then lighten the text colours `text-[#22190f]` to keep contrast.",
    "`BULB` colours the silicone bulb and `METAL` the ribbed collar. `DEPTH` is how much water covers the stone; past about 0.2 the caustics soften and spread.",
    "The sun direction is the `sun` vector in the effect. Lowering its middle value lengthens the bottle's shadow across the stone.",
  ],
  accessibility: [
    "The headline is a real `h1` with the copy and links after it in reading order. The canvas is hidden from assistive technology because it only shows the product.",
    "Making ripples does not need a pointer: a small Touch the water button on wider screens drops one, and every link has a visible focus ring.",
    "With reduced motion one still frame is drawn with two rings already on the water, nothing drops by itself and the page copy does not slide in.",
    "Dark brown text on the pale stone stays well above 4.5 to 1. If you darken the stone, flip the text to a light colour.",
  ],
  faqs: [
    {
      question: "How is the frosted glass made without a texture?",
      answer: "Every pixel on the bottle sends three rays into it, each through a slightly different random bump of the etched surface. Their results are averaged, then mixed with light that the frost scatters inside the glass. That blurs whatever is behind the bottle the way acid-etched glass does, while the amber still reads clearly where the serum is.",
    },
    {
      question: "Where do the bright lines on the stone come from?",
      answer: "For each point of the floor the shader bends a small patch of sunlight through the water surface above it and measures how much that patch is squeezed or spread by the time it reaches the stone. Squeezed patches are brighter, spread ones are darker, and because the surface keeps moving, the lines drift and fold like a real pool floor.",
    },
    {
      question: "How do the ripples know where I touched?",
      answer: "The component keeps the same camera maths as the shader, so it can turn a point on the screen into a point on the water. Each touch stores a position, a start time and a strength in a small ring of eight slots, and the shader adds a fading, spreading wave for each one.",
    },
    {
      question: "Why does the shadow of the bottle glow orange?",
      answer: "The serum filters sunlight rather than blocking it. For points in the shadow the shader walks toward the sun, adds up how much oil lies in the way and lets through that much amber light, so the middle of the shadow is warm and the outline stays darker.",
    },
    {
      question: "Will it run on an ordinary laptop?",
      answer: "The buffer is capped at about 1.15 million pixels and 1.5 device pixels per CSS pixel, and only bottle pixels pay for the trip through the glass. If frames run long the canvas gives up resolution in steps. Drawing stops when the section is off screen or the tab is hidden.",
    },
    {
      question: "What appears where WebGL is not available?",
      answer: "A CSS version of the set: a pale stone gradient with soft patches of light and a bottle built from gradients with its bulb, collar and amber serum. The headline, copy and links are plain HTML and look the same in both cases.",
    },
  ],
  related: [
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
    "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light",
    "photograph-in-an-enamel-darkroom-tray-under-water-that-ripples-where-the-pointer-drags",
  ],
  tags: ["hero", "webgl", "ray marching", "shader", "frosted glass", "caustics", "water", "skincare", "product"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
