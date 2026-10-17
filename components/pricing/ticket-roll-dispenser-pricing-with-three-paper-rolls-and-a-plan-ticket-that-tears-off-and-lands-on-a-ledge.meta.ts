const meta = {
  slug: "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge",
  category: "pricing",
  name: "Ticket Roll Dispenser Pricing with Three Paper Rolls and a Plan Ticket That Tears Off and Lands on a Ledge",
  keyword: "pricing plan selector react",
  title: "React Pricing Plan Selector: Ticket Dispenser | We.Inc",
  description: "Plan picker drawn as a ticket dispenser: one paper roll per tier, and the ticket you choose tears off and lands on a ledge. Free React and HTML code.",
  intro: "Three subscription tiers shown as three rolls of printed tickets hanging from a red enamel dispenser on a cream wall. Each ticket carries the plan name, the monthly price, three lines of what is included and a red serial number. Press a ticket and it is pulled taut, rips away from the toothed chrome bar starting at one corner, flutters down and comes to rest leaning on an oak ledge. The roll then ratchets the next ticket out with the following serial number, and the ticket that was on the ledge before tips off and is gone. Hanging tickets sway a little, and more when the pointer crosses them. Everything is painted on one canvas. Below 700 pixels the dispenser is redrawn at three quarters size so all three rolls still fit side by side.",
  useWhen: [
    "A product with three tiers wants the choice to feel like taking something, not ticking a box.",
    "A newsletter, cinema club, class pass or event membership already speaks the language of tickets.",
    "A pricing page needs one playful selector above a plain comparison table that carries the detail.",
    "A checkout step should confirm the picked plan with an object the visitor can see sitting there.",
  ],
  customize: [
    "`plans` holds each roll: `name`, `price`, the `paper` colour, the first `serial` and three `lines`. Keep the lines under sixteen characters so they fit the ticket.",
    "`ENAMEL` is the dispenser colour from top to bottom. Three blues such as `#4f98fb`, `#2f6fd0`, `#1c4a96` repaint it without touching the gloss.",
    "`INK` and `RED` are the two print colours. The serial is drawn last in `RED`, slightly off the grid on purpose.",
    "`FIRST` is the ticket torn when the page opens. The demo then walks through the rolls every 4.2 seconds until someone presses one.",
    "Ticket size is `TW` and `TH` (136 by 204 at full size). The ledge height in `layoutFor` must stay at least two ticket heights below the box.",
  ],
  accessibility: [
    "Each roll is a `role=\"radio\"` button inside a `radiogroup`, with a label that reads the plan, the price and its three lines, because the printed ticket is canvas pixels.",
    "Arrow keys move between rolls and tear the next ticket. Only the chosen roll is in the tab order.",
    "The sentence under the wall repeats the chosen plan as real text in a polite live region.",
    "With reduced motion there is no tearing or falling: the chosen ticket is simply shown on the ledge and the next one is already hanging.",
  ],
  faqs: [
    {
      question: "How is the torn edge made?",
      answer: "Every ticket is drawn once onto its own small canvas with a row of half-round bites along the top and bottom, the way a perforated roll parts. That image is then moved, rotated and shadowed as a whole, so the print never has to be laid out again while it falls.",
    },
    {
      question: "Why does the ticket twist as it comes off?",
      answer: "For the first quarter second it turns about its top right corner, as if the perforation were opening from the left. When it lets go it keeps that spin, and a soft spring pulls it towards the angle it will lean at on the ledge, which reads as paper catching air.",
    },
    {
      question: "Can I have four plans?",
      answer: "Add a fourth entry to `plans` and a fourth x position to `slots` in both layouts. At full size four tickets need the box about 180 pixels wider. On phones four will not fit at a readable size, so stack two rows or drop to three.",
    },
    {
      question: "How do I send the chosen plan to my checkout?",
      answer: "The `plan` state is the index of the selected entry. Read `plans[plan]` in a parent, or call your own handler in the place where `setPlan(i)` runs inside `tear`.",
    },
    {
      question: "Do the serial numbers mean anything?",
      answer: "They are decoration. Each roll counts up by one per ticket so a visitor who tears several sees that every ticket is a new one. Replace them with an order reference if you have one.",
    },
  ],
  related: ["brass-balance-scale-price-builder-with-feature-weights-and-coins-that-drop-until-the-beam-levels", "price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys", "tri-fold-screen-that-opens-leaf-by-leaf-from-phone-to-tablet-to-desktop-as-one-page-reflows"],
  tags: ["pricing", "tickets", "plan picker", "paper", "canvas", "radio", "skeuomorphic"],
  height: 860,
  interactive: true,
};

export default meta;
