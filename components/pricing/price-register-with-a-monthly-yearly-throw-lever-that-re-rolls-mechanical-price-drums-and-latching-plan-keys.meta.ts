const meta = {
  slug: "price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys",
  category: "pricing",
  name: "Price Register with a Monthly Yearly Throw Lever That Re-Rolls Mechanical Price Drums and Latching Plan Keys",
  keyword: "monthly yearly pricing toggle react",
  title: "React Monthly Yearly Pricing Toggle with a Lever | We.Inc",
  description: "Pricing toggle built as an enamel register: throw the lever from monthly to yearly and the number drums spin to the new prices. Free React and HTML code.",
  intro: "A billing-period switch and plan picker drawn on a canvas as one small machine. Three windows in a black glass fascia each show a price on two ivory number drums. On the right a chrome stalk with a red ball rides in a slot between MONTHLY and YEARLY. Drag the ball or tap the gate: once it passes the middle it is pulled to the far stop, the housing gives a small jolt, and the drums run round one after another from left to right, the units drum always travelling further than the tens. A narrow flag drum under the windows turns to say how the price is paid. Three round keys underneath latch like the keys of an old till, so pressing one releases the last and lights its amber jewel. On phones the lever moves below the keys and the same parts are redrawn in a tall housing.",
  useWhen: [
    "A pricing page offers a yearly discount and the switch itself should be the thing visitors remember.",
    "Three plans need showing at a glance with no feature lists, ahead of a detailed table further down.",
    "A tool for shops, cafes or accountants wants a nod to the cash register without drawing a whole one.",
    "A hero for a hardware or retro-styled product needs a control that looks built, not rendered.",
  ],
  customize: [
    "`plans` holds `name`, `monthly`, `yearly` and a `note` for the text line. Both prices are per month and must be whole numbers under 100.",
    "`BODY` is the housing enamel from top to bottom. Cream is `#efe6cf`, `#e2d6b8`, `#c9bb98`. The focus ring offset colour `#a3b497` should follow it.",
    "`KNOB` is the four reds of the lever ball. `LAMP` colours the jewel over the latched key.",
    "Each drum makes one extra turn for tens and two for units: that is `10 * (j + 1)` in `reroll`. Use `10 * j` to keep the tens drum calmer.",
    "The lever snap is `190` (pull) and `9` (drag) in `step`. Raise the drag to 20 if the bounce off the stop is too lively for your page.",
  ],
  accessibility: [
    "The lever is a `role=\"switch\"` button named Pay yearly with `aria-checked`. Enter and Space throw it, and a tap anywhere on the gate does the same as a drag.",
    "The three keys are radio buttons in a `radiogroup`. Their labels read the plan and the price for the billing period now showing.",
    "Under the machine a polite live region gives the plan, the price, the yearly total when it applies and one line about the plan.",
    "With reduced motion the lever, drums, flag and keys are drawn in their final positions with no spin and no jolt.",
  ],
  faqs: [
    {
      question: "How are the drums drawn without 3D transforms?",
      answer: "Each figure is placed at an angle around an imaginary cylinder. Its height on screen is the sine of that angle and its vertical squash is the cosine, so a number flattens and darkens as it rolls towards the edge of the window. A fixed gradient on top supplies the roundness.",
    },
    {
      question: "Why do the drums always turn the same way?",
      answer: "A counter wheel on a real machine is driven by a ratchet, so it only advances. Here each drum keeps an ever-growing position and the next price is reached by adding the gap to the new digit plus whole turns, never by going back.",
    },
    {
      question: "Does the lever work by touch?",
      answer: "Yes. The gate uses pointer events and `touch-none`, so a finger drags the ball without scrolling the page. Let go past the halfway point and it finishes the throw by itself. Let go before and it falls back.",
    },
    {
      question: "Can I show three-digit prices?",
      answer: "Not without adding a drum. The `digits` helper splits a price into tens and units and each window draws exactly two. Add a hundreds entry there, widen the window by one `dw`, and move the dollar sign left by the same amount.",
    },
    {
      question: "How do I get the choice out of the component?",
      answer: "`plan` and `yearly` are plain React state. Lift them into a parent, or read `plans[plan]` and the `price` constant just above the return to build a checkout link.",
    },
  ],
  related: ["thumbwheel-number-picker-with-rolling-digit-drums-and-knurled-wheels", "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge", "brass-balance-scale-price-builder-with-feature-weights-and-coins-that-drop-until-the-beam-levels"],
  tags: ["pricing", "billing toggle", "lever", "counter", "canvas", "mechanical", "skeuomorphic"],
  height: 800,
  interactive: true,
};

export default meta;
