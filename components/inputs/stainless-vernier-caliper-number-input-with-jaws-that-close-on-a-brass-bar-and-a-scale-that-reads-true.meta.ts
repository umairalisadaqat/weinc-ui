const meta = {
  slug: "stainless-vernier-caliper-number-input-with-jaws-that-close-on-a-brass-bar-and-a-scale-that-reads-true",
  category: "inputs",
  name: "Stainless Vernier Caliper Number Input with Jaws That Close on a Brass Bar and a Scale That Reads True",
  keyword: "react precise number input slider",
  title: "React Precise Number Input: Vernier Caliper | We.Inc",
  description: "Number input drawn as a steel vernier caliper: slide the jaw onto a brass bar and read tenths from a scale that reads true. Free React and HTML to copy.",
  intro: "A one-decimal number input for dimensions, shown from above as a stainless caliper lying on a green cutting mat. The moving jaw is the thumb of a slider. Between the two jaws sits the end of a turned brass bar that is always exactly as wide as the value, so the size you are entering is visible as a size and not only as digits. The beam carries a millimetre scale and an inch scale, and the head carries a working vernier: whichever of its eleven lines sits directly over a beam line is the tenths digit, as on the real instrument. A knurled roller under the head turns as the jaw travels. The large figure below repeats the reading. On phones the whole tool shrinks to the width of the screen and the smallest engraved labels are left off so the lines stay clean.",
  useWhen: [
    "An order form for cut-to-size stock asks for a diameter or thickness and a typo of one decimal place would be expensive.",
    "A 3D printing, machining or jewellery quote tool wants customers to see the size they are asking for before they submit it.",
    "A product page for pipe, dowel, tube or bar offers a continuous range of sizes instead of a dropdown of presets.",
    "A teaching page about measurement needs a caliper that students can move and read for themselves.",
  ],
  customize: [
    "`MIN` and `MAX` bound the value. The drawn beam has room for 36 mm of travel, and `BEAM` is its length if you need more.",
    "`START` is the opening value and `TOUR` lists the sizes the self-running demo slides to. Set `DEMO` to false before using it in a form, otherwise the jaw wanders off to the next size when the visitor pauses.",
    "The mat colour is `bg-[#17463a]` on the root, and its grid lines are in the `stainless-vernier-caliper-mat` rule. Change `60px` and `12px` together to rescale the squares.",
    "Steel brightness is the list of numbers inside `steel`, from 244 down to 172. The third argument of each `steel` call lifts or darkens one part, which is how the head stands off the beam.",
    "The brass is tinted in the small `brass` function. Multiply all three channels by the same number for aluminium, or favour red for copper.",
  ],
  accessibility: [
    "A native `input type=\"range\"` with a step of 0.1 holds the value. Left and Right move one tenth, Page Up and Page Down take larger steps, Home and End go to the limits.",
    "`aria-valuetext` announces the reading with one decimal and the unit, for example 28.4 mm, so a screen reader does not say a long float.",
    "The label under the tool is a real `label` and shows a focus ring when the hidden range input has keyboard focus.",
    "The tool is decoration to assistive technology. With reduced motion the jaw is placed without the spring and the demo is off.",
  ],
  faqs: [
    {
      question: "Is the vernier scale really readable?",
      answer: "Yes. The head has ten divisions spread over nineteen millimetres, so each is 1.9 mm. At a reading of 28.4 the fourth vernier line falls exactly on a beam line and its neighbours miss by a tenth each way. The zero line of the vernier points at the whole millimetres.",
    },
    {
      question: "Why does the brass bar change size?",
      answer: "It is the visual echo of the number. A caliper normally measures a fixed part, but this is an input, so the part follows the jaws. Seeing a 12 mm disc next to a 33 mm one is a faster sanity check than comparing two figures.",
    },
    {
      question: "Can it work in inches?",
      answer: "The upper scale is already engraved in sixteenths. To make inches the value, set `UNIT`, change `MAX` to 1.4 and replace the divisor in the drag handler so pixels convert through 25.4. The lower vernier would then be for show only.",
    },
    {
      question: "How do I get finer than a tenth?",
      answer: "Change the rounding in `snap` to two decimals and set the range step to 0.05 or 0.02. For the vernier to stay honest at 0.05 it needs twenty divisions over thirty-nine millimetres, which means a longer head and a longer beam.",
    },
    {
      question: "Will the fine lines blur on a phone?",
      answer: "Each graduation is drawn at least 0.7 CSS pixels wide on a canvas sized to the device pixel ratio, so on a modern phone screen every millimetre mark is still a separate line. Numbers are dropped below a certain scale instead of being drawn too small to read.",
    },
  ],
  related: [
    "steel-tape-measure-range-slider-with-a-blade-that-sags-a-thumb-lock-and-spring-rewind",
    "thumbwheel-number-picker-with-rolling-digit-drums-and-knurled-wheels",
    "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale",
  ],
  tags: ["number input", "slider", "caliper", "precision", "canvas", "skeuomorphic", "tool"],
  height: 760,
  interactive: true,
};

export default meta;
