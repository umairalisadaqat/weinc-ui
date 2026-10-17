const meta = {
  slug: "press-stud-snap-toggle-on-a-waxed-canvas-strap-that-pops-open-and-curls-back",
  category: "toggles",
  name: "Press Stud Snap Toggle on a Waxed Canvas Strap That Pops Open and Curls Back",
  keyword: "snap button toggle switch react",
  title: "React Snap Button Toggle Switch on Canvas | We.Inc",
  description: "Toggle built as a press stud: a canvas tab snapped to webbing pops off its stud when pressed, curls back and shows its lining. Free React and HTML to copy.",
  intro: "A switch you fasten. A waxed canvas tab is sewn to a length of navy webbing and held down by a nickel press stud, with a small woven label that reads ON. Press it and the cloth bulges for a moment against the stud, lets go, and springs up into a curl that rocks before it settles. Now you can see the yellow lining, the socket on the underside, the stud standing on the webbing and the word OFF printed where the tab used to lie. Press again and it comes down, lands and gives a small bounce. The tab is one strip that keeps its length while it bends, drawn from an angled camera with its own shadow. On phones the whole drawing scales down with its box and the tap area stays large.",
  useWhen: [
    "A settings screen for an outdoor, clothing or luggage brand wants one switch that belongs to the product.",
    "A single important preference, such as notifications or a privacy mode, deserves more presence than a pill switch.",
    "A product page uses a playful control to show or hide an extra panel.",
    "You want a hero object on a playground or portfolio page that visitors will press more than once.",
  ],
  customize: [
    "`SETTING` is the name read to screen readers and shown in the caption. `WORD_ON` and `WORD_OFF` are the two words on the cloth.",
    "`TAB`, `LINING` and `WEB` are the three cloth colours as red, green and blue. `THREAD` is the stitching.",
    "`YAW` and `EL` turn and tilt the camera. An `EL` of 1.2 looks almost straight down, 0.7 is a lower, more dramatic angle.",
    "`OPEN` is how far the tab curls in radians. 1.4 leaves it standing upright, 2.3 lays it right back over its stitching.",
    "The pop is the `11.5` given to `s.av` on release and the spring `120` with damping `6.2`. Raise the damping to 12 for a tab that rises once and stops.",
  ],
  accessibility: [
    "The control is one `button` with `role=\"switch\"`, `aria-checked` and the setting name as its label. Space and Enter toggle it.",
    "The caption under the strap is a polite live region, so the new state is announced in words and does not rely on reading the cloth.",
    "The focus ring is drawn on the pale stage around the whole strap, not on the cloth, so it stays visible whatever colours you choose.",
    "With reduced motion the tab is drawn flat or fully curled with no pop, bounce or self-running demo.",
  ],
  faqs: [
    {
      question: "How is the cloth bent without a 3D library?",
      answer: "The tab is cut into 44 short slices along its length. Each frame the code walks from the stitched end outward, adding up a bend angle, which gives every slice a position and a tilt. Each slice of the flat texture is then drawn with a single canvas transform onto its place on screen. Because the camera has no perspective, that transform is exact.",
    },
    {
      question: "How does it know whether to show the outside or the lining?",
      answer: "For each slice the direction its outer face points is compared with the direction of the camera. If it faces the camera the orange texture is used, otherwise the yellow one. The same direction, compared with the light, sets how much the slice is darkened or brightened.",
    },
    {
      question: "What makes the opening feel like a pop?",
      answer: "For the first 85 milliseconds the stud still holds, and only a bulge travels through the middle of the tab. Then the tab is released with a burst of speed on a lightly damped spring, and a second, smaller spring lets the free end lag and wag.",
    },
    {
      question: "Can I add a click sound?",
      answer: "The component ships silent. If you want one, play a short sample inside `fire`, and keep it behind a constant that defaults to off so nobody is surprised by audio.",
    },
    {
      question: "How do I read the value?",
      answer: "The `on` state is true while the tab is fastened. Lift it to a parent, or call your own handler inside `toggle` next to `setOn`. The self-running demo stops as soon as someone presses the switch and only resumes after seven idle seconds, so remove the demo block in the frame loop for production forms.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "hanging-garment-bag-scroll-reveal-with-a-brass-zip-that-parts-waxed-canvas-over-a-photograph", "velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway"],
  tags: ["toggle", "switch", "snap", "press stud", "fabric", "canvas", "skeuomorphic"],
  height: 750,
  interactive: true,
};

export default meta;
