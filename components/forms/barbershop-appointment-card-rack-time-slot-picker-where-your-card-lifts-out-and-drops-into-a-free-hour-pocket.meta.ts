const meta = {
  slug: "barbershop-appointment-card-rack-time-slot-picker-where-your-card-lifts-out-and-drops-into-a-free-hour-pocket",
  category: "forms",
  name: "Barbershop Appointment Card Rack Time Slot Picker Where Your Card Lifts Out and Drops into a Free Hour Pocket",
  keyword: "tailwind time slot picker",
  title: "React Time Slot Picker as a Card Rack | We.Inc",
  description: "Time slot picker drawn as a barbershop card rack: taken hours hold cards and yours drops into any free pocket. Free React and Tailwind code, plus HTML.",
  intro: "A time slot picker in the shape of the green steel card rack that hangs behind a barber's till. There is a row of pockets for every appointment time and a column for each chair. Hours that are gone already hold a typed card on coloured stock with the customer's name, the job and a red serial number. The visitor's own card is the white one with the red band. Pick a free pocket and that card is pulled up clear of the lip it was sitting behind, carried across the front of the rack in a small arc, and dropped into the new pocket on a spring, which makes the cards above and below it rattle. Under the paint it is an ordinary radio group, so the choice arrives in a form like any other field. The whole rack is turned a few degrees in real perspective, with each row of pockets standing slightly further out than the one above, so the cards and lips shift against each other as the pointer moves. It keeps both columns at 360 pixels wide by tightening the hour plates and the lettering.",
  useWhen: [
    "A barber, salon, tattoo studio or clinic offers a fixed list of times across two or three members of staff for one day.",
    "A booking form needs to show which hours are gone without printing a table of grey disabled buttons.",
    "A repair shop or garage wants customers to choose a drop-off bay and hour in a single step.",
    "A landing page for booking software wants one tactile demonstration of choosing a slot.",
  ],
  customize: [
    "`HOURS` is the list of rows and `CHAIRS` the list of columns. For three chairs, change both `grid-cols-[46px_1fr_1fr]` classes and their `sm:` versions to carry a third `1fr`.",
    "`TAKEN` holds the cards already in the rack, keyed by row and column such as `\"3-1\"`. Each has a name, a job, a serial number and `stock`, the colour of the card.",
    "`MINE` is what is typed on the visitor's card, and `#d5432b` is its red band. `START` is the pocket it sits in when the page loads.",
    "The enamel is `bg-[#23473d]` on the rack and the five greens in the gradient on each pocket lip. For black japanned steel use `#1b1b1d` and step the lip gradient from `#77777c` down to `#151517`.",
    "`UP` is how far the card is lifted before it travels, and the spring in the last `animate` call (`stiffness: 520, damping: 19`) sets how hard it lands. `LEAN` is the angle the rack is turned; 0 hangs it square to the wall.",
  ],
  accessibility: [
    "Every pocket is a real radio input inside one `radiogroup`, named with its time and chair. Taken pockets are disabled inputs whose name ends in the word taken.",
    "Arrow keys move the choice between free pockets and skip the taken ones, as native radios do, and the card follows each move.",
    "The focused pocket gets a white ring, and the sentence under the rack is a polite live region that repeats the day, the time and the chair.",
    "With reduced motion the card appears in the new pocket at once and the neighbouring cards stay still.",
  ],
  faqs: [
    {
      question: "How does the card pass in front of some pockets and behind others?",
      answer: "Every part has a real depth. In each row the card sits two pixels behind its own lip, and each row stands three pixels further forward than the row above it, so a card hides behind its own lip and overlaps the pocket above, as in a real rack. While it travels, the card is swapped for a copy held out in front of every lip, then swapped back just before it drops.",
    },
    {
      question: "How do I submit the chosen slot?",
      answer: "Give the radio inputs a `value`, for example the time and the chair, and place the component inside your form. The `slot` state also holds the row and column if you prefer to read it in a handler.",
    },
    {
      question: "Can the taken slots come from my booking system?",
      answer: "Yes. Build the `TAKEN` object from your own data before rendering. If you would rather not show customer names, put a single word such as Booked in `name` and leave `job` empty.",
    },
    {
      question: "What happens when someone clicks a pocket that already has a card?",
      answer: "Nothing moves. The input is disabled, the pointer changes to the not-allowed cursor and the white card stays where it is.",
    },
    {
      question: "Is the paint texture an image file?",
      answer: "No. The hammered enamel, the paper fibres and the plaster wall are three small SVG noise filters written inline as data addresses and laid over flat colours with blend modes.",
    },
  ],
  related: ["manila-file-folder-tabs-in-a-steel-desk-rack-that-tip-forward-like-records-in-a-crate-to-show-the-chosen-file", "wooden-block-perpetual-calendar-date-picker-with-number-cubes-you-lift-turn-and-drop-into-a-walnut-cradle"],
  tags: ["time slot picker", "appointment", "booking form", "radio group", "barbershop", "skeuomorphic", "card rack"],
  height: 820,
  interactive: true,
};

export default meta;
