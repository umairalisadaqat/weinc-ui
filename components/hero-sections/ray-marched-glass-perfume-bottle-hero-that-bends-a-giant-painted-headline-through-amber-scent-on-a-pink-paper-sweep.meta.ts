const meta = {
  slug: "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
  category: "hero-sections",
  name: "Ray-Marched Glass Perfume Bottle Hero That Bends a Giant Painted Headline Through Amber Scent on a Pink Paper Sweep",
  keyword: "webgl product hero react",
  title: "Ray-Marched Perfume Bottle Hero Section (React, WebGL) | We.Inc",
  description: "Free React hero section: a glass perfume bottle traced in a WebGL shader stands in front of a giant painted headline and bends the letters through its amber scent.",
  intro: "A first screen for one product, shot like a studio still life. The headline is not laid over the picture: it is painted in crimson on the back of a pink paper sweep, as wide as the frame, and a heavy glass bottle stands in front of its second letter, so the cobalt ball stopper lands exactly where the dot of the i would be. One fragment shader follows every ray into the glass, through the scent and the pocket of air above it, and out the far side, so the stems of the letters behind arrive bent, broken at the liquid line and stained amber. A lamp behind the set throws the bottle's shadow toward the lens with a pool of gold light inside it. To the right sit one serif line, one button and a size note. Dragging turns the bottle and the liquid leans and rings down after it. On phones the bottle moves to the centre under the word and the copy stacks at the bottom.",
  useWhen: [
    "A fragrance, spirits or skincare launch has a name worth setting two hundred pixels tall and no studio photography yet.",
    "You want the product name itself to be the headline, with the object physically standing in front of it instead of sitting beside it.",
    "A single-product shop needs a first screen people play with for a few seconds before they reach the button.",
    "A pitch or portfolio piece has to show that a browser can do refraction, coloured shadows and depth of field without a 3D library.",
  ],
  customize: [
    "`product` at the top holds the house name, the giant `word`, the serif `line`, the button text and the size note. The word is refitted to the frame, so five letters and nine letters both run edge to edge.",
    "`PAPER` and `INK` are the sweep and the paint, in linear light. `[0.2, 0.5, 0.95]` paper with `[0.95, 0.9, 0.8]` ink gives a blue set with cream lettering; update the `bg-[#f4b6c0]` fallback colour on the section to match.",
    "`SCENT` is how quickly the liquid absorbs red, green and blue. `[2.4, 0.5, 0.2]` turns the amber into a sea green, and the light pooled in the shadow follows.",
    "`CAP` is the lacquer of the ball stopper and `GOLD` in the shader is the collar under it.",
    "`STAND` picks which letter the bottle stands in front of, counting from 0. Point it at an i, an l or a j and the stopper becomes part of the word.",
    "`HERO` is the resting turn in radians and `FILL` the height of the liquid. A `HERO` of 0 faces the label square to the lens.",
    "The lamp direction is `sa` and `se` in `draw`. Raising `se` toward 1.1 gives a short midday shadow.",
  ],
  accessibility: [
    "The word is a real `h1` in the page. The canvas that repaints it on the wall is hidden from assistive technology, so a screen reader meets the heading, the line and the link in that order.",
    "The call to action is an ordinary link with a visible focus ring. Turning the bottle is also offered as a small text button on wide screens, so nothing depends on dragging.",
    "With reduced motion the bottle keeps its pose, the lamp stops drifting and no turn plays by itself. The picture is refined over a few passes and then the loop stops.",
    "Body copy is dark maroon on pale pink and the button is white on cobalt; keep both pairs above 4.5 to 1 if you change `PAPER`.",
  ],
  faqs: [
    {
      question: "How does the bottle bend the headline without a 3D library?",
      answer: "The glass, the cavity inside it and the liquid surface are signed-distance functions. A ray that lands on the bottle is refracted in, then stepped from one boundary to the next. At each boundary the shader bends it again by the ratio of the two materials, or reflects it when the angle is too shallow to escape. Whatever it finally leaves toward, usually the painted wall, is what that pixel shows.",
    },
    {
      question: "Is the giant word text or part of the picture?",
      answer: "Both. An `h1` holds the word for search engines, screen readers and devices without WebGL. For the render the same string is drawn once on a 2D canvas with tight tracking, uploaded as a texture and sampled wherever a ray reaches the back wall, which is how it can pass through the glass.",
    },
    {
      question: "Why does the shadow glow instead of being grey?",
      answer: "Glass and perfume do not block a lamp, they filter and gather it. For each point on the paper the shader walks toward the lamp, adds up how much liquid and glass lie in the way, and lets through that much amber light, brighter where the path runs deep through the middle and dark along the outline.",
    },
    {
      question: "What does the liquid do when the bottle turns?",
      answer: "Its surface is a tilted plane on two springs. Every change in turning speed pushes the plane over, and the springs let it rock back and forth a few times before it lies flat. Because the surface is a real boundary in the trace, the bright line along it and the letters seen through it move with every wobble.",
    },
    {
      question: "How heavy is it to run?",
      answer: "The buffer is capped near one and a half million pixels and one and a half device pixels per CSS pixel. Only pixels on the bottle pay for the walk through the glass, and paper pixels pay for a shadow only when their path to the lamp crosses the bottle. If frames run long the loop gives up a step of resolution, and it stops when the section scrolls away or the tab is hidden.",
    },
    {
      question: "What shows on a device with no WebGL?",
      answer: "The heading stays where it is in crimson on a pink gradient and a bottle built from CSS gradients stands in front of it, with the same label, ball stopper and amber shadow. The line and the button are plain HTML either way.",
    },
  ],
  related: ["ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo", "olive-oil-bottle-hero-turning-on-a-seamless-backdrop-with-the-headline-orbiting-round-the-glass", "heavy-glass-perfume-bottle-you-tilt-with-amber-liquid-that-stays-level-and-a-gold-stopper-that-lifts-out"],
  tags: ["hero", "webgl", "ray marching", "shader", "glass", "refraction", "perfume", "product"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
