const meta = {
  slug: "brass-mixing-desk-fader-in-webgl-with-weighted-detents-an-engraved-decibel-plate-and-a-backlit-vu-needle",
  category: "inputs",
  name: "Brass Mixing Desk Fader in WebGL with Weighted Detents, an Engraved Decibel Plate and a Backlit VU Needle",
  keyword: "volume slider react",
  title: "Brass Fader Volume Slider in WebGL (React, Tailwind) | We.Inc",
  description: "Free React volume slider: a heavy brass fader cap that clicks into engraved decibel marks, with a lamp-lit VU needle beside it, traced in a WebGL shader.",
  intro: "A volume control taken from an old studio desk at night. A solid brass cap with a scooped top rides a slot cut through an engraved brass plate, and one warm lamp behind the desk throws its shadow down the scale. Beside it sits a VU meter under glass: a cream card lit from below, a black needle that swings with the ballistics of the real instrument, and a red jewel that glows when the signal runs hot. Everything is traced per pixel in a fragment shader, so the brass mirrors the lamp and the panel, the glass carries a soft reflection over the card, and the needle drops a fine shadow onto its own scale. Drag the cap and it follows a beat late, leans in the slot, and drops into each engraved mark with a small clunk the needle feels too. A plain range input on the left drives the same value from the keyboard.",
  useWhen: [
    "A music, podcast or audio product page wants its one volume or gain control to feel like hardware someone has owned for years.",
    "A dark, warm landing page needs a hero object visitors can grab, that still behaves as an honest form field.",
    "You want to show a level in decibels with a meter that answers it, rather than a bare percentage.",
    "A portfolio piece should demonstrate ray-marched metal, glass and soft shadow in the browser with no 3D library.",
  ],
  customize: [
    "`MARKS` pairs a fader position from 0 to 100 with the decibel figure engraved there. The plate, the detents and the big readout are all drawn from that one list.",
    "`DETENT` is how close the cap must come to a mark before it drops in. Set it to 0 for a smooth fader with no notches.",
    "`notes` holds the italic line under the number, keyed by decibels. Keep the rows in rising order.",
    "`BRASS` in the shader is the metal colour. `vec3(0.92, 0.93, 0.94)` gives brushed aluminium and `vec3(0.95, 0.62, 0.52)` copper.",
    "The lamp is `KEYC` and the direction `LK`; the warm pool on the desk is centred in `pool()`. Move the pool to light a different part of the strip.",
    "`program()` invents the signal the needle reads. Replace it with a real level from your audio graph to make the meter honest.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The control is a labelled `input type=\"range\"` whose `aria-valuetext` reads the level in decibels and the sentence for that band.",
    "Arrow keys, Page Up, Page Down, Home and End work as on any native range input, and the cap glides to each new step.",
    "The focus ring is drawn in the brass colour with an offset, so it stays visible on the dark stage.",
    "With reduced motion the lamp holds still, the demo never runs, the cap jumps to the new position and the needle rests at the level instead of dancing.",
  ],
  faqs: [
    {
      question: "How does the cap feel heavy when it is only pixels?",
      answer: "It is a mass on a spring with damping that sits a little under critical, so it lags your hand, overshoots once and settles. The same acceleration tips it back in the slot, and a second spring rights it, which reads as weight.",
    },
    {
      question: "What makes the detents?",
      answer: "While you drag, a position within a couple of steps of an engraved mark is replaced by the mark itself. When the cap physically passes a mark it gets a small downward kick and the needle a nudge, so the notch is seen as well as felt.",
    },
    {
      question: "Why does 0 VU sit right of centre on the meter?",
      answer: "A real VU scale is spaced by voltage, not by decibels. The card is printed with that rule and the needle angle uses the same formula, so minus 20 bunches up on the left and the red zone gets a wide sweep.",
    },
    {
      question: "Is the needle shadow traced?",
      answer: "It is worked out directly. The needle rides a few millimetres above the card, so for each point on the card the shader steps toward the lamp by that height and asks whether the needle is there.",
    },
    {
      question: "What does a browser without WebGL show?",
      answer: "A flat version of the strip built from CSS gradients, with the cap and needle placed from the same value. The readout, the sentence and the range input never depended on the canvas.",
    },
    {
      question: "How do I use the level elsewhere on my page?",
      answer: "`value` is plain React state from 0 to 100, and `dbOf(value)` turns it into decibels. To read the level elsewhere, pass it up through a prop and an onChange handler; to send it with a form, add a `name` to the range input.",
    },
  ],
  related: [
    "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale",
    "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob",
    "ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper",
  ],
  tags: ["volume slider", "range slider", "webgl", "ray marching", "brass", "vu meter", "fader", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
