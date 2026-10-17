export default {
  slug: "payment-received-checkmark-that-draws-inside-a-circle",
  category: "motion-graphics",
  name: "Payment Received Checkmark in a Circle",
  keyword: "checkmark animation",
  tags: ["checkmark animation", "success animation", "payment confirmation", "svg stroke", "receipt"],
  height: 620,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The circle, the check and the receipt details are all shown complete from the first frame.",
  perf: "Four SVG shapes and four lines of text animate once for about a second and a half, then nothing runs at all.",
  intro: "A payment confirmation card for a joinery workshop: a thin ring draws itself clockwise from the top, a tinted disc settles inside it, the check strokes in from its short arm, and the heading, receipt rows and button rise after it. The whole entrance is over in under a second and a half and ends on a plain, calm receipt.",
  customize: [
    "Recolour ring, disc and check together through `--m3pay-accent`.",
    "Set `--m3pay-time` to 1.3 for a slower draw or 0.7 for a brisker one; every delay scales with it.",
    "Swap the `<dl>` rows for your own order details; the rise stagger follows the order of the blocks.",
  ],
  accessibility: [
    "The heading is the message, so the drawing is hidden from screen readers; when you show this card after a payment, the heading's role status makes assistive tech read it once.",
  ],
  useWhen: [
    "A checkout, invoice or booking flow lands on a confirmation screen that should feel finished.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
