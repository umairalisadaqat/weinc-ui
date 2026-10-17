const meta = {
  slug: "signature-pad-on-cotton-paper-with-a-fountain-pen-that-leaves-wet-ink-which-dries",
  category: "forms",
  name: "Signature Pad on Cotton Paper with a Fountain Pen That Leaves Wet Ink Which Dries",
  keyword: "react signature pad",
  title: "React Signature Pad with Ink That Dries | We.Inc",
  description: "Signature field on a canvas: a fountain pen follows your hand across cotton paper and the ink goes down wet, then dries flat. Free React and HTML to copy.",
  intro: "A signature field for the last page of a contract. The sheet is cream cotton paper with laid lines and loose fibres, printed with the closing clause, a rule to sign on and the date. A black resin fountain pen with a gold nib does the writing. Press on the paper and the nib goes to your pointer, its shadow closing up as it touches down. The line it leaves is broad on the downstroke and thin on the cross stroke, the way an italic nib writes. Fresh ink is almost black and carries a thin line of light along its top edge. Over about two and a half seconds that shine fades from the start of the stroke to the end, and the ink settles to a paler blue that lets the paper grain show through. People who cannot draw can type their name and watch the pen write it in script. On phones the sheet becomes squarer and the name field and buttons stack beneath it.",
  useWhen: [
    "The final step of a lease, a quote or a consent form needs a signature and you want signing to feel like an act, not a checkbox.",
    "A proposal or invoice page ends with an acceptance block and the client signs on a tablet or phone.",
    "A delivery or handover screen collects a name on glass from someone standing at a door.",
    "A product page for stationery or a legal service wants one object a visitor can pick up and use.",
  ],
  customize: [
    "`sheet` at the top holds the clause, the role label, the printed name and the date. Edit the strings and the paper is reprinted on the next load.",
    "`WET` and `DRY` are the two ink colours as red, green and blue. For black ink try `[6, 6, 8]` and `[52, 50, 56]`; for sepia `[40, 18, 6]` and `[112, 74, 44]`.",
    "`DRY_SECONDS` is how long a stroke keeps its shine. 5 gives a slow, wet look. 0.8 behaves like a rollerball.",
    "The nib width comes from `S * 4.3` in the `nib` function. Raise 4.3 to 6 for a broad stub, lower it to 2.5 for a fine point.",
    "The desk colour is the two hex values in the root `bg-[...]` classes. The pen finish is the `resin` and `gold` gradient lists in `drawPen`.",
  ],
  accessibility: [
    "A drawn signature cannot be the only route, so a labelled text field sits under the sheet. Whatever is typed there is written onto the paper in script and counts as the signature.",
    "The canvas has `role=\"img\"` with a label that points to the name field. Clear and Accept are ordinary buttons, and Accept stays disabled until there is ink on the page.",
    "The line under the buttons is a polite live region that says when ink has been laid and when the signature is saved.",
    "With reduced motion the idle demonstration is replaced by a finished signature, strokes appear already dry and the pen stays parked beside the date.",
  ],
  faqs: [
    {
      question: "How do I get the signature out as an image?",
      answer: "On submit the component crops the ink layer to the signing area and writes it into the hidden `signature` input as a PNG data address with a transparent background. Post the form as usual, or read `hidden.current.value` in `onSubmit` and send it wherever you store documents.",
    },
    {
      question: "How is the drying effect made?",
      answer: "Every point of a stroke remembers when it was laid. Each frame, segments younger than `DRY_SECONDS` are drawn in a colour mixed between the wet and dry values and given a thin highlight offset up and to the left. Once a segment is fully dry it is painted a single time onto a second canvas, which is blended over the paper with multiply so the fibres stay visible.",
    },
    {
      question: "Will a long signature slow the page down?",
      answer: "No. Only wet segments are redrawn, and they become part of the baked layer after a couple of seconds. When nothing is wet and the pen has come to rest, the animation loop stops until the next pointer event.",
    },
    {
      question: "Does it work with a finger or a stylus?",
      answer: "The canvas listens to pointer events and sets `touch-none`, so a finger or stylus draws without scrolling the page. Coalesced events are read where the browser offers them, which keeps fast strokes smooth on tablets.",
    },
    {
      question: "Is a typed name a valid signature?",
      answer: "That depends on the law that applies to your document and is a question for a lawyer, not a component. Many services accept a typed name with a record of who signed and when. If you need a drawn mark only, remove the text field, but then offer another way to sign for people who cannot use a pointer.",
    },
  ],
  related: ["thumbwheel-number-picker-with-rolling-digit-drums-and-knurled-wheels", "barbershop-appointment-card-rack-time-slot-picker-where-your-card-lifts-out-and-drops-into-a-free-hour-pocket", "paper-cheque-payment-form-that-writes-the-payee-amount-in-words-and-signature-in-pen-as-you-type"],
  tags: ["signature", "canvas", "fountain pen", "ink", "paper", "form", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
