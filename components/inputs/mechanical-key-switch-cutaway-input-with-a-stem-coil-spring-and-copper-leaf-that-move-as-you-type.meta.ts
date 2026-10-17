const meta = {
  slug: "mechanical-key-switch-cutaway-input-with-a-stem-coil-spring-and-copper-leaf-that-move-as-you-type",
  category: "inputs",
  name: "Mechanical Key Switch Cutaway Input with a Stem, Coil Spring and Copper Leaf That Move as You Type",
  keyword: "mechanical keyboard switch animation react",
  title: "React Text Input with a Key Switch Animation | We.Inc",
  description: "Text input with a sawn-open keyboard switch above it: each keystroke drives the stem down and closes the contacts. Free React and HTML code.",
  intro: "A text field with a key switch sectioned down the middle sitting over it, drawn on a canvas the way a parts catalogue would show one. Type in the field and the cream keycap sinks with each keystroke. The blue stem slides through the smoked top housing, the gold coil closes up turn by turn, and the wedge on the stem's leg bends the copper leaf sideways until its gold pip meets the fixed one. At that moment a small flash jumps the gap and the lamp at the end of the board track lights. Let go and the leaf follows the wedge back, so the lamp goes out a little above the point where it came on. You can also press and hold the keycap itself with a mouse or finger. On phones the drawing is 330 pixels wide and the field keeps a 44 pixel tap height.",
  useWhen: [
    "A keyboard shop or switch review page wants the first field on the page to explain what a switch does without a diagram and three paragraphs.",
    "A typing test, word game or code playground needs its main text box to feel like hardware.",
    "A newsletter or waitlist form for a hardware product can afford one playful field above the fold.",
    "A teaching page about how keys register needs a model readers can hold halfway down and study.",
  ],
  customize: [
    "`STEM` is the stem plastic as three numbers. `[196, 52, 44]` gives a red linear look and `[122, 86, 46]` a brown tactile one.",
    "`WIRE` colours the spring. Swap it for `[190, 196, 204]` if you prefer plain steel to gold plating.",
    "`PHRASE`, `START` and `MAX` set what the self-running demo types, how many letters are present on load and the field's length limit.",
    "`TRAVEL` is the stroke in drawing units. The leaf closes a little before half of it, which is where the wedge on the left leg reaches full width.",
    "The labels come from the `call(...)` lines. Delete any of them, or change the text in the first argument, to relabel the drawing in another language.",
  ],
  accessibility: [
    "The field is a normal labelled `input`, so screen readers, autofill managers and on-screen keyboards treat it like any other text box.",
    "The keycap has its own `button` with a spoken name. Enter or Space on it types the next demo letter, the same as a click.",
    "The canvas is hidden from assistive technology and the open or closed word under the field is deliberately not a live region, because announcing it on every keystroke would drown out the typing.",
    "With reduced motion the parts jump between rest and bottomed out with no spring, and the demo does not run.",
  ],
  faqs: [
    {
      question: "Does it react to the real keyboard or only to clicks?",
      answer: "Both. The field listens for key down and key up, so the switch goes down when your finger does and stays down for as long as you hold the key. Auto-repeat is ignored, which stops a held key from making the stem chatter.",
    },
    {
      question: "How is the coil spring drawn so that it looks round?",
      answer: "It is a helix sampled thirty times per turn. Segments on the far side are painted first and darker, then the stem, then the near-side segments with a thin highlight on top. Only the top end of the helix moves, so the turns bunch up evenly as the stem comes down.",
    },
    {
      question: "Why does the lamp switch off higher than it switched on?",
      answer: "It does not use a timer. The contact state is read from the drawn geometry on each frame: the leaf is closed when the wedge has pushed it the full distance. Because the stem rises faster than it falls, the release point is crossed sooner on the way back.",
    },
    {
      question: "Can I use the switch with my own input instead of the demo field?",
      answer: "Yes. The canvas exposes two calls through the `api` ref inside the component: `press(true)` and `press(false)`. Call them from the key handlers of any field, or from a game loop, and remove the built-in input.",
    },
    {
      question: "Will the self-typing demo overwrite what a visitor wrote?",
      answer: "No. The demo pauses for six seconds after any press and never runs while the field has focus. If you want it off entirely, set `nextDown` to `Infinity` where the frame loop is set up.",
    },
  ],
  related: ["chrome-stomp-footswitch-toggle-with-jewel-lamp-on-a-powder-coated-pedal", "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale", "oil-paint-tube-colour-mixer-that-squeezes-beads-onto-an-enamel-tray-for-a-palette-knife-to-blend"],
  tags: ["keyboard", "switch", "cutaway", "input", "canvas", "spring", "retro", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
