const meta = {
  slug: "shop-door-open-closed-enamel-sign-toggle-that-spins-on-its-chain-and-rings-a-brass-bell",
  category: "toggles",
  name: "Shop Door Open Closed Enamel Sign Toggle That Spins on Its Chain and Rings a Brass Bell",
  keyword: "react open closed sign toggle",
  title: "React Open Closed Sign Toggle with a Door Bell | We.Inc",
  description: "Toggle built as a shop door: an enamel sign on a chain spins from Open to Closed, a brass bell swings and the shop lights go out. Free React and HTML code.",
  intro: "A switch you would recognise from any high street. The frame is a navy painted door with a glazed panel, and behind the glass hangs an enamel plate on a ball chain from a suction hook. Press the plate and it turns half a revolution on its chain, overshoots, winds back and settles, swaying sideways as it goes. One face is cream with red lettering and says Open. The other is red with cream lettering and says Closed. The same push knocks the brass bell at the top of the frame, which rocks on its spring arm while the clapper lags behind it. The florist seen through the pane is lit warm when the shop is open and drops to a blue dusk when it shuts, and the reflection of the street on the glass grows stronger. On a phone the whole door scales down in one piece and the plate stays a large target.",
  useWhen: [
    "A small business site wants its opening state shown as the sign on its own door, tied to real opening hours.",
    "A booking or ordering page needs one obvious switch for taking orders or pausing them.",
    "A store admin screen has a holiday mode or maintenance mode and a plain checkbox makes it too easy to miss.",
    "A landing page for a florist, cafe or bookshop wants a first screen that is a single object and no headline.",
  ],
  customize: [
    "The `shop` object holds both faces. `open.word` and `closed.word` are the large lettering, `line` is the italic sentence under each, and `hours` is the gilded strip at the foot of the glass.",
    "`PAINT` is the door colour and also the page background. `#23402f` gives a dark green shopfront, `#5b1f1c` an oxblood one.",
    "`RED` and `CREAM` are the two enamel colours. They swap roles between the faces, so change both together.",
    "`SWING` is how hard the plate is knocked sideways when it turns, from 0 for a clean spin to 100 for a slammed door.",
    "Replace `shop.photo.src` with a picture of your own interior and set `tone` to its average colour, which shows while the photograph loads.",
  ],
  accessibility: [
    "The plate is one `button` with `role=\"switch\"` and `aria-checked`, labelled Shop open, so its state is read as on or off instead of two unrelated words.",
    "Space and Enter both turn the sign, and focus draws an amber ring that follows the plate round as it swings.",
    "The sentence in the corner is a polite live region and restates the result in words, which also covers the moment when the plate is edge on.",
    "Under reduced motion the plate, bell and reflections jump to their resting positions and the door never flips by itself.",
  ],
  faqs: [
    {
      question: "How does the sign know which face to show?",
      answer: "It does not pick one. The plate is a real two-sided object in CSS 3D: both faces sit in the same place, the back one turned 180 degrees, each with `backface-visibility: hidden`. Every press adds half a turn to a counter and a spring chases that angle, so the browser shows whichever face is toward you.",
    },
    {
      question: "Why does it overshoot and come back?",
      answer: "A plate on a chain is a torsion pendulum. The spring that drives the turn is left underdamped on purpose, with a stiffness of 46 against a damping of 4.6, so it passes the half turn by about twenty degrees and unwinds. Raise the damping to 13 for a single clean flip.",
    },
    {
      question: "Does the bell make a sound?",
      answer: "No, the component is silent as shipped. `BELL_SOUND` is a constant set to false with a marked place in `flip` where you can play your own audio if your site already asks permission for sound.",
    },
    {
      question: "Can I control it from opening hours instead of a click?",
      answer: "Yes. `open` is ordinary React state. Compute the right value from the clock in an effect and call `flip` when it differs. Remove the idle demo block that runs after seven seconds without input so the sign only moves when the hours change.",
    },
    {
      question: "Why is the photograph blurred?",
      answer: "The eye should rest on the plate, and a shop interior seen through glass from the pavement is out of focus when you look at the sign. The blur is the `blur(2.5px)` in the image filter. The picture also drifts a few pixels against the pointer so the room appears to sit behind the pane.",
    },
  ],
  related: ["hotel-room-key-and-enamel-fob-on-a-brass-ring-that-swing-and-knock-together", "yellow-umbrella-toggle-switch-that-springs-open-on-its-ribs-and-sheds-rain-off-the-canopy", "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp"],
  tags: ["toggle", "switch", "sign", "shop", "door", "bell", "enamel", "3d", "physics"],
  height: 720,
  interactive: true,
};

export default meta;
