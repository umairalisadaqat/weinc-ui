const meta = {
  slug: "moulded-kit-sprue-whose-blue-parts-twist-off-the-runners-and-click-into-a-working-quote-calculator",
  category: "originals",
  name: "Moulded Kit Sprue Whose Blue Parts Twist off the Runners and Click into a Working Quote Calculator",
  keyword: "assembling calculator animation react",
  title: "React Calculator That Assembles from a Kit Sprue | We.Inc",
  description: "Moulded parts twist off a model-kit sprue and click into a shell, making a quote calculator with keys and a slider you can use. Free React and HTML code.",
  intro: "On the left lies a model-kit sprue: a frame of round blue runners with numbered tabs, a kit tag and two spare pegs. On the right is a cream calculator shell. Each of the five parts, a name plate, a minus key, a plus key, a slider thumb and a wide send key, rocks on its gate, lifts and drops into a matching socket in the shell. Once the last one is home the dark display wakes and the tool works: the round keys change the number of windows, the thumb slides between one, two and three floors, the price updates, and the send key sinks and reports that the quote has gone. The piece opens finished, then puts the parts back and snaps them out again by itself until someone presses a key. On wide screens sprue and shell sit side by side; under 780 pixels the shell moves below the sprue and the whole drawing scales to fit.",
  useWhen: [
    "A page about turning one written line into a small business tool needs a picture of that tool being made, and a slideshow of screens would be forgettable.",
    "You want visitors to try a calculator in the first screen, and want its arrival to be the reason they notice it.",
    "A product explainer has to say that an app is a handful of parts, each with one job, without writing that sentence.",
    "A pale, quiet page needs one saturated object, and a single plastic colour does that better than a gradient.",
  ],
  customize: [
    "`sentence` and `kitName` set the caption, the name plate and the tag moulded onto the sprue.",
    "`RATE` is the price of one ground-floor window and each entry in `floors` adds its `extra` as a fraction, so 0.25 means a quarter more. Replace the `total` line to price anything else.",
    "Every part in `parts` has a place on the sprue (`s`) and a seat in the shell (`t`), plus `tag` and `row` for its numbered tab. Move a part by changing those numbers; the flight path follows.",
    "The plastic is `PLASTIC` for the face and `EDGE` for the lip and the three stepped side colours. The runners repeat the same blues as SVG strokes just under the `RUNNERS` path.",
    "Assembly speed is `1300 + i * 640` in the demo effect: the first number is the pause on the full sprue, the second the gap between parts.",
  ],
  accessibility: [
    "The plus, minus and send keys are real buttons with spoken names. The floors slider is a `radiogroup` of three targets laid over the slot, each announcing how many floors it selects.",
    "Parts still on the sprue are disabled, so keyboard focus never lands on a control that is not in the tool yet.",
    "The price sits in a polite live region and is read as a whole (`aria-atomic`), prefixed with whether the quote is open or sent.",
    "With reduced motion the calculator is shown assembled, the looping demo and the replay flight are skipped, and every control still works.",
  ],
  faqs: [
    {
      question: "How is the twist before each part comes free done?",
      answer: "The outer wrapper of a part animates four keyframes with framer-motion: at rest on the sprue, rotated nine degrees one way, seven the other while it lifts and grows a little, then at its seat. The last leg uses an easing curve that overshoots, which gives the small click as it lands.",
    },
    {
      question: "Why does a part have two elements?",
      answer: "The wrapper owns the flight. The inner element is the plastic you see, and it handles the two-pixel sink when a key is pressed and the sideways slide of the thumb. Keeping those apart means pressing a key never restarts the flight animation.",
    },
    {
      question: "How are the round runners drawn?",
      answer: "One SVG path is stroked four times with round caps: a dark wide stroke nudged down, the base blue, a lighter stroke nudged up and a thin highlight above that. Together they read as a cylinder lit from above. A drop-shadow filter on the SVG puts the frame's shadow on the table.",
    },
    {
      question: "Can I swap the calculator for a different tool?",
      answer: "Yes. The shell is plain markup with one socket per part, and the parts are five `Part` blocks holding ordinary buttons. Keep the same pattern, one seat and one sprue position for each, and build a tip splitter, a deposit counter or a booking form.",
    },
    {
      question: "What does the replay button do after I have taken over?",
      answer: "It returns all five parts to the sprue and snaps them out once more, leaving your numbers as they were. It does not restart the self-running demo, so the tool stays yours.",
    },
  ],
  related: ["sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray", "website-console-with-feature-cartridges-that-click-into-slots-and-switch-on-sections-of-the-screen"],
  tags: ["originals", "calculator", "web app", "model kit", "assembly", "plastic", "tactile"],
  height: 760,
  interactive: true,
};

export default meta;
