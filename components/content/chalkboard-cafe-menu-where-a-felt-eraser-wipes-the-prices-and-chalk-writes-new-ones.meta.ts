const meta = {
  slug: "chalkboard-cafe-menu-where-a-felt-eraser-wipes-the-prices-and-chalk-writes-new-ones",
  category: "content",
  name: "Chalkboard Cafe Menu Where a Felt Eraser Wipes the Prices and Chalk Writes New Ones",
  keyword: "chalkboard menu react component",
  title: "React Chalkboard Menu That Rewrites Its Prices | We.Inc",
  description: "Chalkboard menu in an oak frame: switch the sitting and an eraser scrubs the prices before chalk writes new ones. Free React code and an HTML version.",
  intro: "A framed slate menu board for a café or bakery, with five items, a heading in chalk lettering and a small photograph of the day's pastry taped to one corner. Below it sits a two-way switch between morning prices and the marked-down prices after three. Changing it does not swap the numbers. A felt eraser leaves the ledge, scrubs down the price column in short strokes and across the line at the foot of the board, and leaves a pale smear where the chalk used to be. Then a stick of chalk writes each new price from left to right, shedding a little dust that falls to the ledge. Morning prices are written with the white stick and afternoon prices with the yellow one, and whichever stick is not in use stays on the ledge. The board keeps its proportions at every width and fits a 360 pixel phone.",
  useWhen: [
    "A café, bakery or bar site has a short menu with prices that differ by time of day, such as happy hour or end-of-day markdowns.",
    "A restaurant home page wants today's specials to look like the board by the door and not like a table.",
    "A market stall or food truck page lists five or six things and has no need for categories or filters.",
    "A seasonal or weekly offer changes often and you want the change itself to be the thing visitors notice.",
  ],
  customize: [
    "`menu` holds the items. Each has a `name`, a short `note` in capitals and a `prices` array with one entry per sitting.",
    "`sittings` defines the switch. Each has a `label`, the `footer` sentence written at the bottom of the board and a `chalk` colour for its prices.",
    "`HEADING` and `STRAPLINE` are the two lines at the top. Keep the heading under eight letters so it clears the photograph.",
    "`PHOTO` and `PHOTO_ALT` set the taped print. Any square image works, and the cream colour behind it shows until it has loaded.",
    "`ROW` is the distance between items in pixels. With six items set it to 50 and move `FOOT` down to 546.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. A visually hidden list repeats every item with its current price and is announced when the sitting changes.",
    "The switch is a `radiogroup` of two `radio` buttons. Only the checked one is in the tab order and the arrow keys move between them.",
    "The photograph is a real `img` with alt text that describes what is on the plate.",
    "With reduced motion there is no eraser or chalk travel: choosing a sitting shows its prices at once, and the board never changes by itself.",
  ],
  faqs: [
    {
      question: "How is the chalk texture made?",
      answer: "Text is drawn in a pale colour and then a tile of several thousand random specks and short scratches is cut out of it, so the slate shows through. The same cut is applied to the heading, the item names and every price, which is why they look like they came from one stick.",
    },
    {
      question: "Does the eraser really remove the old price?",
      answer: "Yes. Each price lives on its own small canvas. While the eraser is over one, a rectangle the size of the felt is cut out of that canvas every frame, so a half-wiped price is visible if you stop it there. A faint blurred patch is added to a separate dust layer along the same path.",
    },
    {
      question: "What happens if I switch while it is still writing?",
      answer: "The board finishes the price it is on and the rest of that pass, then compares what is written with what is selected. If they differ it wipes again. The switch itself updates immediately, so it never feels stuck.",
    },
    {
      question: "Which font draws the lettering?",
      answer: "The heading and prices ask for Chalkduster, then Bradley Hand, Segoe Print and Comic Sans MS, ending at the generic cursive face. Item names are set in Georgia so they stay easy to read on every system. No font file is downloaded.",
    },
    {
      question: "Can I add a third sitting, such as evening?",
      answer: "Add a third entry to `sittings` and a third value to each `prices` array. The switch grows to three buttons on its own. Only the two chalk sticks on the ledge are tied to the first two entries, so a third sitting reuses whichever stick was last in the hand.",
    },
  ],
  related: ["spice-jar-rack-filter-with-glass-jars-that-turn-behind-a-brass-rail-to-show-their-labels", "paper-coffee-cup-name-field-where-a-marker-writes-what-you-type-round-the-cup"],
  tags: ["menu", "chalkboard", "cafe", "prices", "canvas", "restaurant", "skeuomorphic"],
  height: 820,
  section: true,
  interactive: true,
};

export default meta;
