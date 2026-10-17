const meta = {
  slug: "phone-game-built-from-stacked-glass-layers-that-press-together-into-a-playable-screen",
  category: "originals",
  name: "Phone Game Built from Stacked Glass Layers That Press Together into a Playable Screen",
  keyword: "exploded phone layers animation react",
  title: "React Exploded Phone Layers Animation, Playable | We.Inc",
  description: "Sheets of a phone game float apart like a model kit, then press together into one screen running a jumping game you can play. Free React and HTML code.",
  intro: "A phone shown the way a kit shows its parts. Seven sheets hang in the dark at an angle: the shell with its cell and board, a night sky with a moon, two ridges of hills, the ground with its obstacles, the hero, the score and the cover glass. Each glass sheet has a lit edge and a printed name beside it, and the stack turns slowly. The game never stops while the parts are apart, so the hero keeps jumping on a sheet of its own and the hills drift on another. After a few seconds the sheets close from the bottom up and become one phone facing you, still running. Tap the phone or press Space on it to jump yourself; the game hands control back when you stop. A pill under the stage opens and closes the stack. On a phone the whole scene is scaled down, labels included.",
  useWhen: [
    "A page about making mobile apps or small games needs one object that shows what a screen is made of.",
    "You want to explain parallax, sprites and a score overlay to someone who has never opened a game editor.",
    "A hero area needs something a visitor can play for ten seconds without leaving the page.",
    "A product tour wants an exploded view that closes into the finished thing on a button press.",
  ],
  customize: [
    "`layers` holds the printed names, bottom to top. The order of the `Sheet` elements in the markup must match it.",
    "`GAP` is the space between sheets when open. `TILT` and `TURN` are the viewing angles in degrees; 65 and -45 give a classic isometric look.",
    "Game feel is three numbers: `SPEED` in pixels per second for the scroll, `JUMP` for take-off speed and `GRAV` for how fast the hero comes down.",
    "The sky is one gradient on the second sheet (`#0B0D12` to `#1f4a8f`), and the hills are the two `fill` colours on the SVG paths.",
    "The bounce is the spring in `Sheet`: `stiffness: 150, damping: 14`. The bounce shows when the stack opens; on closing each sheet is stopped at its resting place so it cannot pass through its neighbour. Change `* 75` to alter the stagger.",
  ],
  accessibility: [
    "The phone is one real button labelled Jump, so Enter and Space work on it, and the open and close pill reports its state with `aria-pressed`.",
    "A hidden live line says whether the layers are apart or together, since that change is otherwise only visual.",
    "With reduced motion the stack is shown closed as a still phone, the game loop and the sway never start, and the pill switches between the two views instantly.",
    "Sheet names are decorative and hidden from assistive technology; do not put information there that is not available elsewhere.",
  ],
  faqs: [
    {
      question: "Is this WebGL?",
      answer: "No. The stack is plain elements inside a `preserve-3d` group, each moved along the Z axis with its own spring. The game itself only writes `transform` and `opacity` on a handful of elements each frame.",
    },
    {
      question: "How does the game keep running across separate sheets?",
      answer: "One animation frame loop holds the state: scroll distance, three obstacle positions, the hero's height and speed. It then writes to elements that happen to live on different sheets. Whether the sheets are apart or together makes no difference to the loop.",
    },
    {
      question: "Why does glass look thick when it is a flat element?",
      answer: "Every glass sheet is drawn three times, two and four pixels behind the front face, with only a border. Seen at an angle the three outlines read as the front and back edges of one slab. They fade out as the stack closes so the finished screen stays crisp.",
    },
    {
      question: "What happens when the hero hits an obstacle?",
      answer: "It blinks for a moment and carries on. There is no game over, because the piece is a showpiece and should never sit on a dead screen. Add a lives counter in the collision branch if you want one.",
    },
    {
      question: "Can I stop it opening and closing by itself?",
      answer: "The cycle stops for good the first time someone uses the pill. To start with it off, set the initial value of `auto` to false.",
    },
  ],
  related: ["sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray", "pin-art-board-where-steel-pins-rise-into-the-relief-of-an-app-screen-and-follow-the-pointer", "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage"],
  tags: ["originals", "phone", "game", "layers", "exploded view", "3d", "playable"],
  height: 800,
  interactive: true,
};

export default meta;
