const meta = {
  slug: "round-wall-thermostat-slider-with-a-turning-copper-bezel-and-a-glass-face-that-glows-from-blue-to-amber",
  category: "inputs",
  name: "Round Wall Thermostat Slider with a Turning Copper Bezel and a Glass Face That Glows from Blue to Amber",
  keyword: "react thermostat dial component",
  title: "React Thermostat Dial with a Turning Bezel | We.Inc",
  description: "Thermostat slider on a canvas: turn the copper bezel past a fixed arrow and the glass face glows from blue to amber. Copy the React code or the HTML free.",
  intro: "A temperature control built as the round thermostat you would find on a hallway wall. The scale is engraved into a brushed copper bezel, and the bezel is the thing you turn: drag round it and the numbers travel past a small white arrow fixed at the top of the glass. The glass shows the setting in thin numerals, a ring of fine marks that fills as far as the setting, a single white mark for the room reading, and a band of light that runs from ice blue at ten degrees through cream to a hot orange at thirty. The same colour spills onto the plaster around the body. Left alone, the bezel turns itself to a warm setting, a cool one and back. It is 340 pixels square on a phone and 580 from tablet width up.",
  useWhen: [
    "A smart home, heating or energy page needs one hero control that visitors can actually turn.",
    "A settings screen has a single number with a meaningful low and high end, and a plain range track would hide that meaning.",
    "A booking flow for a sauna, wine room or greenhouse asks for a target temperature.",
    "You want a quiet light-coloured stage in a run of dark hardware pieces.",
  ],
  customize: [
    "`MIN`, `MAX` and `STEP` set the range and the size of one click. For Fahrenheit use 50, 86 and 1, then lower `PER_DEGREE` to 7.5 so the whole scale still fits round the ring.",
    "`HEAT` is the colour ramp of the display. Each row is a position from 0 to 1 followed by red, green and blue. Swap the last two rows for pinks to make a mood light instead of a heater.",
    "`ROOM` moves the white mark and decides whether the caption reads heating, cooling or holding. Pass in a live sensor reading there.",
    "The copper comes from the six rows of `ramp`. Replace them with greys running from 20 to 250 for stainless steel, or with yellows for brass.",
    "The wall is the root `bg-[#e6dfd3]` plus its radial gradient. Keep the `ring-offset` colour on the slider in step with it.",
  ],
  accessibility: [
    "The canvas is hidden. The control is one element with `role=\"slider\"`, a minimum, a maximum, the current value and a spoken text such as \"21.5 degrees, heating\".",
    "Arrow keys move half a degree, Page Up and Page Down move two degrees, and Home and End go to the coldest and warmest settings.",
    "Colour is never the only signal: the numerals, the word above them and the caption under the body all carry the same state.",
    "When reduced motion is requested the bezel jumps to each new value and the idle tour of settings does not run.",
  ],
  faqs: [
    {
      question: "Why does the scale turn and not a pointer?",
      answer: "Old bimetal thermostats worked that way: the ring you grip carries the numbers and the case carries the mark. It also means the number you want always arrives at the top, right way up, where your eye already is.",
    },
    {
      question: "Which way do I turn it to make the room warmer?",
      answer: "Clockwise. The engraving runs anticlockwise round the ring so that a clockwise turn brings higher numbers to the arrow. Flip the sign of `turn` and of `dv` if you prefer the opposite.",
    },
    {
      question: "How does the copper look brushed while it rotates?",
      answer: "The brushing is hundreds of thin circles painted once into a spare canvas. Circles look identical at every angle, so that layer never moves. The bright and dark wedges are a conic gradient tied to the light. Only the engraved ticks and numbers are rotated.",
    },
    {
      question: "Can it control real heating?",
      answer: "It is an input, so yes in the sense that `value` holds the chosen temperature. Send it to your own endpoint from the `set` function and from the pointer release, and feed the measured temperature back through `ROOM`.",
    },
    {
      question: "Does the glow on the wall need a blend mode?",
      answer: "No. It is a transparent radial gradient painted on the same canvas before the body, in the current display colour. The canvas itself has no background, so the plaster behind it is ordinary CSS.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob"],
  tags: ["thermostat", "dial", "slider", "copper", "canvas", "smart home", "temperature"],
  height: 720,
  interactive: true,
};

export default meta;
