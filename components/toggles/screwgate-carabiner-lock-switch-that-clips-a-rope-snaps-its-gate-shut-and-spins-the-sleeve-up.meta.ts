const meta = {
  slug: "screwgate-carabiner-lock-switch-that-clips-a-rope-snaps-its-gate-shut-and-spins-the-sleeve-up",
  category: "toggles",
  name: "Screwgate Carabiner Lock Switch That Clips a Rope, Snaps Its Gate Shut and Spins the Sleeve Up",
  keyword: "react lock toggle switch",
  title: "React Lock Toggle Switch as a Carabiner | We.Inc",
  description: "Lock switch on a canvas: a rope clips through the gate of a carabiner, the gate snaps shut and the sleeve screws up to lock. Free React and HTML to copy.",
  intro: "An on and off switch told as the two-step habit every climber learns: clip, then lock. An anodised blue carabiner lies on a pale table with an orange rope beside it. Press anywhere on it and the rope lifts, shoulders the sprung gate inward and drops into the basket. The gate slams back against the nose with a small rattle, then the sleeve winds up the thread, its grip ribs travelling across the barrel, until the red warning band is covered. Press again and the whole move runs in reverse. Because locked takes a second and a half to reach and looks different from every angle, it suits choices that should feel deliberate. A sheen crosses the metal with the pointer. Everything is one canvas that scales with its container, so on a phone the picture shrinks as a whole and the full area stays tappable.",
  useWhen: [
    "A setting protects something, such as locking a document, freezing a card or arming two-step sign in, and a thumb-sized pill switch feels too casual.",
    "An outdoor, climbing gym or safety training site wants its opt-in or checklist step to speak the visitor's own language.",
    "A booking flow ends with a final confirmation and you want the locked state to be visible at a glance before the form is sent.",
    "A product page for hardware or luggage needs a hero object that shows a mechanism working when it is pressed.",
  ],
  customize: [
    "`BODY` is three colours for the anodising: shade, face and highlight. `[\"#5a1408\", \"#c8371c\", \"#ff9a78\"]` gives a red carabiner, and the sleeve follows.",
    "`ROPE` holds the sheath shade, sheath colour and the two fleck colours of the braid. Change the second entry first and darken it for the first.",
    "`TRAVEL` is the length of the full move in seconds. `0.9` feels brisk. The gate and sleeve keep their share of the time.",
    "`LABEL` is the name printed under the switch and read out with its state. `START_LOCKED` chooses the state on load.",
    "`TILT` turns the carabiner on the table in radians, and `OX` and `OY` move it. The rope is drawn in the same turned space, so they stay together.",
    "`WARN` is the band on the gate that shows while the sleeve is undone. Keep it far from the `BODY` hue so the open state stands out.",
  ],
  accessibility: [
    "One real button with `role=\"switch\"` and `aria-checked` covers the drawing, so it is reached with Tab and flipped with Space or Enter.",
    "The caption is a polite live region that states in words whether the gate is locked or open. Keep it, because the red band alone would not reach colour-blind visitors.",
    "The focus ring is drawn with an offset in the stage colour so it stays visible against both the table and the rope.",
    "With reduced motion the rope, gate and sleeve jump straight to their end positions and the self-running demo is switched off.",
  ],
  faqs: [
    {
      question: "How do I connect the switch to my own state?",
      answer: "The `locked` state is a boolean. Add an `onChange` prop and call it inside the `hands` function where `setLocked` is called. To control it from outside, set `want.current` from a prop in an effect and call the same function when the two differ.",
    },
    {
      question: "Can I wait for the animation to finish before acting on a lock?",
      answer: "Yes. The internal progress value `S.p` runs from 0 to 1 over `TRAVEL` seconds. Fire your callback in the frame loop when it first equals the goal, and the action will happen as the sleeve stops turning.",
    },
    {
      question: "How is the rope drawn to look braided?",
      answer: "The rope is one curve sampled into 65 points. It is stroked wide in a dark shade, again in the sheath colour, then twice more with dashed strokes offset to either side and half a dash out of step, which reads as a woven pattern. Thin dark and light strokes along the edges round it off.",
    },
    {
      question: "Why does the rope pass under one side of the carabiner and over the other?",
      answer: "A rope that runs through a ring lying flat has to cross it once above and once below. The curve is drawn in two halves, one before the carabiner and one after it, with the join hidden in the open middle.",
    },
    {
      question: "Does the canvas redraw all the time?",
      answer: "It draws while visible, because the rope shifts slightly and the sheen follows the pointer. The forged body with its grain and markings is painted once and reused. Drawing stops when the switch leaves the viewport or the tab is hidden.",
    },
  ],
  related: [
    "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put",
    "mechanical-stopwatch-with-a-crown-you-press-a-ticking-sweep-hand-and-a-flyback-reset",
    "leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling",
  ],
  tags: ["switch", "toggle", "lock", "carabiner", "rope", "canvas", "climbing", "confirm"],
  height: 760,
  interactive: true,
};

export default meta;
