const meta = {
  slug: "walnut-dice-tray-lined-in-green-baize-where-two-dice-tumble-with-rigid-body-physics-and-settle-on-true-faces",
  category: "app-ui",
  name: "Walnut Dice Tray Lined in Green Baize Where Two Dice Tumble with Rigid Body Physics and Settle on True Faces",
  keyword: "react dice roller with physics",
  title: "React Dice Roller with Physics on Green Baize | We.Inc",
  description: "Dice roller on one canvas: the dice tumble round a walnut tray, knock each other and settle on the faces the physics chose. Free React and HTML to copy.",
  intro: "Two dice in a walnut tray with a brass line let into the rim and a green baize floor. Nothing about the throw is scripted. Each die is a cube with position, spin and eight corners, and every corner that touches the cloth or a wall receives an impulse with friction, so the dice skid, catch an edge, tip over and rock to a stop the way real ones do. The number read out underneath is taken from whichever face ends up pointing at the ceiling. Press and hold inside the tray to pick both dice up, shake them around and let go to fling them in the direction your hand was moving. The button under the tray throws them for you. The tray scales with the width of the screen, so on a phone it is the same picture at about half size and the button stays full height.",
  useWhen: [
    "A board game companion app needs a two dice roll that players trust because they can watch it happen.",
    "A tabletop role-playing site wants a hero object on its landing page that visitors can pick up and throw.",
    "A classroom probability lesson needs fair looking dice whose totals can be tallied by hand.",
    "A party game or chore picker decides whose turn it is and a plain random number would feel flat.",
  ],
  customize: [
    "`dice` holds one entry per die: `body` is the plastic as red, green, blue, `pip` is the paint in the pits and `ace` is the single large pip. Add a third entry for three dice.",
    "`FELT` is the cloth colour as red, green, blue. `[122, 28, 40]` gives a claret tray and `[28, 60, 120]` a blue one. The lined walls follow it.",
    "`GRAVITY`, `BOUNCE` and `GRIP` set the feel of the throw. Halve `GRAVITY` for a slow, heavy roll. Raise `BOUNCE` towards 0.6 for a hard table.",
    "`HX` and `HZ` are half the floor in die widths, and `S` is the size of one die in pixels. A smaller `S` with larger halves gives a big tray with small dice.",
    "The opening throw is the `fling` call near the end of the effect. Its second argument is the starting speed across the tray.",
  ],
  accessibility: [
    "The tray is a picture for sighted pointer users. The `Throw the dice` button does the same job from the keyboard with Enter or Space and has a visible focus ring.",
    "The line under the tray is a polite live region. It says `Rolling` during a throw, then both faces in words and their total.",
    "With reduced motion the throw is still simulated, but in one go, and only the dice at rest are drawn. The automatic repeat throws do not run.",
    "Keep the result as text if you restyle it. The pips on the canvas are not available to a screen reader.",
  ],
  faqs: [
    {
      question: "Is the result decided before the dice stop?",
      answer: "No. The throw gives each die a random orientation, speed and spin, and from there the cube is stepped forward 480 times a second. When both dice are lying still, the code looks at which of the six local axes points most nearly upward and reads the value from that face.",
    },
    {
      question: "How are the dice drawn without a 3D library?",
      answer: "The camera has no perspective, so a square face of the cube is always a parallelogram on screen. For each face that points at the viewer the canvas transform is set to that parallelogram, and the rounded square, the shading and the pips are drawn as if the face were flat. Three faces at most are visible at a time.",
    },
    {
      question: "Can a die end up leaning on the wall or on the other die?",
      answer: "It can try. After three seconds of a throw, any die that is still not flat gets a growing turning force towards its nearest face and extra drag, so every throw ends with a readable number. In practice the cloth friction settles most throws in under two seconds.",
    },
    {
      question: "How do I use the roll in my own game?",
      answer: "The `faces` state is an array with one number per die, or null while they are moving. Read it in an effect, or call your own function from `report`, which runs once at the moment the last die goes to sleep.",
    },
    {
      question: "Are the dice fair?",
      answer: "They are as fair as the physics: a uniform cube thrown with random spin. The component uses `Math.random` for the starting conditions, which is fine for play. Do not use it where a result has to be provably random or tamper proof.",
    },
    {
      question: "Why do the dice keep throwing themselves?",
      answer: "That is the idle demo for a preview. When nobody has touched the tray for seven seconds and the dice have been still for a few seconds, it throws again. Remove the line that calls `roll()` inside `frame` to switch it off.",
    },
  ],
  related: ["wooden-marble-run-where-glass-marbles-roll-down-zigzag-ramps-and-ring-a-brass-bell", "crt-monitor-preview-frame-that-warms-up-with-scanlines-a-degauss-wobble-and-a-collapsing-power-off", "ebony-and-ivory-domino-spiral-that-topples-tile-by-tile-with-real-contact-physics-and-stands-back-up"],
  tags: ["dice", "physics", "canvas", "game", "tabletop", "roller", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
