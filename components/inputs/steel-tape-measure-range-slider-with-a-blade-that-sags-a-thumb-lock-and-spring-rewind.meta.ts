const meta = {
  slug: "steel-tape-measure-range-slider-with-a-blade-that-sags-a-thumb-lock-and-spring-rewind",
  category: "inputs",
  name: "Steel Tape Measure Range Slider with a Blade That Sags, a Thumb Lock and Spring Rewind",
  keyword: "react range slider tape measure",
  title: "React Range Slider as a Tape Measure | We.Inc",
  description: "Range slider drawn as a pocket tape measure: pull the blade out, watch it sag under its weight and slide the lock off to rewind. Free React and HTML code.",
  intro: "A range input dressed as a yellow pocket tape. The value is the length of blade you have pulled out of the case, and the scale printed on the steel is generated from the same minimum and maximum the input uses, so the number sitting at the mouth of the case is always the reading. The blade is drawn as an unsupported strip: it leaves the case flat, droops further the longer it gets, and bounces at the hook when you stop pulling. A red thumb tab on the shoulder of the case is a real pressed-or-not button. With the tab down the blade stays where you leave it. Slide the tab up and the spring in the case takes the blade back to zero, with a small kick when the hook hits the guard. On phones the case shrinks by about a third and the blade uses whatever width is left.",
  useWhen: [
    "A furniture, flooring or blinds configurator asks for one length and a plain track with a thumb would feel like a tax form.",
    "A quote form for a trade business wants its first question to look like the job, such as wall width for a tiler or run length for a fencer.",
    "A sizing step in a shop needs a value and a clear way to wipe it and start again, which the lock tab gives without a separate reset link.",
    "A landing page for a hardware or home improvement product wants a hero object that visitors can pull on while they read.",
  ],
  customize: [
    "`MIN`, `MAX` and `STEP` set the range. The tick marks, the red tens and the figure on the centre badge are all printed from them, so 0 to 200 with a step of 5 needs no drawing changes.",
    "`LABEL` and `UNIT` are the caption and the suffix of the large readout. `UNIT` is also stamped on the badge.",
    "`SHELL` is three shades of the case plastic from lit to shaded. `[\"#ff8a3d\", \"#ee5a12\", \"#b83f06\"]` gives a site orange case.",
    "`BLADE` colours the lacquered steel. Swap in three near-whites for the white blade found on joinery tapes.",
    "The droop is `0.17 * Lmax` in `curve`. Lower it to 0.08 for a stiff wide blade, or raise it past 0.25 for a tired one.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. The control is a native `input type=\"range\"` with a visible label, and `aria-valuetext` reads the value with its unit.",
    "The thumb tab is a `button` with `aria-pressed`. A status line next to the readout says in words whether the lock is on and what will happen next.",
    "Changing the value from the keyboard switches the lock on first, so nobody has to hold a key down to stop the blade running home.",
    "Under reduced motion the blade jumps to its length with no bounce, the rewind is instant and the demo does not run.",
  ],
  faqs: [
    {
      question: "Why does the blade curve down instead of staying straight?",
      answer: "A real blade pulled into the air is a beam held at one end. Its droop follows a known curve that is flat at the support and steepest at the free end, and the amount grows quickly with length. The component uses that curve, then draws the blade as short slices rotated to follow it, so the printed marks tilt with the steel.",
    },
    {
      question: "What does the lock do to the value?",
      answer: "With the lock on, the value is whatever length you set and it stays. With the lock off, a pointer can still pull the blade out, but on release the length and the value both run back to the minimum. That makes the tab a physical reset.",
    },
    {
      question: "How do I get the number into a form?",
      answer: "The range input is a normal form field. Give it a `name` and it submits with the form. To use the value elsewhere in React, lift the `value` state up or add an `onChange` prop that is called from the `publish` function.",
    },
    {
      question: "Is the scale accurate or decorative?",
      answer: "It is accurate. Marks are placed by distance from the hook using the same pixels-per-unit figure that converts a drag into a value, so the mark level with the steel guard matches the readout under the case.",
    },
    {
      question: "Can the blade point the other way for a right-to-left layout?",
      answer: "The drawing has no mirrored mode built in. The quickest route is `-scale-x-100` on the canvas wrapper, then flip the sign of the drag distance in `onMove`. The printed numbers will be mirrored too, so for a proper version draw the text with a second flip.",
    },
    {
      question: "The blade moves by itself after a few seconds. How do I stop that?",
      answer: "That is the gallery demo: six seconds after the last touch it pulls, unlocks and rewinds to show what the piece does. Set `DEMO` to false at the top of the file and the blade opens at `START`, stays there, and only ever moves for the person using it.",
    },
  ],
  related: [
    "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put",
    "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale",
    "spirit-level-balance-indicator-with-a-bubble-vial-that-settles-between-two-values",
  ],
  tags: ["slider", "range", "tape measure", "canvas", "physics", "skeuomorphic", "tool"],
  height: 740,
  interactive: true,
};

export default meta;
