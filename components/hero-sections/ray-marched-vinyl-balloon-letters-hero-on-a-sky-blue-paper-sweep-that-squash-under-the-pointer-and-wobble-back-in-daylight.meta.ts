const meta = {
  slug: "ray-marched-vinyl-balloon-letters-hero-on-a-sky-blue-paper-sweep-that-squash-under-the-pointer-and-wobble-back-in-daylight",
  category: "hero-sections",
  name: "Ray-Marched Vinyl Balloon Letters Hero on a Sky Blue Paper Sweep That Squash Under the Pointer and Wobble Back in Daylight",
  keyword: "webgl balloon letters hero react",
  title: "Ray-Marched Balloon Letters Hero Section (React, WebGL) | We.Inc",
  description: "Free React hero: puffed vinyl balloon letters traced in a WebGL shader stand on a blue paper sweep in daylight and squash and wobble when pressed.",
  intro: "A bright first screen for anything that sells a good time. One word stands on a sky blue paper sweep as five puffed vinyl balloons, each in its own colour, each turned and tipped a little as if someone had just set it down. They are not pictures: a fragment shader blows the outline of every letter up like a sealed bag, then traces daylight across it, so the window of the studio slides over each glossy skin, the welded seam shows round the edges and every balloon throws a soft shadow and a wash of its own colour onto the paper. Press a letter and a dimple follows your finger while it sinks and spreads; let go and it springs back past its mark and wobbles. Under the set sit a two line headline, one sentence and two links in real type. On phones the word shrinks to the width of the screen at the top and the copy stacks beneath it.",
  useWhen: [
    "A party venue, toy shop, kids' class or festival wants its first screen to feel like a room already decorated for the day.",
    "The brand has a short, happy word (a name, a day, a shout) that deserves to be an object rather than a line of text.",
    "You want a playful hero that still keeps a calm, readable headline and a single clear button underneath.",
    "A launch page needs a few seconds of play before the visitor scrolls, without autoplaying video or sound.",
  ],
  customize: [
    "`venue` at the top holds the brand, the balloon `word` (up to eight letters), the two headline lines, the sentence and both link labels. The word is refitted to the frame, so three letters and eight letters both fill it.",
    "`COLOURS` lists one colour per letter in linear light. Repeat a single entry such as `[0.9, 0.9, 0.92]` five times for an all white set, or use pastel values near 0.6 for a softer party.",
    "`PAPER` is the sweep in linear light. `[0.95, 0.55, 0.62]` gives a pink set; update `bg-[#a7d3f2]` and the gradient on the stage to the matching screen colour so the fallback agrees.",
    "`INFLATE` sets how hard the letters are blown up. Around 0.8 gives flat cushions, 1.6 gives round, nearly tubular balloons.",
    "`restYaw` and `restLean` inside the effect are the turn and tilt each letter rests at. Set them all to 0 for a strict straight line.",
  ],
  accessibility: [
    "The headline is a real `h1` and the balloons are a canvas hidden from assistive technology, so a screen reader hears the headline, the sentence and the two links in that order.",
    "Every letter can be squeezed from the keyboard through the small row of letter buttons, each named for the letter it presses, with a visible focus ring.",
    "With reduced motion the scene renders once, refines over a few passes and stops; no squeeze plays by itself and the letter buttons are hidden.",
    "Navy text on pale blue clears 4.5 to 1. Check the pair again if you change `PAPER` to something darker.",
  ],
  faqs: [
    {
      question: "How are the balloon shapes made without a 3D model?",
      answer: "The word is set once on a 2D canvas in a heavy rounded face. For every pixel inside the letters the code solves how far a stretched skin would bulge if the outline were held flat and the inside were pumped full, which is the same sum a soap film obeys. The square root of that bulge gives the thickness of the balloon at that point, so narrow strokes become round tubes and wide bowls swell into cushions.",
    },
    {
      question: "Why do the letters look glossy rather than painted?",
      answer: "Each pixel on a letter reflects a small daylight studio built in the shader: a large window to the left, a scrim overhead and a white card to the right. The reflection is weighted by how glancing the view is, so edges turn mirror bright and the centres keep their colour. A tight sun highlight and a slightly rougher seam finish the vinyl.",
    },
    {
      question: "What happens when I press a letter?",
      answer: "Three springs answer. The letter sinks and spreads while it is held, keeping its volume, a dimple forms under the pointer and follows it, and on release a sideways twist is kicked in. The springs are lightly damped, so the balloon overshoots and settles in a few small bounces.",
    },
    {
      question: "Can I use my own font for the balloons?",
      answer: "Yes. Change `BALLOON_FONT` at the top. Rounded heavy faces inflate best because sharp corners pinch into points. If your font loads after the first frame, the word is set and blown up again once it arrives.",
    },
    {
      question: "How expensive is it to run?",
      answer: "The drawing buffer is capped near 1.7 million pixels and 1.6 device pixels per CSS pixel, the march only runs inside a box round the word, and the loop stops altogether when the picture has finished refining. It also stops when the section scrolls out of view or the tab is hidden, and it lowers its own resolution if frames run long.",
    },
    {
      question: "What does a visitor without WebGL see?",
      answer: "The same word set in coloured rounded type with a highlight and a soft shadow on the blue paper, and the headline, sentence and links exactly as they are in the full version.",
    },
  ],
  related: [
    "silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio",
    "ray-marched-liquid-chrome-word-on-a-mirror-floor-with-a-mercury-bead-that-chases-the-pointer",
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
  ],
  tags: ["hero", "webgl", "ray marching", "shader", "balloon", "vinyl", "party", "playful"],
  height: 780,
  interactive: true,
  section: true,
};

export default meta;
