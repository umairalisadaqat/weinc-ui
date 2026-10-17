const meta = {
  slug: "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put",
  category: "toggles",
  name: "Lathe-Turned Metal Dial Switch with Detents and Light That Stays Put",
  keyword: "rotary knob switch react",
  title: "React Rotary Knob Switch with Detents | We.Inc",
  description: "Rotary switch on a canvas: a turned aluminium dial with a knurled grip clicks between stops while the reflections hold still. Free React and HTML to copy.",
  intro: "A three-way selector built as a machined aluminium dial on a black plate. The detail that sells the metal is what does not move: when you turn the dial, the bright and dark wedges on its face stay where the lamp put them, and only the orange notch and the teeth of the knurled grip travel. That is how a lathe-turned part behaves in the hand. Drag anywhere on the dial to turn it. It resists leaving a stop, drops into the next one, and springs back if you push past the end of its travel. A tap steps to the next position, and each label on the scale is also a button. A small lamp beside the chosen stop warms up as the dial arrives. The whole piece is a 320 pixel square on phones and is shown a quarter larger from tablet width up.",
  useWhen: [
    "A setting has three or four named levels and a row of radio circles would undersell it, such as fan speed, fan mode or quality.",
    "An audio, lighting or smart home screen wants one control that looks like the equipment it stands for.",
    "A pricing or plan page uses a single playful selector to switch what the cards below it show.",
    "A product page for hardware needs a hero object that visitors can turn while they read.",
  ],
  customize: [
    "`modes` holds the stops. Each has a `label` for the scale and a `note` for the line under the dial. Four entries work without other changes.",
    "`SWEEP` is the angle in degrees from the first stop to the last. 104 keeps three labels clear of each other. Use 150 for five stops.",
    "`LAMP` colours the notch, the lit lamp and the focus ring together. `#3ddc97` gives a green instrument look.",
    "The two numbers passed to `sheen(la, 104, 246)` are the darkest and brightest greys on the face. Bring them closer for a satin finish, or lower both for gunmetal.",
    "Spring feel is `520` (stiffness) and `19` (damping) in the frame loop. Raise the damping to 30 to remove the small overshoot at each stop.",
  ],
  accessibility: [
    "The canvas is decoration. The real control is a `radiogroup` of three buttons with `role=\"radio\"` and `aria-checked`, placed on the scale labels.",
    "Only the selected radio is in the tab order. Left, Right, Up and Down move the selection, Home and End jump to either end of the scale.",
    "The line under the dial is a polite live region, so a screen reader hears the new mode and what it does.",
    "With reduced motion the dial jumps straight to the chosen stop and the self-running demo never starts.",
  ],
  faqs: [
    {
      question: "Why do the reflections stay still when the dial turns?",
      answer: "Lathe marks are circles around the centre, so the surface looks identical at every angle of rotation. The bright wedges depend only on where the light and the viewer are. The face is painted with a conic gradient whose angle follows the light, and the dial angle is applied to the notch and grip teeth alone.",
    },
    {
      question: "How is the click between stops made without sound?",
      answer: "While you drag, the drawn angle is not the raw pointer angle. A sine curve is subtracted from it so the dial lags as it leaves a stop and catches up quickly as it nears the next. On release a slightly underdamped spring finishes the move.",
    },
    {
      question: "Can I read the selected value from my own code?",
      answer: "Yes. The `mode` state is the index of the chosen entry in `modes`. Lift it into a parent with a prop and a callback, or read `modes[mode].label` wherever you need the value.",
    },
    {
      question: "Does dragging work on a touch screen?",
      answer: "The grab area uses pointer events with `touch-none`, so a finger turns the dial and the page does not scroll while it is held. The angle is measured as change since the last move, which means you can start the drag from any point on the dial.",
    },
    {
      question: "What does it cost to draw?",
      answer: "One conic fill, one cached image of the lathe rings and 168 small wedges for the grip per frame, at no more than two and a half canvas pixels per screen pixel. The loop stops when the dial is scrolled out of view or the tab is hidden.",
    },
  ],
  related: ["louvred-window-shutters-toggle-that-tilt-their-slats-and-swing-open-onto-a-coastal-photograph", "open-gate-manual-gear-lever-selector-with-a-chrome-h-pattern-plate-and-a-ball-knob-you-drag-through-the-slots", "piano-octave-key-picker-with-real-key-dip-red-felt-and-a-lacquer-fallboard-that-mirrors-the-keys"],
  tags: ["dial", "knob", "metal", "rotary", "canvas", "selector", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
