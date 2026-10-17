const meta = {
  slug: "tailwind-pricing-tables-collection-with-copyable-react-jsx-and-html-for-every-section",
  category: "pricing",
  name: "35 Tailwind Pricing Tables You Can Copy",
  keyword: "tailwind pricing table",
  title: "35 Tailwind Pricing Tables: Copy React JSX or HTML | We.Inc",
  description: "Free Tailwind pricing tables: 35 sections with working yearly toggles, usage sliders, comparison tables and FAQs. Copy each as React JSX or HTML.",
  intro: "A library of 35 pricing sections built with Tailwind CSS, from two-plan splits and three-tier cards with a highlighted plan to four-tier grids, feature comparison tables, usage-based calculators, single plan offers, enterprise contact forms, dark themes and stacked layouts made for phones. The monthly and yearly switches really switch, and the sliders and add-on checkboxes recalculate the total as you move them. Each tile shows a scaled-down preview of the whole section; press Full size to see it at real width. Copy JSX gives you a React component with the state already wired up, and Copy HTML gives you the same markup with a short script, so it also works in a static page or a CMS. Every brand, plan and price in the set is an invented example for you to replace. On a phone each section renders at your screen width, so you see the layout your visitors will get.",
  useWhen: [
    "You are launching a product page and need a pricing section today, with a yearly discount that visitors can flip on without a page reload.",
    "Your product is billed by usage or by seat and a fixed price card would hide what people will really pay, so a slider that shows the monthly total is more honest.",
    "Buyers compare plans line by line before they commit and a feature matrix with clear included and missing marks will answer their questions faster than bullet lists.",
    "You build sites in plain HTML, a page builder or a CMS theme where React is not available, but you still want the toggle and calculator to work.",
  ],
  customize: [
    "Change prices in the markup itself. A price that depends on billing carries both values, for example `data-m=\"$19\" data-y=\"$16\"` in the HTML, or `{yearly ? \"$16\" : \"$19\"}` in the JSX; edit both numbers.",
    "Recolour a section by replacing its accent family in one pass, such as every `indigo-600` and `indigo-500` with `emerald-600` and `emerald-500`. The highlighted plan usually uses the darkest fill or a `ring-2`, so keep one plan visually stronger than the rest.",
    "Adjust a calculator by editing its formula attribute. `data-calc=\"seats:40,5,14\"` means a $40 base, 5 seats included and $14 for each extra seat; in the JSX it reads `term(usage.seats, 40, 5, 14)`. Change the slider range with `min`, `max` and `step` on the input.",
    "To move from three plans to four, copy one plan card and change the grid from `lg:grid-cols-3` to `lg:grid-cols-4`. Below about 1024px wide the cards stack, so long plan names and feature lists stay readable.",
    "To start on yearly billing, change `useState(false)` to `useState(true)` in the JSX, or call the billing function with true at the end of the HTML script.",
  ],
  accessibility: [
    "Billing switches are real buttons with `role=\"switch\"` and `aria-checked`, and segmented controls use `aria-pressed`, so screen readers announce which period is active. The visual state is styled from those attributes, so the two cannot disagree.",
    "Comparison tables use a caption, column headers and row headers, and the included and missing marks have text labels instead of relying on a coloured icon alone. Missing features in the checklist section are also announced as not included.",
    "Sliders and checkboxes sit inside labels that name what they control, and the live total sits right next to them. If you move the total elsewhere on the page, consider adding `aria-live=\"polite\"` to it.",
    "Every link and button has a visible focus ring and enough contrast on its fill. Small grey helper text was kept at a readable shade; check it again if you lighten a background.",
  ],
  faqs: [
    {
      question: "How do I make a monthly and yearly toggle in Tailwind?",
      answer: "Keep one boolean in state and render each price from it, for example `yearly ? \"$41\" : \"$49\"`. Make the switch a button with `role=\"switch\"` and `aria-checked={yearly}`, then style it with the `aria-checked:` variant and move the knob with `group-aria-checked:translate-x-6`. That is exactly how the JSX in this set works.",
    },
    {
      question: "Do these pricing tables need a JavaScript library?",
      answer: "No. The React versions only use useState. The HTML versions include a short plain script that handles every switch, slider and checkbox inside an element marked `data-pricing`, so several pricing blocks can live on one page without clashing. Sections without a toggle or calculator need no script at all.",
    },
    {
      question: "Which Tailwind version do they need?",
      answer: "Tailwind CSS 3.4 or newer, including version 4. A few sections use the `has-[:checked]` and `aria-checked:` variants, which arrived in 3.4 and 3.2. Everything else is stock utility classes with no plugins and no theme changes.",
    },
    {
      question: "How should I show a yearly discount honestly?",
      answer: "Show the monthly equivalent with a line underneath that states the yearly charge, such as \"$490 billed yearly\", so nobody is surprised at checkout. Badges like \"2 months free\" should match the real maths of your prices.",
    },
    {
      question: "How do I make a pricing table work on mobile?",
      answer: "Stack the plan cards in a single column below the large breakpoint and put the recommended plan where it is easy to find. Wide comparison tables should scroll sideways inside their own `overflow-x-auto` box rather than squeezing columns, which is what the table sections here do.",
    },
    {
      question: "Can I connect the buttons to a real checkout?",
      answer: "Yes. Replace each `href=\"#\"` with your checkout or signup address and pass the plan and billing period in it, for example `?plan=growth&period=yearly`. In React you can read the `yearly` state when you build that link.",
    },
  ],
  related: [
    "price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys",
    "photoreal-pricing-table-with-monthly-yearly-switch-and-three-glass-blocks-of-different-heights-in-one-shaft-of-window-light",
    "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge",
    "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
  ],
  tags: ["tailwind pricing table", "pricing table html css", "tailwind pricing", "pricing page design", "pricing section", "monthly yearly toggle", "pricing calculator", "comparison table"],
  height: 1600,
  section: true,
  interactive: true,
};

export default meta;
