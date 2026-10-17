const meta = {
  slug: "thumbwheel-number-picker-with-rolling-digit-drums-and-knurled-wheels",
  category: "inputs",
  name: "Thumbwheel Number Picker with Rolling Digit Drums and Knurled Wheels",
  keyword: "react number picker wheel",
  title: "React Number Picker Wheel with Rolling Digits | We.Inc",
  description: "Number input styled as a panel thumbwheel switch: knurled wheels roll numerals past their windows and click onto each digit. Free React and HTML to copy.",
  intro: "A three digit number input modelled on the thumbwheel switches found on test benches and old flight panels. Each section of the black moulded housing has an orange knurled wheel standing proud of the face and a window onto a drum of white numerals. Drag a section up or down and the drum turns with your finger: the numerals flatten as they roll over the top and bottom of the cylinder, the wheel's teeth bunch together at the edges, and the drum holds on to each number before dropping into the next. Flick it and it carries on a little. Tap it and it advances by one. While idle it dials a few sample quantities, one wheel after another. The housing is 328 pixels wide on phones and is drawn half as large again from tablet width up.",
  useWhen: [
    "An order form asks for a quantity and you want the field to be the memorable part of the page.",
    "A timer, counter or score entry needs each digit set separately, without a keyboard popping up on phones.",
    "An industrial, laboratory or aviation themed interface wants an input that matches the equipment it controls.",
    "A short numeric code has to be dialled in with a thumb, such as a locker or table number.",
  ],
  customize: [
    "`wheels` lists the sections from left to right. Each `name` is read out by screen readers and each `mark` is the small legend under the window. For a fourth digit add an entry and raise `W` and the housing width `BW` by 92.",
    "`WHEEL` is the colour of the knurled wheels as red, green and blue numbers. `[52, 170, 120]` gives green wheels, `[230, 230, 225]` a white set.",
    "`field` holds the label above the housing, the unit after the number and the `name` of the hidden input that carries the total into a form.",
    "`start` is the number shown first and `demo` the numbers it dials while idle. Empty the `demo` list and it sits still.",
    "The click into each number is the spring `330` with damping `21`. Raise the damping to 36 and the drum stops dead with no bounce.",
  ],
  accessibility: [
    "Every section is a `spinbutton` with a name, a minimum of 0, a maximum of 9 and its current digit, so it is announced the way a native number stepper is.",
    "With a section focused, Up and Right add one, Down and Left take one away, Home and End go to 0 and 9, and typing a digit rolls straight to it by the shorter way round.",
    "The combined number is repeated as text in a polite live region and stored in a hidden input, so the value never exists only as pixels on the canvas.",
    "Under reduced motion the drums change number without rolling and the idle dialling is switched off.",
  ],
  faqs: [
    {
      question: "How are the numerals made to look wrapped round a drum?",
      answer: "Each numeral is given an angle on a cylinder. Its height on screen is the sine of that angle and its vertical squash is the cosine, so a digit leaving the window gets shorter and dimmer as it turns away. A dark gradient over the top and bottom of the window finishes the curve.",
    },
    {
      question: "Does turning one wheel past 9 carry over to the next?",
      answer: "No. Real thumbwheel switches are independent decades, and this one behaves the same, so rolling the units from 9 to 0 leaves the tens alone. If you want an odometer, watch for a wrap in `publish` and call `nudge` on the wheel to its left.",
    },
    {
      question: "Can a wheel show something other than 0 to 9?",
      answer: "The drum is drawn with ten faces. To use letters or a shorter list, change `digitOf` to index into your own array of ten labels. A different number of faces means changing `STEP`, which is the angle between two neighbours.",
    },
    {
      question: "Why does it not open the phone keyboard?",
      answer: "There is no visible text field to focus. The sections are custom spin buttons driven by touch and by hardware keys. That is deliberate for a dial, but if your users need to type long numbers quickly, offer a plain numeric input beside it.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale"],
  tags: ["number input", "thumbwheel", "picker", "spinbutton", "digits", "canvas", "skeuomorphic"],
  height: 700,
  interactive: true,
};

export default meta;
