const meta = {
  "slug": "noodle-order-flow-diagram-with-moving-connector-lines",
  "category": "motion-graphics",
  "name": "Order Flow Diagram With Moving Lines",
  "keyword": "animated flow chart",
  "title": "",
  "description": "",
  "intro": "A delivery explainer for a noodle restaurant's help page. Four step cards fade in from order to doorstep, and the connectors between them are dashed lines whose dashes keep sliding toward the arrow heads, so the direction of travel reads at a glance. On phones the steps stack and the connectors turn to point down.",
  "useWhen": [
    "Explaining a short process with hand-offs, such as how an order, a booking or a repair moves from one person to the next."
  ],
  "customize": [
    "Change the connector colour with `--m6flw-wire`.",
    "Slow the moving dashes by raising the 1.6s on the `.m6flw-dash` animation, or set it to none for still lines.",
    "Edit the steps and the time on each connector in the list markup; three to five steps fit the row."
  ],
  "accessibility": [
    "The steps are an ordered list with real headings, and each connector item is labelled with its typical time for screen readers.",
    "The dash loop stops for reduced motion and pauses whenever the diagram is off screen."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "flow diagram",
    "process chart",
    "dashed line animation",
    "delivery steps"
  ],
  "height": 560,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The four steps and the arrows between them are shown still, with every typical time in view.",
  "perf": "Three short dashed lines repaint as their pattern slides, which is light, and the loop pauses with animation-play-state when the diagram leaves the screen."
} satisfies UiMeta;

export default meta;
