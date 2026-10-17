const meta = {
  slug: "matchbook-faq-row-where-each-printed-cover-flips-up-off-its-comb-of-matches-to-show-the-answer-inside",
  category: "faq",
  name: "Matchbook FAQ Row Where Each Printed Cover Flips up off Its Comb of Matches to Show the Answer Inside",
  keyword: "flip card faq react",
  title: "React Flip Card FAQ Made of Matchbooks | We.Inc",
  description: "FAQ drawn as a row of bar matchbooks: press one and its printed cover swings up in 3D to show the answer inside. Free React and Tailwind code, or HTML.",
  intro: "Six matchbooks lie in a row on a dark bar top, each in its own colour with its own printed pattern: a sunburst, rings, a check, bars, a moon and slanted stripes. A question is printed on every cover in heavy capitals, above a folded front flap with a wire staple and a gritty brown striking strip. Two of the books are already open. An open cover lies back on the bar above its book, showing the answer on plain card, and where it used to be you see two combs of cardboard matches with rounded coloured heads. Press a closed book and its cover lifts toward you, passes edge on and falls back with a springy bounce. Press an open one, or its cover, and it shuts. Any number can be open together because each cover has its own space to land in. Below 1280 pixels the row wraps to three books across, and on a phone to two.",
  useWhen: [
    "A bar, restaurant, hotel or venue wants its questions answered in the same voice as its menus and coasters.",
    "Visitors are likely to open several answers and compare them, so closing one when another opens would get in the way.",
    "There are four to eight short questions and a strong colour palette you want on show.",
    "A landing page needs one playful block that still works by keyboard and reads properly aloud.",
  ],
  customize: [
    "`books` holds each question: `q`, `a`, the `cover` colour, the `ink` printed on it, the `head` colour of the matches and a `motif` of `sun`, `arcs`, `check`, `bars`, `moon` or `slant`.",
    "The row is `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`. For eight books use `xl:grid-cols-8` and lower `max-w-[184px]` on the book to about 150.",
    "`REST` is the angle an open cover settles at. `180` lays it dead flat; lower numbers leave it propped up and show more shade on the answer.",
    "Type scales from the `text-[15px] sm:text-[17px]` on each book, because every size inside is given in `em`. Raise both to enlarge the question and the answer together.",
    "`STICKS` is the number of matches in each comb, and the bar top is `bg-[#15110f]` plus the radial gradient on the section.",
  ],
  accessibility: [
    "Every book has a real button inside a heading. The button covers the book, is named with the question and reports `aria-expanded`, so the printed cover itself can be hidden from assistive technology.",
    "The inside of the cover is a labelled region holding the answer as text. It is set to `visibility: hidden` until the cover is past upright, which keeps closed answers out of the reading order.",
    "Clicking an open cover closes it, but that is a shortcut for the pointer. The button on the book does the same job from the keyboard.",
    "With reduced motion covers switch between shut and open with no swing, and the row stops opening books by itself.",
  ],
  faqs: [
    {
      question: "How does one element show the question on one side and the answer on the other?",
      answer: "The cover holds two layers of the same size with `backface-visibility: hidden`. The answer layer starts turned over with `rotateX(180deg)`. When the cover itself rotates about its top edge, the front disappears as it passes upright and the answer comes into view the right way up.",
    },
    {
      question: "Why does the cover bounce when it lands?",
      answer: "Opening uses a spring with low damping (`stiffness: 150`, `damping: 12.5`), so the angle runs a little past `REST` and comes back. The angle is clamped at 178 degrees before it is drawn, which stops the card passing through the bar. Closing uses a stiffer, well damped spring so it shuts cleanly.",
    },
    {
      question: "Are the matches and the striking strip pictures?",
      answer: "No. Each match is a strip with a five stop gradient across it and a rounded head made from two radial gradients, one for the colour and one for the highlight. The grit on the striking strip and the tooth of the card are small SVG noise filters passed to CSS as data addresses.",
    },
    {
      question: "Why is there empty space above the row?",
      answer: "That is where covers land. Each book reserves a square of bar top above itself the same size as its cover, so an open cover never lies on top of another book. It also means opening a book does not move anything else on the page.",
    },
    {
      question: "How long can a question and an answer be?",
      answer: "Keep questions under about twenty five characters so they set in three lines of capitals above the pattern. Answers have room for roughly one hundred and thirty characters on a phone, where the books are narrowest.",
    },
  ],
  related: ["matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches", "oak-card-index-box-faq-with-tabbed-question-cards-that-rise-out-and-stand-against-the-open-lid", "mechanical-key-switch-cutaway-input-with-a-stem-coil-spring-and-copper-leaf-that-move-as-you-type"],
  tags: ["faq", "flip", "3d", "matchbook", "cards", "retro"],
  height: 640,
  section: true,
  interactive: true,
};

export default meta;
