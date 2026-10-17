const meta = {
  slug: "star-rating-collection-with-half-stars-pure-css-radio-version-and-review-summary-in-react-and-html",
  category: "inputs",
  name: "Star Rating Collection with Half Stars, a Pure CSS Radio Version and a Review Summary in React and HTML",
  keyword: "star rating css",
  title: "Star Rating in CSS, HTML and React: 6 Copyable Pieces | We.Inc",
  description: "Free star rating components: read-only quarter stars, half-star input, a pure CSS radio version, numbered tiles and a review summary with bars. React and HTML.",
  intro: "Six star rating pieces covering both jobs a rating does: showing a score and collecting one. For display there is a quarter-precision star row that clips a filled layer over an empty one, and a review summary that works out the average from raw counts and lets shoppers filter by level. For input there is a star picker on native radio buttons with hover preview, a half-star picker with two hit areas per star, a version that needs no JavaScript and uses the :has() selector, and a dark numbered score picker built as a custom radio group. The read-only row and the CSS version also come as plain HTML. Every target is at least 44px, and the layouts stay inside a 360px screen.",
  useWhen: [
    "Product cards and listings need to show an average score with a review count next to it.",
    "A feedback or review form should collect a 1 to 5 score that works with a keyboard and a screen reader.",
    "Scores need more precision than whole stars, such as 3.5 for a recipe or 4.3 from a catalogue.",
    "You work in a CMS or static site where you can add HTML and CSS but not a script.",
    "A product page needs the classic review breakdown with a bar for each star level.",
  ],
  customize: [
    "Change star colours by swapping fill-amber-500 and fill-stone-200 (React) or the --on and --off variables in the HTML read-only version.",
    "Resize stars with h-5 w-5 in the Stars helper, h-8 w-8 in the radio input, or the --size variable in the CSS mask version.",
    "Edit the level words in the WORDS and LABELS arrays, and the counts in COUNTS to feed the summary from your own data.",
    "In the pure CSS version, change #0d9488 for the selected colour and the clip-path polygon if you want a different star shape.",
  ],
  accessibility: [
    "Read-only scores are a single element with role=img and a label such as 'Rated 4.3 out of 5', so the five drawn stars are not read out one by one.",
    "Inputs use native radios inside a fieldset with a legend; each label carries hidden text like '4 stars, Very good', and the focus ring shows on the star through the peer-focus-visible class.",
    "The numbered tiles follow the radio group pattern: role=radiogroup, aria-checked on each button, one tab stop and arrow keys that wrap from last to first.",
  ],
  faqs: [
    {
      question: "How do I make a star rating with only CSS?",
      answer: "Use one radio input per star with a label after each, hide the inputs visually, and draw the star on the label. The usual trick reverses the order with flex-direction: row-reverse so the sibling selector can colour lower stars, but that makes the arrow keys move the opposite way to what people see. The version here keeps the natural order and colours earlier labels with label:has(~ input:checked), which needs a browser that supports :has().",
    },
    {
      question: "How do I show a 4.3 rating with partial stars?",
      answer: "Stack two rows of five stars and clip the top, filled row to a width of rating divided by five. The React piece does this with an overflow-hidden wrapper; the HTML piece uses a gradient stop and a repeating star mask on one element.",
    },
    {
      question: "Should rating inputs use radio buttons or buttons?",
      answer: "Radio buttons give you correct semantics and keyboard support for free, and they submit with a form. Plain buttons can work, but then you must add role=radio, aria-checked, a roving tabindex and arrow key handling yourself, as the numbered tiles show.",
    },
    {
      question: "Is it fine to add review stars to my page's structured data?",
      answer: "Only for ratings that are genuinely collected and shown on that page. Search engines have rules on review markup and penalise invented or self-written ratings, so never mark up placeholder numbers like the demo data here.",
    },
  ],
  related: [
    "quantity-input-collection-with-plus-minus-stepper-spinbutton-keys-and-cart-line-in-react-and-html",
    "tailwind-product-card-row-with-photoreal-ceramic-cup-glass-carafe-and-linen-napkins-in-window-light",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  ],
  tags: ["star rating", "star rating css", "react star rating", "half star rating", "review summary", "rating input", "css only rating", "radio group"],
  height: 1196,
  section: true,
  interactive: true,
};

export default meta;
