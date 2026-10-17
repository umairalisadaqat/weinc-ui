export default {
  slug: "order-tracking-icons-packed-on-the-way-and-delivered",
  category: "motion-graphics",
  name: "Order Tracking Icons: Packed, On the Way, Delivered",
  keyword: "animated delivery icons",
  tags: ["order tracking", "delivery status", "animated icons", "stepper", "svg"],
  height: 400,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "All three steps appear complete with full connector lines and the drawn check on the house.",
  perf: "Three icons and two connector fills animate once in sequence over about two seconds, then the card is static.",
  intro: "A delivery tracker for a tea shop order that tells its story once when it comes into view: the box lid settles shut, a green line fills toward the van, the van pulls in from the left, the next line fills, and a check draws inside the house. Each step keeps its name and time as text under the icon.",
  customize: [
    "Change the `--d` delay on each step and line in the markup to retime the sequence.",
    "Recolour finished steps and connectors with `--m3trk-accent`.",
    "For an order still in transit, drop the last step's tick and set its tile background to the neutral line colour.",
  ],
  accessibility: [
    "The heading states the current status in words inside a status region, the steps are an ordered list with times as text, and the decorative connectors are hidden from screen readers.",
  ],
  useWhen: [
    "An order page, booking confirmation or support ticket should show where something is in a short, fixed sequence.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
