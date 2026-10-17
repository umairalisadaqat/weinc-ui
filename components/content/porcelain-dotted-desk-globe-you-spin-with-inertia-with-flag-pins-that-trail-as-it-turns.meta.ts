const meta = {
  slug: "porcelain-dotted-desk-globe-you-spin-with-inertia-with-flag-pins-that-trail-as-it-turns",
  category: "content",
  name: "Porcelain Dotted Desk Globe You Spin with Inertia with Flag Pins That Trail as It Turns",
  keyword: "react dotted globe drag to spin",
  title: "React Dotted Globe You Drag to Spin | We.Inc",
  description: "Canvas globe of blue dots on a porcelain ball: drag it and it turns on with inertia while the flags on its pins trail behind. Free React and HTML code.",
  intro: "A white porcelain globe the size of a grapefruit, standing in a turned brass foot on a pale table. Its continents are rows of small blue dots pressed into the glaze, fine blue lines of latitude and longitude are scored round it, a brass cap marks the pole, and a window is reflected high on its left side. Five steel pins with coloured heads stand out of it, each flying a pennant. The globe arrives spinning, slows, and comes round to the first pin with a slight overshoot. After that it visits each pin in turn. Take hold of it and it follows your hand, then carries on with the speed you gave it until friction brings it back to a slow idle turn. The pennants swing to trail behind whichever way their pin is moving. On a phone the whole object scales to the screen and the place buttons wrap under it.",
  useWhen: [
    "An about or contact page lists a handful of offices, studios or depots and wants them shown as places in the world, with no need for street level detail.",
    "A shipping, travel or remote-work product wants one tactile object in its first screen that visitors will pick up and play with.",
    "A fictional setting, game or tabletop campaign needs its own planet with named locations.",
    "A conference or community page wants to show where its members are, a few at a time.",
  ],
  customize: [
    "The `places` list is the pins: `lat` and `lon` in degrees, `name` and `role` for the caption and buttons, `color` for the pin head and its flag. Every pin is moved to the closest dot of land when the globe is built.",
    "`SEA` decides how much of the ball is ocean, and the three offsets added inside `isLand` pick which invented continents you get. Change any of them for a different planet.",
    "`GRID` is the spacing of the dots in degrees and `DOT` is their size. The three blues in `INK` are used for dots in full light, half light and shade.",
    "`TILT` leans the axis and `REST` tips the north pole toward the viewer. `IDLE` is the turning speed when nobody is touching it.",
    "The porcelain is the `body` gradient in `buildSprites`. Swap its stops for dark greys to get a black glass ball, and lighten `INK` to match.",
  ],
  accessibility: [
    "The globe is a focusable `slider`: left and right arrows give it a push, up and down tip it, and `aria-valuetext` names the pin that is nearest the front.",
    "Every pin also has its own button with `aria-pressed`, which turns the globe to that place, so dragging is never the only way to reach one.",
    "The caption is an `aria-live` line giving the name and role of the place in front. It is the text version of what the flags show.",
    "With reduced motion the globe is drawn once, facing the first pin, with flags at rest. Buttons and arrow keys still move it, in single steps with no spin.",
  ],
  faqs: [
    {
      question: "How does the spin keep going after I let go?",
      answer: "While you drag, the code keeps a running average of how fast your hand is turning the ball. On release that speed is left in place and decays toward `IDLE` with a time constant of three quarters of a second. If you held still for a moment before letting go, the speed is cleared first, so the globe stays where you put it.",
    },
    {
      question: "Is the map of the real Earth?",
      answer: "No. The land is generated: each candidate dot is tested against four layers of 3D noise and kept if the sum passes `SEA`. That avoids shipping coastline data and means the world is yours. For the real continents you would replace `isLand` with a lookup into a land mask you have the right to use.",
    },
    {
      question: "How are pins on the far side handled?",
      answer: "Drawing happens in layers. Pins whose base is on the far half are drawn first, then the ball, then the dots and glaze, then the near pins sorted from back to front. A pin just over the horizon therefore shows its head above the edge while its foot is hidden, which is what a real one does.",
    },
    {
      question: "What makes the flags swing?",
      answer: "Each flag has a direction held by a damped spring. Its target is a gentle breeze to the right minus the screen velocity of the pin's tip, so a fast pin drags its flag out behind it. When the globe slows, the spring lets the flag swing back and settle.",
    },
    {
      question: "How heavy is the drawing loop?",
      answer: "The ball, glaze, foot and pin heads are painted once into sprites. Each frame rotates the dots with one 3 by 3 matrix, sorts the visible ones into three colour groups and fills each group as a single path. The loop pauses when the globe is off screen or the tab is hidden.",
    },
  ],
  related: ["folded-paper-street-map-that-unfolds-panel-by-panel-with-creases-and-a-pin-that-drops-in", "steel-wristwatch-with-a-sweeping-seconds-hand-date-window-and-a-crown-you-pull-to-set-the-time", "brass-pendulum-wall-clock-that-beats-once-a-second-in-true-time-and-throws-a-moving-shadow"],
  tags: ["globe", "canvas", "drag", "inertia", "pins", "map", "3d"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
