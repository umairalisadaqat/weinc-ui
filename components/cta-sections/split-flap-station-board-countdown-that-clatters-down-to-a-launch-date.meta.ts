const meta = {
  slug: "split-flap-station-board-countdown-that-clatters-down-to-a-launch-date",
  category: "cta-sections",
  name: "Split-Flap Station Board Countdown That Clatters Down to a Launch Date",
  keyword: "split flap countdown react",
  title: "React Split Flap Countdown to a Launch Date | We.Inc",
  description: "Countdown built as a departure board: split flaps behind glass clatter through their drums to show days, hours and seconds. Free React and HTML code.",
  intro: "A railway departure board hung from two steel rods, used as a countdown. Three rows of flap cards sit in a black window behind a pane of glass: a line of twelve letters for a message, eight tall number cards for days, hours, minutes and seconds, and a small line that spells out the date and time of departure. Nothing fades or slides. A card can only change by dropping to the next one on its drum, so a new message arrives as a ripple of wrong letters that settles from left to right, and when a minute rolls over the tens of seconds rattle through five cards to get from 0 to 5. Move a pointer across the letters and the cards under it flutter. Press the board and a wave spreads from that spot. The same countdown is written as plain text under the board, followed by one button. The drawing keeps its proportions and scales to the column, so on a phone it is the same board at about 330 pixels wide.",
  useWhen: [
    "A product, ticket sale or pre-order opens at a known date and the page needs one object that makes the wait feel like an event.",
    "A conference or tour site wants its date shown the way a station shows a train.",
    "A coming soon page has little to say yet and needs something a visitor will watch for more than a second.",
    "A travel, rail or hotel brand wants a countdown that belongs to its own world instead of four rounded boxes.",
  ],
  customize: [
    "Set `TARGET` to a local date and time such as `2027-03-01T09:00:00`. While it is empty the board counts to `DEMO_DAYS` after the first view, which is only useful for a preview.",
    "`messages` holds the lines the top row turns through, twelve characters each at most. `EVENT` is the name used in the sentence under the board.",
    "`L_DRUM` is the order of cards on a letter drum. Add a character there, for example a full stop or an ampersand, before you use it in a message.",
    "Card colours are the gradient stops and the `#f4f0e4` ink in `paintFlap`. A yellow ink of `#ffd23f` gives the look of an airport board.",
    "Speed is in `step`: `52` is the milliseconds a card takes while a drum is spinning and `150` is the unhurried single drop used by the seconds.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The time left and the departure date are real text in a `role=\"timer\"` paragraph, which screen readers can read on demand without being interrupted every second.",
    "The board is a `button` named Shuffle the departure board, so the press effect is reachable with Enter or Space and shows a focus ring.",
    "With reduced motion no card ever falls: every position jumps straight to its character and the numbers are redrawn once a second.",
    "Keep the text line if you restyle the section. Without it the countdown exists only as pixels.",
  ],
  faqs: [
    {
      question: "How is this different from a flip clock?",
      answer: "A flip clock digit has ten cards and shows the next number. A split-flap position carries a whole alphabet on one drum and has to pass every card between the old character and the new one. That is why this board can spell words, and why a change looks like a short burst of scrambled letters before it settles.",
    },
    {
      question: "Why do the number drums run from 9 down to 0?",
      answer: "The cards only fall one way. With the numbers wound in descending order, taking one second off the clock is a single card. If they ran upwards, every tick would have to spin through nine cards to arrive at the number below.",
    },
    {
      question: "Does every changing letter really spin through the whole alphabet?",
      answer: "No. A full turn of a 38 card drum would take over two seconds. Each letter is given a short run of cards that ends on the right one, staggered by column, so a new line lands in well under a second while still looking mechanical.",
    },
    {
      question: "What happens when the countdown reaches zero?",
      answer: "All eight number cards stop on 0 and the text line reads Departed. The message row keeps turning through its lines. Add a check on `info.left === 0` in the component if you want to swap the button or show a different message at that point.",
    },
    {
      question: "Is it heavy to run?",
      answer: "Each character is painted once into a strip of card images when the board is sized. A frame then copies 36 small rectangles and at most a few half cards that are in mid fall. The loop pauses when the board is off screen or the tab is hidden.",
    },
  ],
  related: ["tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away", "velvet-tip-up-theatre-seat-picker-with-sprung-seats-that-fold-down-brass-number-plates-and-reserved-cards", "boarding-pass-call-to-action-that-tears-along-its-perforation-when-you-book-and-drops-the-stub"],
  tags: ["countdown", "split flap", "departure board", "launch", "canvas", "skeuomorphic", "timer"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
