const meta = {
  slug: "gift-card-with-a-silver-scratch-off-panel-a-brass-coin-and-foil-crumbs-that-scatter-as-you-rub",
  category: "cards",
  name: "Gift Card with a Silver Scratch off Panel, a Brass Coin and Foil Crumbs That Scatter as You Rub",
  keyword: "scratch card react component",
  title: "React Scratch Card Component with a Coin | We.Inc",
  description: "Scratch card on a canvas: rub the silver panel of a gift card with a brass coin and the foil comes off in streaks and crumbs. Free React and HTML to copy.",
  intro: "A florist's gift card lying at a slight angle on a cream table. The top two thirds is a photograph of ranunculus under a gloss, with the shop name stamped across it in gold. Below is the amount, one line of small print and a silver panel printed with a wave pattern and tiny lettering. A brass coin with a milled rim does the scratching. The page opens with half the panel already rubbed away and the first half of the code showing, then the coin finishes the job by itself, pauses, and a fresh card is dealt in from the right. Hold the pointer or a finger down on the panel and you scratch it yourself: the foil comes away in ragged streaks, not a clean eraser line, and each rub throws curled grey crumbs that skid across the card and the table and stay where they stop. On a phone the card, coin and crumbs shrink together.",
  useWhen: [
    "A shop sends gift cards or discount codes by email and wants the landing page to feel like opening the real thing.",
    "A launch, prize draw or loyalty scheme needs a reveal the visitor performs with their own hand.",
    "An onboarding step hands over a referral code and you want it remembered.",
    "A seasonal campaign wants one playful object on the page instead of a banner with a code typed in it.",
  ],
  customize: [
    "Words, photograph and codes are in the `gift` object. `codes` is the list handed out one per card, `tone` is the colour shown while the photograph loads and `coin` is the two letters struck on the coin.",
    "`PANEL` places and sizes the foil against the top left of the card. The printed lettering on the foil is the `S C R A T C H` string and the four silver stops are in the same block.",
    "The gold of the shop name is the `.gift-card-scratch-gold` gradient in the style element, and the coin uses three brass gradients on its nested circles.",
    "`START_FILLED` is how much is already scratched on load, from 0 to 1. The coin starts rubbing after `startAfter` seconds and covers 250 pixels a second.",
    "A card counts as revealed when 62 percent of the panel is clear. Search for `0.62` to make that stricter or looser.",
  ],
  accessibility: [
    "The panel is a real button. Three presses of Enter or Space rub it clear in thirds, so the code can be reached with no pointer at all.",
    "The code is hidden from assistive technology until it is revealed, then a polite live region announces it once and the button label repeats it.",
    "With reduced motion the card arrives already scratched with its crumbs lying still. The coin never moves by itself and dealing a new card swaps it with no slide.",
    "The panel sets `touch-action: none` so a finger scratches instead of scrolling. Keep the panel small enough that the page can still be scrolled around it.",
  ],
  faqs: [
    {
      question: "How is the scratched area stored?",
      answer: "In a second, hidden canvas the same size as the foil. Every rub draws onto that canvas, and each time the foil is repainted the hidden canvas is stamped over it with the `destination-out` blend, which removes foil wherever the hidden canvas has ink. Because the foil is repainted from scratch, its moving sheen never brings back what was rubbed off.",
    },
    {
      question: "Why does it not look like an eraser tool?",
      answer: "One rub is not one line. It is three thick strokes with slightly different offsets, seven thin partial streaks to either side and five loose specks, all placed with a seeded random number. The overlap gives a ragged edge and leaves slivers of foil behind, the way a coin does.",
    },
    {
      question: "How does it know the code has been revealed?",
      answer: "The hidden canvas is copied down to a 29 by 7 pixel thumbnail and the average opacity of those 203 pixels is read. That costs almost nothing, so it can run every few rubs while a finger is down.",
    },
    {
      question: "Do the crumbs slow the page down?",
      answer: "They are short arcs on one canvas, capped at 260. Each has a speed that decays quickly, and once it is nearly still it is marked as resting. The canvas is only redrawn on frames where at least one crumb is still moving.",
    },
    {
      question: "Is the code secret before it is scratched?",
      answer: "No. It is ordinary text sitting under a canvas, so anyone who opens the page source can read it. Treat the scratching as theatre. If the code has to stay private until a real action, fetch it from your server when the reveal fires and put it in the panel then.",
    },
  ],
  related: ["boarding-pass-call-to-action-that-tears-along-its-perforation-when-you-book-and-drops-the-stub", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["card", "scratch", "gift card", "canvas", "coin", "reveal", "coupon"],
  height: 660,
  section: true,
  interactive: true,
};

export default meta;
