const meta = {
  slug: "restaurant-reservation-book-time-picker-with-a-pencil-on-a-string-that-writes-your-table-into-a-free-line",
  category: "forms",
  name: "Restaurant Reservation Book Time Picker with a Pencil on a String That Writes Your Table into a Free Line",
  keyword: "restaurant reservation form react",
  title: "React Restaurant Reservation Form in a Book | We.Inc",
  description: "Reservation picker drawn as a booking book: choose a free line and a pencil on a string writes your table in. Free React and Tailwind code, or HTML.",
  intro: "A table booking picker that looks like the book kept by the door of a restaurant. It lies open on a dark table: lunch on one page, dinner on the other, eight ruled lines each with the time printed in red. Lines that are gone carry a pencilled name and the number of covers, and the odd one has been struck through. A yellow pencil is tied to the spine with twine. Move a mouse over the pages and the pencil follows it, dragging the twine behind across the table with friction. Choose a free line and the pencil rings the time, writes a name along the rule and adds the party size, with each stroke drawn as it passes. The arrows under the book turn one leaf to the next or previous day, and the leaf really turns, with the following lunch on its back. On phones the book opens top to bottom, so both pages stay full width.",
  useWhen: [
    "A restaurant, wine bar or supper club takes bookings for set times at lunch and dinner and wants the form to feel like its own front desk.",
    "A tasting room or chef's table has few seats and needs taken sittings to be obvious at a glance.",
    "A guided tour, boat trip or workshop has morning and afternoon departures that fit the two pages.",
    "A hospitality template needs a centrepiece that shows availability and choice in a single object.",
  ],
  customize: [
    "`SITTINGS` holds the two pages. Rename them, for example Morning and Afternoon, and list eight times in each; fewer lines also work and the pages shorten.",
    "`entryAt` decides which lines are taken. Replace its body with a lookup into your own bookings and return `null` for a free line. `FULLNESS` only matters for the built-in sample data.",
    "`COVERS` is the party size written after the name, from 2 to 8. The pencilled numerals are the short paths in `DIGIT`.",
    "The printed ink is `#8d2f27` throughout, the paper is `bg-[#f1e7d0]` and the leather is `bg-[#5e211e]`. A green baize look uses `#1f4a36` for the leather and `#254f8a` for the ink.",
    "`OPEN_ON` sets the weekday the book opens at, and `AUTOPLAY` set to false keeps the pencil still until a visitor moves it.",
  ],
  accessibility: [
    "Every line is a `button` named with its time, the sitting and whether it is free, taken or your table. Taken lines are disabled and the chosen one carries `aria-pressed`.",
    "The pencil, the twine and the handwriting are decoration and hidden from assistive technology; the sentence below the book is a polite live region that states the day and time held.",
    "Previous day and Next day are labelled buttons. While a leaf is turning the copies of the pages on it cannot be focused.",
    "Reduced motion leaves the pencil lying where it is, writes the booking in at once and changes day without turning the leaf.",
  ],
  faqs: [
    {
      question: "How is the handwriting made?",
      answer: "Each name is a path built from a seeded run of small curves: arches, loops, tall strokes and tails, slanted twelve degrees and pushed through a turbulence filter so the line breaks up like graphite. It is meant to read as a name without spelling one, so no customer details are ever shown.",
    },
    {
      question: "How does the string behave like string?",
      answer: "It is thirty points joined by fixed lengths. On each frame every point keeps a fifth less of its speed, as if dragged over a table, and then the lengths are corrected several times. One end is pinned to the brass eyelet in the spine and the other to the end of the pencil.",
    },
    {
      question: "How do I send the booking to my server?",
      answer: "The `booking` state holds the day as an offset from today, the page and the line. Convert it with `dateOf` and the `SITTINGS` list and post it from the `pick` function, or mirror it into hidden form fields.",
    },
    {
      question: "Does the pencil follow a finger on touch screens?",
      answer: "No. Following is limited to a mouse so that scrolling the page with a thumb does not drag the pencil about. On touch, tapping a free line sends the pencil there to write and then it returns to rest.",
    },
    {
      question: "Why does the loop stop when nothing is moving?",
      answer: "Once the pencil and every point of the twine have been still for twenty frames the animation frame loop ends, and it starts again on the next pointer move, tap, resize or page turn. It also pauses while the book is scrolled out of view.",
    },
  ],
  related: ["barbershop-appointment-card-rack-time-slot-picker-where-your-card-lifts-out-and-drops-into-a-free-hour-pocket", "paper-cheque-payment-form-that-writes-the-payee-amount-in-words-and-signature-in-pen-as-you-type", "pin-tumbler-lock-cutaway-password-strength-field-where-each-rule-sets-a-pin-and-the-key-turns-the-plug"],
  tags: ["reservation", "time picker", "booking form", "restaurant", "pencil", "rope physics", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
