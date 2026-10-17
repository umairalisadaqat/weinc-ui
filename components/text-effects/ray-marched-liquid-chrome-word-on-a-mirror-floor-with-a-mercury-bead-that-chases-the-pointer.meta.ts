const meta = {
  slug: "ray-marched-liquid-chrome-word-on-a-mirror-floor-with-a-mercury-bead-that-chases-the-pointer",
  category: "text-effects",
  name: "Ray-Marched Liquid Chrome Word on a Mirror Floor with a Mercury Bead That Chases the Pointer",
  keyword: "3d chrome text effect webgl",
  title: "WebGL 3D Chrome Text Effect for React | We.Inc",
  description: "WebGL text effect: type a word and it is ray-marched as poured chrome on a mirror floor and a mercury bead chases the pointer. Free React and HTML code.",
  intro: "A single word standing on a black lacquer floor in front of a low orange sun, rendered as if it had been poured from mercury. Nothing here is a picture of chrome. The letters come from a small stroke typeface written into the component, so they are identical on every device. They are drawn once to a hidden canvas, inflated into a smooth cushion by solving the soap-film equation over the ink, and stored as a field that a fragment shader ray-marches every frame. Each pixel of metal reflects a small studio (a softbox overhead, a long sweep of white paper on the camera side with a black flag standing in it, an amber wash on the right, two rim glows behind, the sun painted on the back wall), the floor, and the neighbouring letters. A bead of the same metal sits on the floor after the last letter as the full stop. It lifts to follow the pointer on a spring, fuses with any letter it touches, drags the surface with it and rolls home when left alone. Typing in the field melts the word into the new one. On a phone the camera pulls back until the whole word fits the width, and a tap sends a ring through the metal.",
  useWhen: [
    "A brand or product name deserves one screen to itself before any copy starts, the way a title card opens a film.",
    "A music release, club night or fashion drop wants the heavy chrome lettering of a record sleeve, but live and touchable.",
    "A portfolio wants proof on its first screen that the studio can write shaders, without loading a 3D library.",
    "A name generator, greeting page or configurator needs the visitor's own word to become the artwork.",
  ],
  customize: [
    "`WORDS` is the list the piece plays through alone. Put one entry in it for a fixed word; the first entry is also what the field falls back to when it is emptied.",
    "`INFLATE` is how far the letters are blown up. 1 gives strokes a circular section, 1.5 is swollen, 0.6 is a shallow pressed badge.",
    "The lights are the `card(...)` lines in `dome`. Each takes a direction, a half size and an edge softness, and the colour in front of it is the gel. Delete the amber wash for a colder, more clinical metal.",
    "The sunset lives in `wall`. Swap the three colours there for blues and the whole floor, haze and every rim reflection follow, because the chrome only ever shows what the room contains.",
    "For gold, change `CHROME` to `vec3(1.0, 0.78, 0.42)`. For black chrome, use `vec3(0.35, 0.36, 0.4)`.",
  ],
  accessibility: [
    "The word is a real `h2`, visually hidden because the canvas shows it, so a screen reader announces it and a crawler indexes it. It updates as the visitor types.",
    "The canvas is marked as decoration. The text field has a visible label, and Strike is a submit button, so Enter in the field sends the ring through the letters.",
    "With reduced motion set, one frame is rendered for each word and the loop never starts: no drifting camera, no bead in motion, no melting.",
    "If WebGL 2 is not available a still of the same set is shown instead, drawn in SVG from the same letter paths with its reflection and the bead, and the field still changes the word.",
  ],
  faqs: [
    {
      question: "How can a shader ray-march an arbitrary word that the visitor just typed?",
      answer: "The shader never sees glyph outlines. JavaScript rasterises the word, then relaxes a membrane over the inked pixels on three grid sizes, coarse to fine, which takes a few tens of milliseconds. The result is a height whose square root is a rounded cushion. That height and its slope are uploaded as one half-float texture, and the shader treats the square of the depth minus twice the height as an implicit surface it can step toward.",
    },
    {
      question: "Why do the letters look poured and not bevelled?",
      answer: "A distance field extruded with a round edge leaves a ridge down the middle of every stroke, which reads as chiselled. The membrane solution has no ridge: a straight stroke comes out with an exactly circular section and junctions swell the way two drops do when they join. The normals are read through a cubic filter so the mirror shows no texel facets.",
    },
    {
      question: "What happens between two words?",
      answer: "Both fields are kept on the graphics card and blended for a little over a second. Blending inflation heights makes thin parts sink while new parts rise, so the old word appears to drain into the new one. A small extra swell is added mid way and a damped spring fattens the letters as they land.",
    },
    {
      question: "Will it hold 60 frames a second?",
      answer: "The march only runs inside a box around the word, the reflection in the floor uses a shorter march, and the drawing size is capped at 1.5 times the layout size. If frames still arrive late the component lowers its own resolution in steps and lets the browser stretch the canvas. It stops drawing when scrolled away or when the tab is hidden.",
    },
    {
      question: "Which characters can be typed, and can I change the lettering?",
      answer: "Capitals A to Z, the digits, and the marks & ! ? + and -, up to eight characters. Each one is a line in `GLYPHS`: an advance width and an SVG path for the centre of a round-ended stroke on a 74 unit tall box. Edit a path to redraw a letter, add an entry to support another character, or change `STEM` to make the whole alphabet lighter or heavier. No font file is involved.",
    },
  ],
  related: ["silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio", "layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters", "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link"],
  tags: ["chrome", "3d text", "webgl", "ray marching", "sdf", "liquid metal", "reflection", "typography"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
