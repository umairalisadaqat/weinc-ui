const meta = {
  slug: "paper-cheque-payment-form-that-writes-the-payee-amount-in-words-and-signature-in-pen-as-you-type",
  category: "forms",
  name: "Paper Cheque Payment Form That Writes the Payee, Amount in Words and Signature in Pen as You Type",
  keyword: "react cheque form amount in words",
  title: "React Cheque Form with the Amount in Words | We.Inc",
  description: "Payment form shown as a paper cheque: type a name and an amount and a pen writes them out, spells the sum in words and signs. Free React and HTML to copy.",
  intro: "A payment form with three fields and one button, and above it the cheque those fields fill in. The paper carries the fine wavy lines, rosettes and chained border of security printing, all drawn by a short canvas routine, with a perforated edge where it left the book. Whatever is typed in Pay to, Amount and For is written onto the matching line a letter at a time in blue-black ink, and a resin fountain pen travels with the nib. The amount is also spelled out in words on its own line a moment after the figures, with the pence as a fraction over a hundred. Sign cheque draws the signature in one stroke and the pen lies down beside it. The cheque is laid out at a fixed 680 by 300 pixels and scaled to the column, so on a phone it is the same cheque at half size with the fields stacked underneath.",
  useWhen: [
    "A payout, refund or invoice screen asks for a payee and an amount and should feel more deliberate than two grey boxes.",
    "A gift, donation or tipping flow wants the giver to see something they could imagine handing over.",
    "A bookkeeping or payroll tool needs the amount in words next to the figures so a mistyped zero is caught before sending.",
    "A landing page for a bank, an accountant or a payments product needs one object that says money without a card mock-up.",
  ],
  customize: [
    "`BANK`, `BRANCH`, `HOLDER`, `UNIT`, `DATE` and `SERIAL` at the top hold every printed word and number on the cheque.",
    "`INK` is the pen colour, used by the handwriting and the signature. `#111111` reads as black ballpoint, `#0f5132` as green ink.",
    "`HAND` is the list of script typefaces tried in order. Put a handwriting font you already load on your site at the front of it.",
    "The paper tint is the four colour stops of `tint` in the drawing effect, and the two wave colours are the `rgba` values in the loop under it.",
    "Writing speed is the `12` millisecond interval inside `Ink`. Use `30` for a slower, more careful hand.",
  ],
  accessibility: [
    "The three inputs have visible labels tied with `htmlFor`, and the form submits with Enter from any field.",
    "The cheque itself is one `role=\"img\"` whose label is rebuilt from the fields: bank, payee, amount and whether it is signed.",
    "A polite live line under the form says what is missing, when the cheque can be signed and when it has been.",
    "With reduced motion the text appears on the paper at once, the signature is simply there and the demo that writes sample cheques never runs.",
  ],
  faqs: [
    {
      question: "How are the figures turned into words?",
      answer: "The `inWords` function splits the number into whole units and hundredths, spells the whole part up to 999,999 with hyphenated tens such as forty-two, and appends the hundredths as a fraction. It is plain English only. For another language replace the `ONES` and `TENS` lists and the joining words.",
    },
    {
      question: "Why does the pen know where to go?",
      answer: "Each handwritten line ends in an empty marker element. After every new letter the component adds up that marker's offsets back to the cheque and moves the pen there with a 90 millisecond transition. Half a second after the last letter it returns to its resting place at the bottom right.",
    },
    {
      question: "Which typeface is the handwriting?",
      answer: "No font is downloaded. The list starts with Snell Roundhand, which ships with Apple devices, then Segoe Script and Lucida Handwriting for Windows, then the generic cursive family. The letters will look a little different on each system, as handwriting does.",
    },
    {
      question: "Does the form send anything?",
      answer: "No. Pressing Sign cheque only sets the `signed` state. Put your own request in the form's `onSubmit` handler, and read `payee`, `amount` and `memo` from state. `parse(amount)` gives the amount as a number capped at 999,999.99.",
    },
    {
      question: "Is this a real bank or currency?",
      answer: "Neither. The bank name, crest, account numbers and the vale are made up for the demo, and the pattern is generated from sine waves. It is a picture of the idea of a cheque and cannot be printed and used as one.",
    },
  ],
  related: ["savings-chart-of-minted-coin-stacks-where-each-deposit-drops-a-coin-that-wobbles-and-settles", "pin-tumbler-lock-cutaway-password-strength-field-where-each-rule-sets-a-pin-and-the-key-turns-the-plug", "restaurant-reservation-book-time-picker-with-a-pencil-on-a-string-that-writes-your-table-into-a-free-line"],
  tags: ["cheque", "check", "payment", "form", "handwriting", "pen", "guilloche", "skeuomorphic"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
