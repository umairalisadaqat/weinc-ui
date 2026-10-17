const meta = {
  slug: "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale",
  category: "inputs",
  name: "Motorised Mixing Desk Fader with LED Meter and Engraved Decibel Scale",
  keyword: "react fader slider",
  title: "React Fader Slider with an LED Meter | We.Inc",
  description: "Vertical fader on a canvas: a moulded cap rides a slot beside a segmented LED meter, with a native range input underneath. Free React and HTML to copy.",
  intro: "One channel strip from a mixing console, used as a vertical slider. An ivory cap with ribbed shoulders, a finger dish and a red index line travels a slot cut into a brushed graphite plate. To its right the gain scale is engraved from infinity up to plus ten, with the unity mark picked out in red. To its left a ladder of 24 small windows shows the signal after the fader: green, then amber, then three red, with a peak segment that hangs for a moment before it falls. Lit segments throw colour onto the plate and tint the side of the cap as it passes them. Left alone, the cap glides between four stored levels the way a motorised desk recalls a mix. The strip is 320 pixels wide, so it fits a small phone without scaling.",
  useWhen: [
    "A volume, gain or send level in a music or podcast tool deserves a control that looks like the desk its users learned on.",
    "A settings screen has one hero value, such as master output or brightness, and a thin track with a dot would undersell it.",
    "A product page for audio hardware or a plug-in wants an object visitors can push up and down while they read.",
    "You need a tall slider whose reading is shown in decibels and not as a bare percentage.",
  ],
  customize: [
    "`marks` is the engraved scale. Each entry has the printed `label`, the `db` value and `p`, its height in the slot from 0 to 1. Replace the list with 0 to 100 marks for a plain percentage fader.",
    "`CAP` and `INDEX` are the cap plastic and its painted line. For a black cap also darken the fourteen colours in the `stops` array inside `draw`, which shape the dish and shoulders.",
    "`automation` holds the levels visited while idle, as values from 0 to 100. Leave one entry and the cap stays where it starts.",
    "`ledColour` decides where green turns amber and amber turns red. Change `LEDS - 9` and `LEDS - 3` to move the bands, or return one colour for a single tone meter.",
    "The motor glide is the pair `70` and `15` in the frame loop (stiffness and damping). Use `40` and `12` for a slower, heavier pass.",
  ],
  accessibility: [
    "The value lives in a native `input type=\"range\"` that is invisible but focusable. Arrow keys, Page Up, Page Down, Home and End move the cap, and a ring appears around the whole strip on keyboard focus.",
    "`aria-valuetext` reads the level in decibels, for example minus 6.5 dB, so a screen reader does not announce a meaningless 62.",
    "The canvas and the drag area are hidden from assistive technology. The text line under the strip repeats the reading in an `output` tied to the input.",
    "With reduced motion the cap jumps to its level, the meter holds a steady reading and the stored levels are not replayed.",
  ],
  faqs: [
    {
      question: "Why is the fader scale not evenly spaced?",
      answer: "Console faders use an audio taper. The top quarter of the travel covers only ten decibels so that small moves around unity are fine, and the bottom squeezes everything from minus forty down to silence. The `marks` list encodes that curve, and `dbAt` reads between the marks for the value shown.",
    },
    {
      question: "Is the LED meter showing real audio?",
      answer: "No. It is a small made-up signal, a few sine waves and a decaying beat, multiplied by the fader position. To show a real level, replace the `signal` function with a reading from a Web Audio analyser node and keep the attack, release and peak hold code as it is.",
    },
    {
      question: "How do I use the value in a form?",
      answer: "Give the range input a `name` and it submits a whole number from 0 to 100 like any other slider. To control it from a parent component, lift the `value` state and pass a change handler down.",
    },
    {
      question: "What is the small notch I feel at the red mark?",
      answer: "Unity gain, where the channel passes sound at the level it arrived. When a drag comes within about one and a half percent of that point the cap snaps onto it, the same way a real fader has a centre detent. Remove the check in `toP` if you want free travel.",
    },
    {
      question: "Can I put several of these strips side by side?",
      answer: "Yes, but each instance runs its own canvas loop. Four or five strips are fine. For a full desk of twenty, draw the still plate once and share it between instances, since the plate is the expensive part.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "oil-paint-tube-colour-mixer-that-squeezes-beads-onto-an-enamel-tray-for-a-palette-knife-to-blend", "paper-coffee-cup-name-field-where-a-marker-writes-what-you-type-round-the-cup"],
  tags: ["fader", "slider", "range", "audio", "mixer", "led meter", "canvas", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
