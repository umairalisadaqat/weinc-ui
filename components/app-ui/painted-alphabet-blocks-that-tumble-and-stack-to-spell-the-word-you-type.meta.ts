const meta = {
  slug: "painted-alphabet-blocks-that-tumble-and-stack-to-spell-the-word-you-type",
  category: "app-ui",
  name: "Painted Alphabet Blocks That Tumble and Stack to Spell the Word You Type",
  keyword: "3d letter blocks react",
  title: "React 3D Letter Blocks That Spell as You Type | We.Inc",
  description: "Text field whose word is spelled in wooden alphabet blocks on a canvas: cubes drop, tumble, bounce and stack as you type. Free React and HTML code to copy.",
  intro: "A text field with a table of wooden nursery blocks above it. Whatever is typed, up to eight letters or digits, is spelled in maple cubes with raised milk paint that has been chipped along the edges. Up to four blocks sit in a row. A fifth letter splits the word in two and the first half hops up to sit on the second. New blocks fall in spinning, land, bounce twice and rock still. When a letter changes, its block is not swapped: it hops and rolls a hidden face to the front, because every block carries six letters. Removed blocks cartwheel off the right edge. Tap any block to toss it. The cubes are true 3D, drawn on a 2D canvas with each face lit by its angle to the lamp. On phones the blocks shrink to between 60 and 70 pixels so four still fit across.",
  useWhen: [
    "A children's spelling, phonics or naming game needs the answer field to be the toy itself.",
    "A sign up step asks for a child's first name or a team name and a plain input would waste the moment.",
    "A toy shop, nursery or tutoring homepage wants a headline word visitors can retype.",
    "A word puzzle needs a tile row that can show five to eight letters at phone width without shrinking to nothing.",
  ],
  customize: [
    "`WORDS` is the list the demo cycles through, and its first entry is what the table shows on load. `DEMO = false` leaves that first word in place.",
    "`PAINTS` holds the six paint colours. Every face picks one by block and face number, so six muted tones give a quieter, more Scandinavian set.",
    "`MAPLE` is the bare timber as red, green and blue. Try `[196, 150, 100]` for cherry and darken the `#b98d55` edge fill in `draw` to match.",
    "`TILT` is how far the camera looks down in radians. `0.3` shows a strip of each top face, `0.5` shows much more of it.",
    "The letter font is the `900 ... Georgia` line in `faceTex`. Any installed family works, and the letter is centred from its measured height.",
    "`MAX` caps the word length. The layout puts half the letters on each tier, so going past eight needs a smaller `h` in `layout`.",
  ],
  accessibility: [
    "The blocks are a picture of the field's value and the canvas is hidden from assistive technology. The real control is one labelled `input type=\"text\"` that a screen reader reads normally.",
    "Typing is filtered to capital letters and digits and capped by `maxLength`, so what the field holds is always what the blocks can show.",
    "The demo words stop for good the first time the field is focused or typed in, so nothing overwrites a visitor's text.",
    "With reduced motion the blocks are placed straight into the finished word with no falling or spinning, and tapping a block does nothing.",
  ],
  faqs: [
    {
      question: "How are 3D cubes drawn without WebGL or CSS 3D?",
      answer: "The camera has no perspective, so each square face lands on screen as a parallelogram. A canvas transform can map a square image onto any parallelogram exactly, so every visible face is one `drawImage` call with its own matrix, followed by a light or dark wash that depends on how the face is turned to the lamp.",
    },
    {
      question: "Why does a block roll instead of changing its letter?",
      answer: "Each block stores six characters, one per face. When its letter changes, the new one is printed on the face that is flat against the table, where it cannot be seen, and the block is then turned so that face comes to the front.",
    },
    {
      question: "Where do the paint chips come from?",
      answer: "Each face is drawn once as a paint layer over a generated maple board. About forty small ragged shapes are cut out of the paint, most of them along the edges, and the layer is laid down with a short shadow so it sits proud of the wood. Finished faces are cached by letter, colour and board.",
    },
    {
      question: "Can I use the word in a form?",
      answer: "Yes. The `word` state is the cleaned value. Give the input a `name` to submit it, or lift the state and the `type` handler into your form component.",
    },
    {
      question: "Is this a physics engine?",
      answer: "No. Each move is a timed path: a fall that speeds up, two bounces of shrinking height and a small rock, with the spin blended between a start and end orientation. That keeps every block landing square and readable, which a free simulation would not promise.",
    },
  ],
  related: ["silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio", "pocket-radio-with-a-thumbwheel-tuning-needle-and-backlit-band", "rubber-drum-pad-step-sequencer-with-backlit-silicone-pads-that-squash-and-a-running-step-light"],
  tags: ["blocks", "alphabet", "text input", "3d", "wood", "canvas", "kids", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
