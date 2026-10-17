const meta = {
  slug: "rubber-drum-pad-step-sequencer-with-backlit-silicone-pads-that-squash-and-a-running-step-light",
  category: "app-ui",
  name: "Rubber Drum Pad Step Sequencer with Backlit Silicone Pads That Squash and a Running Step Light",
  keyword: "react step sequencer pad grid",
  title: "React Step Sequencer Pad Grid with Rubber Pads | We.Inc",
  description: "Step sequencer on a canvas: a grid of backlit silicone pads that squash under a press, glow per row and flash as the bar plays. Free React and HTML code.",
  intro: "A small drum machine with sixteen silicone pads, each one a step in a single bar. Tap a pad to switch its lamp on or off. A white marker walks the grid in time with the tempo shown in the red window, and every lit pad it lands on flares to full brightness and throws extra light across the powder-coated plate before fading back. The pads are thick: you see their skirts, they flatten under a finger with a dark dent in the middle, and when let go they spring back a little past their resting height before they settle. Two round keys on the top right start and stop the run and wipe the pattern. The box is drawn from above and in front with no perspective, so every pad top is an exact rectangle and the real buttons sit precisely on them. On a phone the box fills the width and each pad is still over fifty pixels across.",
  useWhen: [
    "A music app, beat maker or sampler page needs a pattern editor that looks like hardware and not a spreadsheet of checkboxes.",
    "A product page for audio software wants a hero object visitors can program a rhythm on without leaving the page.",
    "A game or toy interface needs a grid of sixteen on and off cells with strong feedback for every tap.",
    "A settings screen wants a memorable way to pick several items from a small fixed set, such as days or channels.",
  ],
  customize: [
    "`PATTERN` is the starting bar: sixteen ones and zeros read left to right from the back row. Change the ones to draw a different rhythm.",
    "`ROWS` holds one lamp colour for each row of four pads. Set all four to `#ffffff` for a monochrome machine.",
    "`BPM` sets both the speed of the marker and the digits in the tempo window. The marker moves four steps per beat.",
    "`PADH` is the height of a pad above the plate in millimetres. 4.4 gives a chunky pad. Use 2 for low-profile keys.",
    "`GHOST` lists the pads the idle demo presses before anyone touches the machine. Make it an empty array to leave the pattern alone.",
  ],
  accessibility: [
    "Each pad is a real `button` with `aria-pressed` and a label such as \"Step 7\", grouped under the name \"Sixteen step pattern\". Arrow keys move focus around the grid, Space or Enter toggles the step.",
    "Run is a toggle button with `aria-pressed`, so the moving marker can be stopped at any time, and Clear is a plain button. Both have hit areas at least 40 pixels across.",
    "The line under the box is a polite live region that reports how many steps are lit and whether the pattern is running. It changes when you edit, not on every step.",
    "With reduced motion the machine loads stopped and the demo presses are skipped. Nothing plays sound unless `SOUND_ON` is set to true.",
  ],
  faqs: [
    {
      question: "How are the pads given thickness on a flat canvas?",
      answer: "Each pad is drawn as a stack of about ten rounded squares, each one a fraction of a millimetre higher on screen than the last and slightly lighter. Together they read as the skirt of the pad. The top slice gets the radial lamp gradient, a rolled edge and a sheen. Pressing a pad lowers the number of slices and widens them a touch.",
    },
    {
      question: "Why does the plate around a lit pad change colour?",
      answer: "Before the pads are painted, a blurred copy of each lit pad's outline is added to the plate with the additive blend mode, so the light piles up where neighbours overlap. When the marker hits a lit step the blur and strength of that copy both rise for a moment.",
    },
    {
      question: "Can I use more than sixteen steps?",
      answer: "Yes, in multiples of four. Add entries to `PATTERN` and a colour to `ROWS` for each new row, then raise `PD` and the canvas height `CH` by 36 millimetres times the scale for every extra row and update the `aspect-[600/610]` class to match.",
    },
    {
      question: "How do I get the pattern out to drive real audio?",
      answer: "The `pattern` state is an array of ones and zeros that you can lift to a parent or pass to your own scheduler. For anything beyond the built-in test blip, schedule notes on the Web Audio clock from that array and use this component only as the display and editor.",
    },
    {
      question: "Does it keep running when it is off screen?",
      answer: "No. An intersection observer and the page visibility event stop the frame loop when the box is scrolled away or the tab is hidden, and the loop also stops by itself when the run is off and every pad has come to rest.",
    },
  ],
  related: ["piano-octave-key-picker-with-real-key-dip-red-felt-and-a-lacquer-fallboard-that-mirrors-the-keys", "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob"],
  tags: ["drum machine", "step sequencer", "pads", "music", "toggle grid", "canvas", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
