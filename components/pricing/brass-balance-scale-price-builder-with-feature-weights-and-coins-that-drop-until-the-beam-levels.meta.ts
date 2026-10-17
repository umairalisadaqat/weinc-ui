const meta = {
  slug: "brass-balance-scale-price-builder-with-feature-weights-and-coins-that-drop-until-the-beam-levels",
  category: "pricing",
  name: "Brass Balance Scale Price Builder with Feature Weights and Coins That Drop Until the Beam Levels",
  keyword: "pricing calculator react",
  title: "React Pricing Calculator as a Balance Scale | We.Inc",
  description: "Pricing calculator drawn as a brass balance: add feature weights to one pan and coins drop into the other until it levels. Free React and HTML to copy.",
  intro: "An add-on price builder drawn on a canvas as a jeweller's balance on a walnut plinth. The plan sits in the left pan as a brass weight stamped with its price. Four optional extras wait on the plinth as smaller weights. Press one and it lifts off the wood, arcs into the pan and tips the beam, then silver coins fall into the right pan, one for every four dollars, until the pointer swings back to the red line on the ivory scale. The brass plate on the plinth counts only the coins that have landed, so the price climbs with the sound you imagine. Pans hang on chains and sway when a weight lands or when the pointer brushes them. On phones the scale is redrawn narrower with the four labels in a row under the plinth.",
  useWhen: [
    "A product has one base plan and a handful of paid add-ons, and the page should make the cost of each one felt.",
    "A booking, salon or studio tool wants its pricing to look like a shop counter instead of a spreadsheet.",
    "A quote page needs a small configurator above the real order form to make visitors play before they commit.",
    "A landing page for a jeweller, tea merchant or assay service needs an object that already belongs to the trade.",
  ],
  customize: [
    "`weights` holds the plan and its extras with a `label` and a `price`. Keep five entries or add matching positions to `SEAT` and to `rest` in `layoutFor`.",
    "`COIN` is what one coin is worth. With `COIN = 4` a twelve dollar weight calls for three coins, so every price must divide by it.",
    "`START` sets which weights are already in the pan on load, and `TOUR` is the order the self-running demo flips them.",
    "`BRASS` and `STEEL` are the eight greys of each metal from shadow to highlight. Swap `STEEL` for a copper ramp to pay in pennies.",
    "The swing is `30` (pull towards level) and `2.7` (drag) inside `step`. Raise the drag to 6 for a beam that settles without rocking.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Each extra is a real button with `role=\"switch\"` and `aria-checked`, placed over its weight and label.",
    "The line under the scale is a polite live region that reads the product, the total and the chosen extras as plain text.",
    "With reduced motion the weights, coins and beam jump to their final places and the demo never starts.",
    "Label text is slate on navy at more than 7:1. If you lighten the stage, darken `text-slate-300` and `text-slate-400` to match.",
  ],
  faqs: [
    {
      question: "Why does the price change a moment after the weight lands?",
      answer: "The plate on the plinth counts landed coins, not selected extras. A weight has to reach the pan before the coins start, and each coin adds its value when it touches down. The text line under the scale updates at once, so nothing is hidden while the coins fall.",
    },
    {
      question: "How does the beam know when it is level?",
      answer: "Each frame adds up the weights seated in the left pan and the coins resting in the right, and the difference sets the angle the beam is pulled towards. A spring with light damping does the rest, which is why it overshoots and rocks before it stops.",
    },
    {
      question: "Can I use it with real prices that are not multiples of four?",
      answer: "Set `COIN` to 1 and each dollar becomes a coin. Stacks grow three coins wide, so past about thirty coins the piles get tall. For larger prices keep a bigger coin value and show the exact figure in the text line.",
    },
    {
      question: "How do I read the total in my own form?",
      answer: "The `on` state is an array of booleans in the same order as `weights`. Lift it into a parent or compute the sum where `total` is computed and pass it to your checkout.",
    },
    {
      question: "Is it heavy to draw?",
      answer: "The plinth, column and ivory scale are painted once to an offscreen canvas. Each frame redraws two pans, at most five weights, nine coins and the beam. The loop stops when the scale is off screen or the tab is hidden.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys", "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge"],
  tags: ["pricing", "calculator", "balance scale", "brass", "canvas", "add-ons", "skeuomorphic"],
  height: 860,
  interactive: true,
};

export default meta;
