const meta = {
  slug: "boarding-pass-call-to-action-that-tears-along-its-perforation-when-you-book-and-drops-the-stub",
  category: "cta-sections",
  name: "Boarding Pass Call to Action That Tears along Its Perforation When You Book and Drops the Stub",
  keyword: "boarding pass ticket react component",
  title: "React Boarding Pass CTA That Tears Off | We.Inc",
  description: "Call to action shaped as a boarding pass: press it or pull the stub and it rips along the perforation and drops. Copy the React code or the HTML free.",
  intro: "A paper boarding pass lying at a slight angle on a plain orange counter. The left end carries a destination photograph with the airline name over it, the middle has two large airport codes joined by a dotted arc, four small fields and a dark pill that states the fare, and the right end is a stub with a barcode. A row of punched holes separates the two, and you can see the counter through every one of them. Press the pass and the stub swings away from the top, catching twice as the teeth give, then comes loose, drifts to the right and settles crooked with its own shadow. The pill changes to a booked message. Pressing again deals the next flight. On a phone the whole pass shrinks as one object and stays inside the screen.",
  useWhen: [
    "An airline, ferry or coach site wants the booking button to be the ticket itself instead of a rectangle under a headline.",
    "A travel newsletter or deal page shows one featured fare at a time and wants a small ceremony when someone takes it.",
    "An event or cinema page sells admission and can swap the airport codes for a row and seat.",
    "A landing page needs one quiet object in the middle of a coloured band, with no surrounding copy to maintain.",
  ],
  customize: [
    "Every flight is one entry in the `flights` list: `number`, the two `code` and `city` pairs, `date`, `boards`, `gate`, `seat`, `fare` and a `photo` with its own `tone` fallback colour and `focus` crop. Add or remove entries freely.",
    "`MAIN_W`, `STUB_W` and `H` size the two halves. `PITCH` is the gap between holes and `HOLE` their radius, and the outline is rebuilt from them, so a finer or coarser perforation needs no other change.",
    "`OPEN` is how many degrees the stub swings before it lets go, and `REST` is the offset and tilt it lands at. Keep `REST.x` under about 90 or the stub leaves a narrow phone screen.",
    "The counter is `bg-[#e4572e]` plus the radial gradient behind the scene, the paper is `PAPER` and all printing uses `INK`. The three coloured shadows in the `filter` values are tinted for an orange counter, so retint them if you change it.",
    "To act on the booking, put your own call inside `onTorn` in the main component. It runs once, at the moment the last tooth gives.",
  ],
  accessibility: [
    "The pass is one real button whose label reads out the seat, flight, both cities and the fare, so nothing depends on being able to see the small print.",
    "Pulling the stub with a pointer is optional. Enter or Space on the pass tears it the same way, and the focus ring is drawn inside the paper edge where the cut-out shape cannot hide it.",
    "A polite live region announces the booked seat and route once the stub is free.",
    "With reduced motion the first pass is shown already torn with the stub at rest, the foil strip stops cycling, and each press swaps states without travel.",
  ],
  faqs: [
    {
      question: "How are the perforation holes made see-through?",
      answer: "Neither half is a rectangle. Each one is clipped with a `clip-path: path()` whose shared edge has a half circle bitten out at every hole position, so two halves side by side leave round gaps and the counter colour shows through. Shadows come from `drop-shadow` filters on a wrapper, which follow the clipped shape instead of the box.",
    },
    {
      question: "Why does the torn edge look ragged instead of straight?",
      answer: "Between each pair of holes the outline takes two small sideways steps chosen by a fixed pseudo random function. The main half and the stub read the same numbers, so they fit together like a jigsaw before the tear and show matching rough teeth after it.",
    },
    {
      question: "What makes the tear stutter?",
      answer: "The opening angle is driven by a keyframe list that goes forward, slips back a little and goes forward again three times. While that runs, the main half is tugged by a loose spring and snaps back when the stub leaves, which is the small kick you see at the end.",
    },
    {
      question: "Can I stop it tearing by itself?",
      answer: "Yes. Remove the effect that starts the interval in the main component. The demo also stops for good the first time a visitor presses or drags, and it waits while the pointer is over the section.",
    },
    {
      question: "Does the stub have to be on the right?",
      answer: "The geometry assumes it. The stub pivots on the bottom of the perforation and opens clockwise. For a left hand stub you would mirror both outlines and negate `OPEN` and `REST.x`.",
    },
  ],
  related: ["leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling", "enamel-kitchen-timer-you-twist-to-set-that-ticks-down-a-held-booking-and-rings", "film-clapperboard-call-to-action-with-sticks-that-snap-shut-chalked-scene-details-and-a-running-timecode-countdown"],
  tags: ["boarding pass", "ticket", "tear", "perforation", "cta", "travel", "drag", "paper"],
  height: 706,
  section: true,
  interactive: true,
};

export default meta;
