const meta = {
  slug: "sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray",
  category: "originals",
  name: "Sentence to Booking App: Keys That Lift off a Typed Strip and Seat into a Tray",
  keyword: "prompt to app animation react",
  title: "React Prompt to App Animation with a Key Tray | We.Inc",
  description: "Phrases of a typed sentence lift off a paper strip as keys and seat into a tray, forming a booking tool you can use. Copy the React code or HTML free.",
  intro: "A strip of paper carries one sentence about a surf school. Under it lies a dark tray with five empty pockets. One phrase at a time turns blue on the paper, and a thick off-white key leaves that exact spot, grows as it travels and drops into its pocket while a small lamp on the tray rim lights for it. When the fifth key lands the tray is a booking tool: a title, a row of days with a sliding blue marker, three start times, a rider counter and a blue pay key that sinks when pressed. Paying feeds a paper ticket out from under the tray with the chosen day, time and party size. The demo then books a lesson by itself, clears the tray and starts over until someone touches a key. Everything is drawn at 400 pixels wide and scaled as one object, so a phone shows the same picture smaller with no sideways scroll.",
  useWhen: [
    "A product that turns a written request into software needs one picture that explains the idea without a paragraph beside it.",
    "The top of a page about booking pages, order forms or trackers wants a visitor to press something real within the first screen.",
    "A talk or launch page needs a looping object that reads clearly as a still frame and as a short recording.",
    "You are showing that each phrase in a brief maps to one part of the result, and want that mapping to be literal.",
  ],
  customize: [
    "Edit `sentence`. Plain strings are ordinary words, and each `{ key, text }` entry is a phrase that becomes the key with that number, counted from the top of the tray.",
    "`days`, `times` and `school` hold the content of the tool. Five days fit the row; for seven, change the marker width from `/5` to `/7` in its `w-[calc(...)]` class.",
    "`BLUE` colours the underlines, lamps, day marker and focus rings. The pay key has its own three stops in the `Key` background and its side colours in `BLUE_SIDE`.",
    "Key thickness is the three stepped shadows built by `side()`. Add a fourth step and raise `bottom-[6px]` on the key to make them taller.",
    "Timing lives in one effect: `260 + i * 400` is the gap between keys, and the later `at(...)` calls script the booking.",
  ],
  accessibility: [
    "Days and start times are real `radiogroup`s of buttons with `aria-checked`, the counter buttons carry spoken labels, and a hidden live line reads out the booking when the ticket appears.",
    "Keys that have not landed yet are disabled, so the Tab key never reaches a control that is still invisible.",
    "With reduced motion the tray is shown complete, nothing flies and the scripted demo does not run. The tool itself still works.",
    "The first press or key stroke inside the tray stops the demo for good, so it cannot change a choice someone has just made.",
  ],
  faqs: [
    {
      question: "How does each key know which word to start from?",
      answer: "On mount, and whenever the container changes size, the component adds up `offsetLeft` and `offsetTop` from each phrase and each pocket up to the shared drawing surface. The difference is stored as the key's starting offset. Offsets ignore CSS transforms, so the numbers stay right while the tray is tilted.",
    },
    {
      question: "Is the booking tool real or a recording?",
      answer: "It is ordinary React state. `day`, `time`, `people` and `booked` drive what you see, and the self-running demo only calls the same setters on timers. Lift those four values into a parent if you want to send the booking somewhere.",
    },
    {
      question: "Why do the keys look thick without any 3D geometry?",
      answer: "Each key has a light top edge, three one-pixel steps of darker colour underneath for its side, and a tight contact shadow. While a key is in the air the contact shadow is swapped for a wide soft one, and a CSS transition blends between the two as it lands.",
    },
    {
      question: "Can the tray hold a different kind of tool?",
      answer: "Yes. The pockets are a five column grid, and each pocket holds one `Key` with any content inside. Change `PARTS`, give every pocket a ref slot, and write one phrase per key in the sentence.",
    },
    {
      question: "Does the tilt work on touch screens?",
      answer: "The lean toward the pointer is skipped for touch input, so the tray keeps its resting angle of 13 degrees and taps land where the finger is.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "sliding-block-puzzle-tray-where-page-sections-are-thick-glazed-tiles-you-slide-to-rearrange-a-homepage-on-a-phone", "steel-roller-shutter-stencilled-draft-that-rattles-up-to-show-a-lit-shop-window-holding-the-live-site"],
  tags: ["originals", "prompt", "booking", "web app", "assembly", "keys", "tactile"],
  height: 820,
  interactive: true,
};

export default meta;
