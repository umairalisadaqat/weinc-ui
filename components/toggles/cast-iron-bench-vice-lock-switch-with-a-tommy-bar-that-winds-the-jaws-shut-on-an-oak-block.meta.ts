const meta = {
  slug: "cast-iron-bench-vice-lock-switch-with-a-tommy-bar-that-winds-the-jaws-shut-on-an-oak-block",
  category: "toggles",
  name: "Cast Iron Bench Vice Lock Switch with a Tommy Bar That Winds the Jaws Shut on an Oak Block",
  keyword: "react lock toggle switch skeuomorphic",
  title: "React Lock Toggle Switch as a Bench Vice | We.Inc",
  description: "On/off switch drawn as a blue engineer's vice: switching on winds the jaw along its slide until it bites an oak block. Free React code and HTML to copy.",
  intro: "An on and off switch for settings that mean hold this still. The picture is a side view of an engineer's vice in hammered blue enamel, bolted to a strip of bench. Switched off, the front jaw stands back from an oak offcut. Switched on, the tommy bar tumbles end over end through the screw head for a little over three turns, the jaw travels along its bright steel slide, and the serrated plates close on the wood with a short jolt through the whole casting. The far half of the bar is drawn behind the screw and the near half in front, and the ball ends swell slightly as they swing toward you, which is what makes the rotation read from the side. One invisible button covers the drawing, so the vice itself is the control. On a phone the same drawing scales down to fit the width.",
  useWhen: [
    "A page builder, whiteboard or diagram tool needs a lock for layout or position, and a padlock icon would be lost among the other toolbar buttons.",
    "A quote or booking flow has a hold step, such as keeping a slot or a price, and you want the hold to feel deliberate.",
    "A settings screen has one switch that matters more than the others, for example freezing a published version.",
    "A workshop, joinery or engineering brand wants its own trade on the page as a working control instead of a stock photo.",
  ],
  customize: [
    "`LABEL` is the accessible name and the caption. `NOTES.on` and `NOTES.off` are the sentences shown under it for each state.",
    "`PAINT` is the enamel in three shades from lit to shaded. `[\"#f08a7a\", \"#c0392b\", \"#6d1a12\"]` gives a red vice, and three greens give the classic machine-shop look.",
    "`TURNS` is how many times the bar goes round between open and shut. Lower it to 1.5 for a quick-release feel.",
    "`OPEN` and `BLOCK` are the jaw gap when open and the width of the oak. Keep `OPEN` under 110 or the bar leaves the bench.",
    "Winding speed is the `1.25` clamp on `s.v` in the frame loop. Raise it to 2.5 if the switch is used often and the wait gets old.",
  ],
  accessibility: [
    "The control is one `button` with `role=\"switch\"` and `aria-checked`, laid over the canvas. Its name comes from `LABEL`, so change that before anything else.",
    "Space and Enter toggle it. A pointer tap does the same, and a sideways drag moves the jaw directly and commits to whichever end it is nearer on release.",
    "The caption is tied to the switch with `aria-describedby` and is a polite live region, so the consequence of the new state is spoken, not only the word on or off.",
    "The state flips as soon as it is asked for. The winding that follows is decoration, and under reduced motion the jaw is drawn at its end position at once.",
  ],
  faqs: [
    {
      question: "Why use a vice for a switch instead of a normal toggle?",
      answer: "A small pill toggle says on or off. A vice says held, and it takes a moment to get there. That suits settings where the user should register what they did, such as locking a layout before handing a page to a client. For ordinary preferences, use an ordinary toggle.",
    },
    {
      question: "How is a rotating bar shown in a flat side view?",
      answer: "Seen from the side, a bar spinning around a horizontal screw only ever appears as a vertical line that grows and shrinks. The length drawn is the bar length times the cosine of its angle. The sine gives depth, which decides which half is drawn in front of the screw head and how large each ball end is.",
    },
    {
      question: "Does the state change wait for the animation?",
      answer: "No. `aria-checked` and the `on` state change on the click, tap or key press. If you call an API when the lock engages, do it in the `flip` function and it will not depend on frame timing.",
    },
    {
      question: "Can I put something other than the oak block between the jaws?",
      answer: "Yes. The block is a rectangle with drawn grain and a pencil mark, in the section commented as the oak block. Replace it with `ctx.drawImage` of your own picture at the same coordinates, or change the gradient to greys for an aluminium billet.",
    },
    {
      question: "How heavy is the drawing?",
      answer: "Two casting outlines, a handful of gradients and about forty short grain strokes per frame. The hammered paint is a small tile made once and reused as a pattern. The loop pauses when the canvas is off screen or the tab is hidden.",
    },
    {
      question: "Why did it switch itself off while I was reading?",
      answer: "With `DEMO` left at true the vice opens and closes in a slow cycle whenever nobody has touched it for six seconds, so the gallery preview is never still. In a product that would be a bug. Turn `DEMO` off and the switch holds whatever `START_ON` or the user last set.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "steel-tape-measure-range-slider-with-a-blade-that-sags-a-thumb-lock-and-spring-rewind"],
  tags: ["switch", "toggle", "lock", "vice", "canvas", "skeuomorphic", "tool"],
  height: 760,
  interactive: true,
};

export default meta;
