const meta = {
  slug: "accordion-collection-with-styled-details-summary-aria-and-react-plus-faq-schema",
  category: "faq",
  name: "Accordion Collection with Styled details and summary, ARIA and React, plus FAQ Schema",
  keyword: "css accordion",
  title: "Accordion in HTML, CSS and React: details/summary | We.Inc",
  description: "Free accordions to copy: five styled details and summary designs, an ARIA accordion with animated height, a React and Tailwind version and FAQ JSON-LD.",
  intro: "Six accordions in HTML and CSS plus a React component. Five are built on the native details and summary elements with the default triangle replaced: a plain list with a turning chevron, separate cards whose plus folds into a minus, a set where only one answer stays open through the shared name attribute, a version whose height animates in browsers that support ::details-content, and a dark numbered list driven by a CSS counter. The sixth is an ARIA accordion, with buttons inside headings and a few lines of script, whose height animates everywhere through grid-template-rows. Other tabs hold the React and Tailwind component and a FAQPage JSON-LD block generated from the first set of questions. Every layout fills a phone screen without sideways scroll.",
  useWhen: [
    "A pricing, product or support page has a list of common questions that would push the main content too far down if every answer were open.",
    "You want an accordion that works before any script loads, which details and summary give you with no extra code.",
    "Only one answer should be open at a time, such as a plan comparison, and you would rather not write JavaScript for it.",
    "Your page outline matters for screen reader users and each question should be a real heading, which the ARIA version allows.",
    "You are adding a FAQ to a React site and want the same markup and the matching structured data in one place.",
  ],
  customize: [
    "Change the divider colour on the plain list with `border-bottom: 1px solid #e7e5e4` on `__item`, and the answer colour with `color: #57534e` on `__a`.",
    "Make any details set exclusive by adding the same `name` value to each details element, as the One open at a time example does with `name=\"faq-exclusive\"`.",
    "Slow or speed up the ARIA accordion by changing `.3s` in both the `grid-template-rows` transition and the `visibility` delay on `__inner`; keep the two equal.",
    "In the React component, pass `multiple` to allow several open answers and `defaultOpen={[]}` to start with everything closed.",
  ],
  accessibility: [
    "Native summary elements are focusable and toggle with Enter and Space without script. Removing the marker with list-style: none does not change that, and each snippet adds a visible focus outline.",
    "The ARIA accordion puts each button inside an h3 with aria-expanded and aria-controls, and each panel is a region labelled by its button. Change the heading level to fit your page outline.",
    "Closed ARIA panels become visibility: hidden once the closing animation ends, so links inside a closed answer leave the tab order.",
    "All animations sit behind a prefers-reduced-motion rule that makes them instant.",
  ],
  faqs: [
    {
      question: "How do I make an accordion with only HTML?",
      answer: "Use a details element with a summary inside it for the question, followed by the answer. The browser handles opening, closing and keyboard support. Add the open attribute to any item that should start expanded.",
    },
    {
      question: "How do I remove or replace the default triangle on summary?",
      answer: "Set list-style: none on summary, and for older Safari also hide ::-webkit-details-marker. Then add your own icon inside the summary, as an inline SVG or two pseudo-element bars, and rotate it with a [open] selector.",
    },
    {
      question: "Can details and summary animate their height?",
      answer: "In browsers that support interpolate-size and the ::details-content pseudo-element, yes, as the Smooth height example shows. Elsewhere the same code opens instantly. For an animation that works in every current browser, use the ARIA accordion with grid-template-rows.",
    },
    {
      question: "Should I add FAQPage schema to my accordion?",
      answer: "Add it only when the questions and answers are visible on the page exactly as marked up. It is valid structured data, but Google now limits FAQ rich results mostly to authoritative government and health sites, so do not expect a change in how your result looks.",
    },
    {
      question: "When should I use the ARIA accordion instead of details?",
      answer: "Use it when each question needs to be a real heading, when you need the height animation in every browser, or when another script must open and close panels in step with the rest of your interface.",
    },
  ],
  related: [
    "faq-accordion-in-react-beside-an-opal-glass-globe-lamp-in-webgl-that-glows-brighter-as-each-answer-opens",
    "css-tabs-collection-with-radio-target-and-accessible-aria-tabs-in-six-styles",
    "css-toggle-switch-collection-with-15-styles-on-a-real-checkbox-sizes-disabled-and-rtl",
  ],
  tags: ["css accordion", "accordion html css", "details summary accordion", "react accordion", "aria accordion", "faq accordion", "faq schema"],
  height: 1250,
  section: true,
  interactive: true,
};

export default meta;
