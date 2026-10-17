const meta = {
  slug: "roller-conveyor-order-tracker-with-a-taped-parcel-that-rides-steel-rollers-past-four-enamel-station-signs-with-lamps",
  category: "timelines",
  name: "Roller Conveyor Order Tracker with a Taped Parcel That Rides Steel Rollers past Four Enamel Station Signs with Lamps",
  keyword: "order tracking stepper react",
  title: "React Order Tracking Stepper on a Conveyor | We.Inc",
  description: "Order tracker drawn as a roller conveyor: a taped parcel rides steel rollers and a lamp lights on each station sign it reaches. Free React and HTML code.",
  intro: "A length of warehouse roller conveyor runs away from you across a pale concrete floor: thirty odd steel rollers between yellow painted rails, a bolt head at the end of each, grey legs and a striped walkway line on the floor. Behind it stand four dark green enamel signs on posts, one per stage of an order, each with a number, a name, a place, a time and a round lamp in a chrome bezel. A brown parcel with paper tape and a courier label sits on the rollers. When the order moves on, the rollers turn, the parcel travels with a slight rattle and eases to a stop at the next sign, whose lamp comes on and pulses. After the last sign it runs off the end and a new one is fed on. Under the drawing the same four stages are ordinary buttons with a sentence describing the current one. On a phone the conveyor shrinks to fit and those buttons become a two by two grid.",
  useWhen: [
    "An order status page needs one glance to say where the parcel is, with the detail in text underneath.",
    "A fulfilment, print on demand or repair service wants to show the stages a job passes through on its landing page.",
    "A build or publishing pipeline with a handful of named stages wants something warmer than a row of dots.",
    "A warehouse or logistics firm needs a hero object for a services page that also explains its process.",
  ],
  customize: [
    "Stage names, places, times and the sentence shown for each are the `stations` list in `order`. The line spaces any number of signs evenly, though more than five get tight at this length.",
    "`START` is the stage shown on load. Drive it from your own data by calling `go(k)` with the index of the stage the order has reached, and delete the demo timer effect.",
    "`L`, `CW` and `CH` are the length, width and height of the conveyor, and `PITCH` and `ROLL` the spacing and thickness of the rollers. `PW`, `PD` and `PH` size the parcel.",
    "`YELLOW` paints the rails and `ENAMEL` the signs. The lamp colours are the two radial gradients beside `lit`, so a brand colour can replace the green there.",
    "The travel is one spring on `x` with `stiffness: 22` and `damping: 10.5`. Raise the stiffness for a brisker line, or raise the damping to remove the small overshoot at each stop.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. Everything it shows is repeated below as an ordered list of four buttons, and the current one carries `aria-current=\"step\"`.",
    "Each button shows its stage name and either its time or the word Pending, so reached and unreached stages differ in words as well as in the colour of the dot.",
    "The sentence above the buttons becomes a polite live region once someone has pressed a stage, so the self-running demo does not talk over a screen reader.",
    "With reduced motion the parcel is placed at its stage with no travel, the rollers and the lamp glow hold still and nothing advances unless a button is pressed.",
  ],
  faqs: [
    {
      question: "Are the rollers really turning?",
      answer: "A plain steel roller looks the same at every angle, so each one carries a faint seam: a thin strip that crosses its face and fades at both edges, started at a different point per roller. The strips only run while the parcel's speed is above a small threshold, which reads as the line starting and stopping.",
    },
    {
      question: "How does the lamp know the parcel has arrived?",
      answer: "The component keeps two numbers, the stage asked for and the stage reached. A listener on the parcel's position sets the second one when the parcel's centre is within 14 pixels of the sign. A lamp is lit only when its stage is at or before both, so it never comes on while the parcel is still on its way.",
    },
    {
      question: "What happens if I press an earlier stage?",
      answer: "The line treats it as a new order. The parcel carries on off the far end and fades, then another is placed before the first roller and rides in to the stage you chose. If you would prefer it to roll backwards, remove the `k < from` branch in `go`.",
    },
    {
      question: "Why is the list of buttons kept as well as the drawing?",
      answer: "At phone width the signs are only a few millimetres tall, too small to read or press. The buttons stay at full size at every width and are what keyboards and screen readers use, so the conveyor can be purely a picture.",
    },
    {
      question: "How is the conveyor drawn without a 3D library?",
      answer: "Every surface is a flat element in one `preserve-3d` parent that is tipped back and turned: the roller bed lies flat at one height, the near rail, legs and signs are stood upright, and the parcel is three faces. The round look of each roller is a seven stop gradient across its width.",
    },
  ],
  related: ["corrugated-cardboard-parcel-with-printed-paper-tape-that-peels-back-and-four-flaps-that-fold-open-over-a-folded-jumper", "knitted-scarf-project-timeline-that-knits-one-wool-stripe-per-step-as-each-ball-of-yarn-runs-out", "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce"],
  tags: ["order tracking", "stepper", "timeline", "conveyor", "parcel", "3d", "shipping"],
  height: 782,
  section: true,
  interactive: true,
};

export default meta;
