const meta = {
  slug: "speedometer-and-rev-counter-pair-in-a-stitched-leather-binnacle-with-a-start-up-needle-sweep-and-a-working-throttle",
  category: "dashboard",
  name: "Speedometer and Rev Counter Pair in a Stitched Leather Binnacle with a Start-Up Needle Sweep and a Working Throttle",
  keyword: "speedometer gauge react",
  title: "React Speedometer Gauge and Rev Counter | We.Inc",
  description: "Instrument cluster on a canvas: a speedometer and rev counter under glass, with a start-up needle sweep and a working throttle. Free React and HTML code.",
  intro: "Two round instruments set into a black leather cowl: a rev counter on the left with a red band from 6,500, and a speedometer on the right with a six-drum odometer that really turns. Chrome bezels, a shaded recess, orange needles that cast a shadow on the face, and a pane of glass over each dial with a hard window streak. Behind the picture is a small driving model. Move the throttle and the revs climb, the gearbox changes up, the rev needle drops back and the speed keeps building. Lift off and it coasts down through the gears. Pressing the engine button kills everything; pressing it again runs the test every driver knows, where the lamps light and both needles swing to the far stop and fall back before the engine settles to idle. Below 640 pixels the dials stack, with the lamps and the button in a row underneath.",
  useWhen: [
    "A car dealer, garage or motorsport site wants a hero object that moves while the visitor reads the headline next to it.",
    "A racing or driving game needs a heads-up cluster and you would like one that already handles gears and revs.",
    "A performance page wants a friendlier way to show a score than a bar: feed your own number to one needle and hide the second dial.",
    "A product launch countdown or loading screen wants the theatre of an ignition sequence before the content appears.",
  ],
  customize: [
    "`TOP_SPEED` and `UNIT` relabel the right-hand dial. Set them to `260` and `\"KM/H\"` and the scale redraws with a number every 20.",
    "`REDLINE` and `MAX_RPM` move the red band and the end of the rev scale. A diesel would be `4500` and `6000`.",
    "`RATIOS` and `PULL` are the gearbox: revs per unit of speed and strength of pull for each gear. Remove the last entry of both for a five-speed.",
    "`NEEDLE` paints both needles, the ring round the start button, the filled part of the throttle track and the focus outlines.",
    "To drive a needle from your own data, replace the `drive(...)` call in the frame loop and set `fr` and `fs` to values between 0 and 1. The springs still smooth the movement.",
  ],
  accessibility: [
    "The canvas is marked `aria-hidden`. The engine control is a real `button` with `aria-pressed`, laid exactly over the drawn start button, and the throttle is a native range input with a visible label.",
    "The throttle works with arrow keys, Page Up, Page Down, Home and End, as any range input does, and both controls show an orange focus outline.",
    "Only the engine state is announced, through a polite live region under the cluster. Speed and revs change many times a second and are deliberately kept out of it.",
    "With reduced motion the loop never starts. The needles are drawn at the speed and revs the car would settle at for the current throttle, and they jump when you change it.",
  ],
  faqs: [
    {
      question: "How do the needles get that weighty movement?",
      answer: "Each needle is a spring with damping that chases a target value, so it overshoots a little on a sudden change and settles. The rev needle is given a stiffer spring than the speed needle, which is why it flicks on a gear change while the speedometer barely notices.",
    },
    {
      question: "What decides when it changes gear?",
      answer: "The change-up point slides with the throttle: about 2,200 revs with a light foot and 6,500 with the pedal down. It changes down when the revs would fall under roughly 1,250 plus a throttle allowance. Drive is cut for a fifth of a second on each change, which gives the small pause in the speed needle.",
    },
    {
      question: "Why does it drive by itself?",
      answer: "So that a preview is never a dead pair of dials. After nine seconds without input it runs a lap: accelerate, lift, kick down, brake to a stop, switch off and start again. Any touch of the throttle or the button hands control back to the visitor.",
    },
    {
      question: "Is the odometer accurate?",
      answer: "The drums count distance from speed, but sped up six times so that the tenths drum can be seen rolling at town speeds. Each drum only turns while the one to its right is passing nine, which is how a mechanical counter carries. Change the `600` in `drive` to `3600` for true distance.",
    },
    {
      question: "Can I show just one gauge?",
      answer: "Yes. Remove one `dial(...)` call and one `needle(...)` call, and change the positions in `layoutFor`. The leather cowl is drawn from the layout width and height, so shrink `W` to about 420 for a single instrument.",
    },
  ],
  related: [
    "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob",
    "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target",
    "open-gate-manual-gear-lever-selector-with-a-chrome-h-pattern-plate-and-a-ball-knob-you-drag-through-the-slots",
  ],
  tags: ["speedometer", "tachometer", "gauge", "instrument cluster", "canvas", "needle", "leather", "chrome"],
  height: 760,
  section: false,
  interactive: true,
};

export default meta;
