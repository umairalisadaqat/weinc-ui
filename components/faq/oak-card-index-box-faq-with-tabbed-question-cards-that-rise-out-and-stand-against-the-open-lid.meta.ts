const meta = {
  slug: "oak-card-index-box-faq-with-tabbed-question-cards-that-rise-out-and-stand-against-the-open-lid",
  category: "faq",
  name: "Oak Card Index Box FAQ with Tabbed Question Cards That Rise out and Stand Against the Open Lid",
  keyword: "card index faq accordion react",
  title: "React FAQ Accordion as a Card Index Box | We.Inc",
  description: "FAQ built as a card index box: press a tab and its ruled card rises out of the row and stands against the open lid. Free React and Tailwind code, or HTML.",
  intro: "An oak card index box seen from the front with its lid standing open behind it. Six cream cards sit in the box in a staircase, each with a tab cut at a different place along its top edge and a one word subject typed on it. The card for the first question is already out: it stands against the inside of the lid, ruled in red and blue like a real index card, with the question typed above the red line and the answer on the lines below. Press another tab and that card climbs straight up past the ones behind it, clears their tabs, then drops in behind the row and lands with one small hop while the old card goes back to its place. The front of the box has finger joints at both ends and a brass label holder with a pull. On a phone the box, the cards and the type are redrawn at a narrower set of measurements instead of being shrunk, so the answers stay readable.",
  useWhen: [
    "A library, archive, repair shop or members' club wants its common questions to look like part of the front desk.",
    "There are five to seven questions and each has a one word subject that can go on a tab.",
    "Answers are short, around thirty words, and you want exactly one of them on show at a time.",
    "A plain list of collapsing rows would be the only ordinary thing on an otherwise crafted page.",
  ],
  customize: [
    "`cards` holds every question: `tab` is the word on the tab, `q` the full question and `a` the answer. Six fit; for more, lower `tabW` in both `WIDE` and `SLIM` so the tabs still spread across the card.",
    "`WIDE` and `SLIM` are the two sets of measurements. `cardH` and `line` decide how many ruled lines an answer gets, and `text` is the size of the typed answer.",
    "`library` sets the name in the caption and the two lines on the brass holder (`drawer` and `note`).",
    "The oak comes from the base colours `#c2924f` and `#b98749` plus the `grain` helper. Swap the three numbers at the start of its `feColorMatrix` and the base colours for walnut or painted wood.",
    "`CLEAR` is how far a card overshoots before it drops behind the row, and `landing` is the easing of that drop. Change the `0.09` in it to `0` for a card that lands dead.",
  ],
  accessibility: [
    "Each tab is a real button inside a heading. Its accessible name is the whole question, not the one word on the tab, and it carries `aria-expanded` and `aria-controls`.",
    "The answer is real text in a labelled region on the card. Cards that are down in the box have that region set to `visibility: hidden`, so a screen reader only finds the answer that is showing.",
    "Tab order follows the cards from front to back, and the focus ring is drawn round the tab itself.",
    "With reduced motion a pressed card is simply shown standing, with no climb or drop, and the box stops leafing through its cards on its own.",
  ],
  faqs: [
    {
      question: "Why does the card go up and over instead of just sliding up?",
      answer: "A card that only slid up would cover the tabs of every card behind it, and you could no longer press them. So the card rises in front, overshoots by `CLEAR` pixels until its bottom edge is above the tallest tab, switches to a lower `zIndex` at that instant and drops in behind the row. Nothing visibly jumps because the swap happens while the card overlaps nothing.",
    },
    {
      question: "Is the wood an image?",
      answer: "No. The `grain` helper writes a small SVG with `feTurbulence` stretched far more in one direction than the other, turns it into dark streaks with a colour matrix and hands it to CSS as a data address. It is laid over a flat oak colour and a few gradients for light. Nothing is downloaded.",
    },
    {
      question: "Can two cards be out at once?",
      answer: "Not as written, because only one card fits against the lid. `open` holds a single index, and pressing the tab of the standing card puts it back and leaves the lid empty. That is the behaviour to keep for this object.",
    },
    {
      question: "How long can an answer be?",
      answer: "About one hundred and seventy characters. The bottom sixty pixels of the standing card are hidden behind the row, so on the wide layout you have six ruled lines and on a phone about seven shorter ones. Raise `cardH` and `lidH` together if you need more.",
    },
    {
      question: "How do I stop it changing cards by itself?",
      answer: "Delete the effect that calls `setInterval`. It already stops for good after the first press, and it waits while the pointer or keyboard focus is inside the piece.",
    },
  ],
  related: ["rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce", "matchbook-faq-row-where-each-printed-cover-flips-up-off-its-comb-of-matches-to-show-the-answer-inside", "oil-and-water-liquid-timer-with-beads-that-rise-through-a-glass-hourglass-and-flip-to-restart"],
  tags: ["faq", "accordion", "card index", "wood", "tabs", "skeuomorphic"],
  height: 764,
  section: true,
  interactive: true,
};

export default meta;
