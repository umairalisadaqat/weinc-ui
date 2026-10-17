const meta = {
  slug: "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  category: "forms",
  name: "HTML Form Examples with Every Input Type, Copyable as HTML + CSS or Tailwind",
  keyword: "html form examples",
  title: "HTML Form Examples: 15 Styled Forms, Every Input Type | We.Inc",
  description: "Free HTML form examples: contact, signup, login, checkout, booking, survey and more, covering every input type. Copy each as HTML with CSS or as Tailwind.",
  intro: "Fifteen working forms for made-up businesses, from a studio contact form and a coffee subscription payment to a physio booking, a supper club RSVP, a roofing quote and a password reset. Between them they use every common input type: text, email, password, tel, url, number, search, date, time, datetime-local, month, week, color, range, file, checkbox, radio, hidden, submit, reset and button, plus textarea, select, datalist, fieldset with legend and output. Each one validates in the preview with the browser's own rules, shows the error under the field that failed and a status line when everything passes. Copy any form as plain HTML with a small CSS block, or as Tailwind HTML; both come with the same short script. Below the forms sits a reference table of input types. On phones every form drops to a single column with 44px tall fields.",
  useWhen: [
    "You need a starting form for a real page, such as a contact, quote or booking form, and want the labels, help text and error messages already wired.",
    "You are not using a framework and want a form that looks finished with plain HTML and one style block.",
    "You are unsure which input type fits a field, for example month for a card expiry or week for a start date, and want to see it working.",
    "You want client-side validation from HTML attributes alone (required, pattern, min, max, minlength, accept) before adding a server.",
    "You are teaching or learning forms and want one page that shows each input type in a believable context.",
  ],
  customize: [
    "Recolour a plain CSS form by editing the hex values in its style block: the accent appears on .f-btn, .f-eyebrow, the focus outline and accent-color for checkboxes, radios and the range slider.",
    "In the Tailwind version, swap the accent by replacing one colour name across the form, for example teal-700 to indigo-700, which changes the button, focus ring and checkbox accent together.",
    "Change a rule by editing its attribute: pattern=\"[0-9]{6}\" on the reset code, min and max on the booking date, or accept=\".pdf,.doc,.docx\" on the CV upload. Update the matching error text in the p with the id ending -err.",
    "Turn the two-column grid into one column by removing sm:grid-cols-2 (Tailwind) or adding the f-one class next to f-grid (plain CSS).",
    "Point a form at a real handler by replacing action=\"#\" with your endpoint. The script then submits it once every field is valid.",
  ],
  accessibility: [
    "Every control has a label tied to its id, and radio or checkbox groups sit in a fieldset with a legend so the question is read before each option.",
    "Help text is linked with aria-describedby. When a field fails, the script sets aria-invalid, reveals its error message and adds that message to aria-describedby, then moves focus to the first problem.",
    "The status line is a role=status region, so the success or error summary is announced without moving focus. The range value uses output, which is also announced.",
    "Buttons and fields are at least 44px tall with visible focus styles. Keep autocomplete values such as email, new-password and cc-number, which let browsers and password managers fill fields correctly.",
  ],
  faqs: [
    {
      question: "How do I send these forms without writing a backend?",
      answer: "Set the form's action to the address of a form-handling service and keep method=\"post\". With Formspree you create a form in its dashboard and use action=\"https://formspree.io/f/your-form-id\". Netlify Forms works only for sites hosted on Netlify: add data-netlify=\"true\" and a unique name to the form tag, turn on form detection in the Netlify dashboard, and Netlify collects submissions after the next deploy. In both cases keep a name attribute on every field you want to receive.",
    },
    {
      question: "Why do the forms have novalidate if they use HTML validation?",
      answer: "novalidate turns off the browser's pop-up bubbles, not the rules. The script still calls checkValidity on each field, which uses required, pattern, min, max and the rest, then shows the written error under the field instead. This gives you consistent wording and styling across browsers. Remove novalidate and the script if you prefer the browser's default messages.",
    },
    {
      question: "Should I use type=number for card numbers, phone numbers or postcodes?",
      answer: "No. Number fields drop leading zeros, may show spin buttons and reject spaces. Use type=text with inputmode=\"numeric\" and a pattern for card numbers and codes, type=tel for phone numbers and plain text for postcodes, as the payment, reset and shipping forms here do.",
    },
    {
      question: "Do month and week inputs work in every browser?",
      answer: "Not everywhere. Chromium browsers show a picker, but Firefox and desktop Safari fall back to a plain text box, so the user has to type a value such as 2026-10 or 2026-W43. If that matters for your audience, use two selects for month and year, or a date input, and keep a help line explaining the format.",
    },
    {
      question: "Is the hidden input safe for prices or order totals?",
      answer: "No. A hidden input is invisible on the page but anyone can read and change it in the browser before sending. Use it for harmless context such as which form or page the submission came from, and look up prices and totals on the server.",
    },
    {
      question: "What is the difference between the HTML + CSS and Tailwind copies?",
      answer: "They are the same markup. The HTML + CSS copy uses short class names such as f-field and f-input styled by an included style block, so it works on any page. The Tailwind copy uses utility classes instead and needs Tailwind 3.2 or later, because it uses the aria and data variants for error and status colours.",
    },
  ],
  related: [
    "paper-cheque-payment-form-that-writes-the-payee-amount-in-words-and-signature-in-pen-as-you-type",
    "ray-marched-brass-hotel-key-sign-in-form-where-the-key-swings-toward-a-lock-case-on-green-leather-as-you-type-and-throws-the-bolt-on-submit",
    "react-modal-popup-dialog-with-focus-trap-confirm-form-bottom-sheet-and-side-drawer",
  ],
  tags: ["html form examples", "html input types", "form validation", "contact form html", "html css form", "tailwind form", "signup form", "checkout form"],
  height: 1600,
  section: true,
  interactive: true,
};

export default meta;
