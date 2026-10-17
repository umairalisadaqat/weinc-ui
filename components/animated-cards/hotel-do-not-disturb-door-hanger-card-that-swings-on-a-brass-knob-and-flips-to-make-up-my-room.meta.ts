const meta = {
  slug: "hotel-do-not-disturb-door-hanger-card-that-swings-on-a-brass-knob-and-flips-to-make-up-my-room",
  category: "animated-cards",
  name: "Hotel Do Not Disturb Door Hanger Card That Swings on a Brass Knob and Flips to Make up My Room",
  keyword: "do not disturb toggle react",
  title: "React Do Not Disturb Toggle as a Door Hanger | We.Inc",
  description: "Door hanger card that swings from a brass knob as a pendulum, lifts clear when pressed and flips in 3D to its other message. Free React and HTML to copy.",
  intro: "A printed card hanging from a round brass knob on a pale green painted door. One side is oxblood with a crescent moon and the words Do not disturb in cream serif italics. The other is cream with a service bell and a request to make up the room in dark green. The knob pokes through a hole punched near the top, and the card swings from it under gravity, stirred now and then by a draught. Press it and the card is lifted until the hole clears the knob, comes toward you, turns over with a springy overshoot and is hung back, where it bounces once and swings out. Drag it sideways and let go to push it by hand. On a phone the knob stays in the middle and the door around it is simply cropped, so the card keeps a readable size.",
  useWhen: [
    "A status or focus mode switch deserves more character than a pill toggle, for example an away setting in a booking or messaging product.",
    "A hotel, guest house or rental site wants a small piece of its own stationery on the page.",
    "A studio or freelancer shows whether they are taking work this month and wants the answer to hang on a door.",
    "A settings screen has one important either-or choice and room to give it a whole panel.",
  ],
  customize: [
    "The wording is in `sides`: each side has its `lines` for the large italics, a `note` beneath and the `said` sentence read to screen readers. `hotel` holds the name and room printed at the foot.",
    "`OXBLOOD`, `CREAM` and `GREEN` are the three print colours. The door is `bg-[#c3c9b8]` with a radial gradient over it, and the frame, panel moulding and shadows are tinted to match, so change them together.",
    "`CW` and `CH` size the card. `HOLE` must stay larger than `HEAD` or the card could not pass over the knob, and `NECK` sets how far the hole hangs below the knob centre.",
    "`GRAVITY` sets how quickly it swings and `DRAG` how soon it stops. A lower `GRAVITY` reads as a longer, heavier card.",
    "To react to the choice, read `quiet` in the component: it is true while the do not disturb side faces out.",
  ],
  accessibility: [
    "The card is a single button with `aria-pressed`, true while do not disturb is showing, and its label names the room and the side on view.",
    "Enter or Space turns it over. Dragging only swings it and is never needed to change the setting.",
    "A polite live region reads the new side after a press. It stays silent while the page is demonstrating itself, so the automatic turns do not interrupt anyone.",
    "With reduced motion there is no swing, no draught and no automatic turning. The card hangs still on its do not disturb side and a press swaps the face at once.",
  ],
  faqs: [
    {
      question: "How does the card pass in front of the knob and then behind it again?",
      answer: "The hole is wider than the knob. Before turning, the card is raised by the difference between the hole and neck radii, which centres the hole on the knob so nothing overlaps. At that instant its `z-index` is raised above the knob, and lowered again after the turn. Because the knob sits wholly inside the hole at both moments, the swap cannot be seen.",
    },
    {
      question: "Is the swing a CSS animation?",
      answer: "No. A small loop integrates a pendulum every frame: the angular acceleration is minus `GRAVITY` times the sine of the angle, less `DRAG` times the current speed. That is why a hard push swings wide and slow while a nudge dies quickly, which a fixed keyframe could not do.",
    },
    {
      question: "How is the hole cut out of the card?",
      answer: "Both faces use `clip-path: path(evenodd, ...)` with two shapes in one path, the rounded outline and a circle. Under the even odd rule the circle becomes a gap, so the knob plate and the door show through it. The soft shadow on the door reuses the same path, so it has a matching hole.",
    },
    {
      question: "Why does the card twist slightly as it swings?",
      answer: "Its speed is fed into a few degrees of `rotateY`, so the leading edge appears to come forward the way a light card does when it moves through air. Set the multiplier in `twist.set` to zero for a flat swing.",
    },
    {
      question: "Can it start on the other side?",
      answer: "Yes. `flip` starts at 180, which shows the service side, and the demo turns it over shortly after load. Start it at 0 and change the initial `quiet` state to true to open on do not disturb.",
    },
  ],
  related: ["leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling", "open-passport-card-whose-visa-pages-collect-inked-entry-stamps-and-turn-over-when-the-spread-is-full"],
  tags: ["door hanger", "do not disturb", "flip", "pendulum", "toggle", "brass", "hotel", "3d"],
  height: 754,
  section: true,
  interactive: true,
};

export default meta;
