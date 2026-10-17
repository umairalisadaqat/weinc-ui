const meta = {
  slug: "hotel-keycard-door-lock-switch-with-a-card-that-dips-into-the-reader-a-lamp-that-turns-green-and-a-lever-that-drops",
  category: "toggles",
  name: "Hotel Keycard Door Lock Switch with a Card That Dips into the Reader, a Lamp That Turns Green and a Lever That Drops",
  keyword: "lock unlock toggle react",
  title: "React Lock and Unlock Toggle: Hotel Keycard | We.Inc",
  description: "Lock switch drawn as a hotel door lock: a key card dips into the reader, the lamp turns green and the chrome lever drops. Free React and HTML code to copy.",
  intro: "An on and off switch in the shape of the lock on a hotel room door. A brushed steel plate is fixed to a dark green door. At its top is a gloss black reader with a slot, a domed lamp and a small engraved card symbol, then a chrome lever on a round rose, then a key override. A cream key card with a rising sun printed on it hangs in the air above the slot, tilted and bobbing. Switch it on and the card drops into the slot, the lamp flickers amber for a third of a second while the reader thinks, turns green, and the lever swings down on a spring and stays there. Switch it off and the card lifts back out, the lamp goes red at once and the lever returns level with a small bounce. The lamp throws its colour onto the black block and the steel below it. The drawing is one canvas that scales with the column, so it fills a phone screen without changes.",
  useWhen: [
    "A booking, hospitality or short-let product has a real lock to control and wants the button to look like the door.",
    "A settings page has one switch that matters more than the rest, such as making a page private or freezing a card.",
    "A smart home dashboard shows the state of a door and lets the owner change it from the same picture.",
    "A landing page for access control hardware needs a working object above the fold.",
  ],
  customize: [
    "`ROOM` and `HOTEL` are printed on the card and used in the spoken label. Keep `HOTEL` to about ten letters so it fits the card width.",
    "`CARD` holds the three card colours: `paper`, `sun` and `sea`. A black `paper` with a gold `sun` gives a boutique look.",
    "`RED`, `AMBER` and `GREEN` are the lamp colours as red, green, blue triples. The glow on the block and plate follows them.",
    "How far the lever falls is the `25` in the line that computes `ang`, in degrees. The bounce comes from `230` and `13` in the frame loop.",
    "The door is the root background, `#1c3a34` with a soft radial light. Change the three greens in that class together for a different paint colour.",
  ],
  accessibility: [
    "The control is a transparent `button` with `role=\"switch\"` and `aria-checked`, laid exactly over the steel plate, so Space and Enter work and the focus ring follows the plate outline.",
    "State is never colour alone: the card is in or out, the lever is level or down, and the caption under the door says Locked or Unlocked in words.",
    "The caption is a polite live region, which is how the change is announced after the animation starts.",
    "With reduced motion the card, lamp and lever are drawn in their final positions and the piece stops toggling by itself.",
  ],
  faqs: [
    {
      question: "How do I connect the switch to my own state?",
      answer: "The component keeps a boolean called `on`. Replace it with a prop and call your handler inside `toggle`. If the real lock takes time to answer, call `api.current.set` only after your request succeeds, and the card will wait above the slot until then.",
    },
    {
      question: "Why does the lamp blink amber before it turns green?",
      answer: "Card readers take a moment to check a card, and that pause is what makes the green feel earned. The frame loop holds an amber stage for 300 milliseconds once the card is nearly seated, flashing every 75, and only then lets the lever move. Set the 300 to 0 to skip it.",
    },
    {
      question: "How does the card disappear into the slot?",
      answer: "Nothing is hidden behind another layer. The card is drawn last, inside a clipping rectangle that ends at the slot line, so any part of it below that line is simply not painted. The same clip trims its shadow.",
    },
    {
      question: "Can visitors click the card or the lever instead of the plate?",
      answer: "Yes. The whole drawing responds to a click or tap. The focusable button covers only the plate so that the keyboard focus ring has a clean shape to follow.",
    },
    {
      question: "Is the brushed steel an image?",
      answer: "No. A small off-screen canvas is filled once with a few hundred vertical lines of random lightness and then tiled down the plate under a left to right gradient. No file is loaded.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "hotel-room-key-and-enamel-fob-on-a-brass-ring-that-swing-and-knock-together", "four-wheel-brass-combination-cable-lock-code-input-with-rings-that-click-round-and-a-cable-that-springs-free"],
  tags: ["toggle", "switch", "lock", "keycard", "hotel", "canvas", "skeuomorphic"],
  height: 800,
  interactive: true,
};

export default meta;
