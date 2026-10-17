const meta = {
  slug: "velvet-tip-up-theatre-seat-picker-with-sprung-seats-that-fold-down-brass-number-plates-and-reserved-cards",
  category: "cta-sections",
  name: "Velvet Tip-up Theatre Seat Picker with Sprung Seats That Fold Down, Brass Number Plates and Reserved Cards",
  keyword: "react theatre seat picker",
  title: "React Theatre Seat Picker with Folding Seats | We.Inc",
  description: "Seat picker drawn as rows of velvet tip-up chairs: press one and its seat folds down, with brass numbers and a running total. Free React and HTML code.",
  intro: "A small block of cinema seating seen from the front of the house, four raked rows deep. Every chair has a red velvet back with two stitched channels and piping, cast iron standards, a walnut arm rest and a seat that is tipped up so you see its steel underside and an oval brass plate engraved with the seat number. Press a chair and the seat swings down on its spring, overshoots, knocks against its stop and settles, showing the cushion from above while a pool of warm torch light picks it out. Press again and it snaps back up. A few chairs carry a cream card on two strings that says they are taken. Wooden panels with the row letter on a brass disc close each row, and a small step light glows on the carpet under each one. The line in the corner lists the chosen seats and adds up the price, next to one button that takes the booking forward. Phones get five seats to a row instead of seven so each chair stays easy to hit with a thumb.",
  useWhen: [
    "An independent cinema, theatre or comedy club wants the booking block on an event page to feel like its own room.",
    "A supper club, tasting or workshop has a few dozen places and you want choosing one to be the main thing on the page.",
    "A private screening or premiere invitation needs guests to claim seats before a date.",
    "A venue hire page wants to show how the room is laid out and which blocks are still free.",
  ],
  customize: [
    "`ROWS` lists the row letters from the back of the house to the front and `PRICE` gives each one its price. `CURRENCY` is the symbol in front of the total.",
    "`RESERVED` is the list of chairs that get a card and cannot be pressed, and `START` is the list that is already folded down on load. Feed both from your booking data.",
    "`VELVET` holds the light, mid and shadow tones of the cloth. Bottle green or midnight blue both work if you keep the three steps about as far apart as the reds.",
    "`UP`, `DOWN` and `PEEK` are the angles of the seat at rest, chosen and under the pointer. The numbers 170 and 11 inside `tick` are the spring and its damping: lower the second for more bounce.",
    "In `geometry`, `cols` sets the chairs per row for wide and narrow screens and the list of four offsets sets how steeply the rows climb.",
  ],
  accessibility: [
    "Each chair is a real `button` laid over the drawing, with `aria-pressed` for chosen and a label such as Row B seat 4 with its price. The drawing is hidden from assistive technology.",
    "Reserved chairs stay in the tab order with `aria-disabled` and say reserved, so a keyboard user learns they exist and why they do nothing.",
    "The summary of chosen seats and the total is a polite live region. It changes once per press, never during the swing.",
    "With reduced motion the loop and the self-playing demo are off, and a pressed seat is redrawn straight in its final position.",
  ],
  faqs: [
    {
      question: "How does a flat canvas show a seat folding towards me?",
      answer: "The seat is treated as a slab hinged at the bottom of the back and viewed from slightly above. For any angle the code works out how tall the underside, the cushion top and the front edge appear from that viewpoint, and which of the two large faces is turned towards you. Past about 66 degrees the underside disappears and the cushion comes into view.",
    },
    {
      question: "Can I use it for a real booking flow?",
      answer: "Yes. The `chosen` state is a plain list of seat names such as B3. Send that list from the link at the bottom, load `RESERVED` from your server, and check availability again on the server before taking payment, since two people can press the same chair at once.",
    },
    {
      question: "Will it scale to a large auditorium?",
      answer: "It is built for a block of twenty to forty chairs, where the object itself is the appeal. For hundreds of seats, show one block like this for the section the visitor picked on an overview map, or the chairs become too small to press on a phone.",
    },
    {
      question: "Why does the demo stop when I press a chair?",
      answer: "The self-playing sequence in `DEMO` exists only to show the motion to someone who has not touched the page. The first real press sets a flag and the demo never runs again, so it cannot undo a visitor's choice.",
    },
    {
      question: "How is the velvet drawn?",
      answer: "Each cloth shape is filled with a top lit gradient, given a pale bloom down both side edges where pile catches the light, and covered with a small repeating tile of light and dark specks. The stitched channels are narrow dark to light strips, and the piping is two thin lines, one bright and one dark.",
    },
  ],
  related: ["velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway", "film-clapperboard-call-to-action-with-sticks-that-snap-shut-chalked-scene-details-and-a-running-timecode-countdown"],
  tags: ["seat picker", "theatre", "cinema", "velvet", "canvas", "booking", "spring"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
