const meta = {
  slug: "quantity-input-collection-with-plus-minus-stepper-spinbutton-keys-and-cart-line-in-react-and-html",
  category: "ecommerce",
  name: "Quantity Input Collection with Plus and Minus Stepper, Spinbutton Keys and Cart Line in React and HTML",
  keyword: "quantity input",
  title: "Quantity Input: 6 Plus and Minus Steppers for Stores | We.Inc",
  description: "Free quantity input steppers for online stores in React and HTML: min, max and step limits, spinbutton keyboard support, decimals and a cart line with totals.",
  intro: "Six quantity selectors for product pages, carts and order forms, each written without a library. There is a bordered stepper with a typed value that clamps when you leave the field, a field that only accepts whole cases of six, a decimal weight field that counts in quarter kilos, a dark pill on a product card, an add to cart button that turns into a stepper and back, and two cart lines with per-line limits, totals and remove buttons. All of them expose the value as a spinbutton with its current value, minimum and maximum, and answer the arrow keys plus Home and End. The classic stepper and the cart lines also come as plain HTML with a style block and a short script. Every button is at least 40px square, so they are easy to hit with a thumb on a 360px screen.",
  useWhen: [
    "A product page needs a quantity selector next to the buy button, with a stock or per-order limit the shopper cannot exceed.",
    "Items are sold in fixed multiples, such as bottles by the case or tiles by the box, and typed numbers should round to a valid amount.",
    "You sell by weight or length and need decimal steps that never show floating point noise like 1.2500000001.",
    "A product grid should let people add an item and adjust the count in place without opening the cart.",
    "Your cart page or drawer needs line items whose totals and subtotal update as quantities change.",
  ],
  customize: [
    "Set limits with the MIN, MAX and STEP constants at the top of each piece, or with data-min and data-max on the .qty wrapper in the HTML version.",
    "Swap the accent by replacing emerald-700 and emerald-800 (focus ring, add to cart, value tint) with another Tailwind colour such as indigo-700.",
    "Change the larger jump for Page Up and Page Down by editing qty + 5 and qty - 5 in the keys map, or remove those two entries if you do not want them.",
    "Feed the cart lines from your store by replacing the START array; each line needs id, name, variant, price, qty and max.",
  ],
  accessibility: [
    "The focusable value carries role=spinbutton with aria-valuenow, aria-valuemin and aria-valuemax, and aria-valuetext where a unit matters, so a screen reader says '12 bottles, 2 cases' rather than a bare 12.",
    "Plus and minus buttons have names that say what they change ('Fewer Beeswax wraps'), and in the classic stepper they use aria-disabled at the limits so keyboard focus is not lost when a limit is hit.",
    "When the add to cart button turns into a stepper, focus moves onto the new value, and back to the button after removal. Quantity and subtotal changes are announced through role=status.",
    "Inputs use a 16px font, which avoids the automatic zoom iOS applies to smaller form text.",
  ],
  faqs: [
    {
      question: "Why not just use input type=\"number\"?",
      answer: "You can, and it already behaves as a spinbutton. The trade-offs are that its arrows are tiny on desktop and missing on most phones, the mouse wheel can change it by accident, and its look varies by browser. A text field with inputmode=\"numeric\" and your own buttons gives large tap targets and one consistent style while you add the spinbutton role and keys yourself.",
    },
    {
      question: "Which keys should a quantity stepper support?",
      answer: "The spinbutton pattern in the WAI-ARIA Authoring Practices expects Up Arrow and Down Arrow to step the value, Home and End to jump to the minimum and maximum when they exist, and allows Page Up and Page Down for a larger step. Typing a number directly should also work when the value is a text field.",
    },
    {
      question: "Should the minus button be disabled at the minimum?",
      answer: "Showing that it does nothing is helpful, but a disabled button drops keyboard focus if it was focused when the limit was reached. The classic stepper uses aria-disabled with a check in the click handler so focus stays put; the other pieces use the disabled attribute, which is simpler and fine when focus is usually on the value.",
    },
    {
      question: "How do I stop rounding errors with decimal quantities?",
      answer: "Store the quantity as a whole number of the smallest step and convert only for display. The weight piece keeps quarter kilos as integers 1 to 20 and divides by four when it renders, so 0.25 steps always add up exactly.",
    },
    {
      question: "Is a client-side maximum enough to enforce stock limits?",
      answer: "No. The limit in the stepper is a convenience. Check stock and per-order limits again on the server when the cart is updated or the order is placed.",
    },
  ],
  related: [
    "paper-shopping-bag-that-catches-boxed-products-bulges-leans-and-flexes-its-rope-handles",
    "tailwind-product-card-row-with-photoreal-ceramic-cup-glass-carafe-and-linen-napkins-in-window-light",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  ],
  tags: ["quantity input", "quantity selector", "plus minus stepper", "number stepper", "spinbutton", "add to cart", "cart quantity", "react quantity input"],
  height: 1209,
  section: true,
  interactive: true,
};

export default meta;
