const meta = {
  slug: "savings-chart-of-minted-coin-stacks-where-each-deposit-drops-a-coin-that-wobbles-and-settles",
  category: "dashboard",
  name: "Savings Chart of Minted Coin Stacks Where Each Deposit Drops a Coin That Wobbles and Settles",
  keyword: "react savings chart coin stack",
  title: "React Savings Chart Made of Coin Stacks | We.Inc",
  description: "Savings chart on a canvas: stacks of gold coins, one per month, where each deposit drops a coin that wobbles and settles. Free React and HTML code.",
  intro: "A bar chart where every bar is a pile of money. Five stacks of gold coins stand on a cream table, one for each month, and the height of a stack is the number of deposits made in it. The coins are struck once per size on a hidden canvas: a reeded edge whose grooves bunch up towards the sides the way they do on a real cylinder, a raised rim, a ring of beads and a numeral pressed into the face. Tapping a month drops a new coin from above. It lands, bounces once, rocks from side to side and nudges the coins under it, while the total above the table counts up to the new figure. Take one back flicks the last coin off its stack. On a phone the table is 330 pixels tall and the coins shrink to fit five across with no sideways scroll.",
  useWhen: [
    "A savings, budgeting or allowance app wants its monthly deposits to look like something a person would want more of.",
    "A children's pocket money or chore tracker needs a chart a seven year old can read without a legend.",
    "A fundraising or tip jar page shows how the pot grew over the last few months and lets visitors add to it.",
    "A loyalty or rewards screen counts earned coins and a plain number feels flat.",
  ],
  customize: [
    "`months` is the data: one entry per stack with a `label` and a starting `coins` count. Six or seven entries fit on a desktop, five is the comfortable limit on a phone.",
    "`COIN` is the value of one coin and is also the numeral struck on its face. `UNIT` is the currency word under the numeral and beside the total.",
    "The metal is the `STOPS` list, five colours from deepest shadow to brightest glint. Swap in greys such as `[40,44,50]` up to `[250,252,255]` for silver.",
    "`MAX` caps a stack at 20 coins so the tallest one stays inside the canvas. Raise it only if you also raise the `520` height in `layout`.",
    "Weight is the `3400` gravity figure and the `0.26` bounce in the frame loop. A bounce of `0.4` makes the coins feel lighter and noisier.",
  ],
  accessibility: [
    "Each month is a real button laid over its stack. Its label reads out the month, the amount, the number of coins and what pressing it does.",
    "The total is a polite live region, so a deposit is announced as the new figure once the count settles.",
    "With reduced motion a new coin is placed on the stack at once, the total changes without counting and the self-running demo does not start.",
    "The canvas is hidden from assistive technology because every figure it shows is also in the button labels.",
  ],
  faqs: [
    {
      question: "Why do the coins look struck and not drawn?",
      answer: "Three things do most of the work. The face uses a conic gradient, which gives the cartwheel shine a minted coin has. The numeral is painted three times, dark below, bright above and metal in the middle, so it reads as raised. The edge grooves are spaced by the sine of their angle, which packs them tighter at the sides exactly as perspective would.",
    },
    {
      question: "How many coins can it draw before it slows down?",
      answer: "Each size of coin is painted once into six small offscreen images, one per wear and rotation variant. A frame then only copies those images, so eighty coins cost about the same as eight. The loop stops when the chart is off screen or the tab is hidden.",
    },
    {
      question: "How do I feed it real deposits?",
      answer: "The component exposes two calls on its `api` ref, `add(index, true)` and `take(index, true)`. Call `add` when a deposit arrives from your server and the coin falls on that month. For first paint, fill `months` from your data before rendering.",
    },
    {
      question: "Can one coin stand for a different amount in each stack?",
      answer: "Not as written, since the numeral on the face is shared. The simplest route is to pick a `COIN` value that divides your typical deposit and round, then show the exact amount in the month label, which is ordinary text.",
    },
    {
      question: "What happens when a stack is full?",
      answer: "The button for that month sets `aria-disabled` and further taps are ignored. The demo that runs when nobody is touching the chart turns around seven coins above the starting count and spends back down, so it never reaches the cap.",
    },
  ],
  related: ["speedometer-and-rev-counter-pair-in-a-stitched-leather-binnacle-with-a-start-up-needle-sweep-and-a-working-throttle", "strip-chart-recorder-line-chart-with-a-sprung-ink-pen-on-moving-grid-paper-and-two-data-sets", "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target"],
  tags: ["coins", "savings", "chart", "canvas", "physics", "gold", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
