const meta = {
  slug: "css-tabs-collection-with-radio-target-and-accessible-aria-tabs-in-six-styles",
  category: "navigation",
  name: "CSS Tabs Collection with Radio, :target and Accessible ARIA Tabs in Six Styles",
  keyword: "css tabs",
  title: "CSS Tabs: Radio, :target and ARIA Tabs in HTML | We.Inc",
  description: "Free CSS tabs in six styles: radio button tabs and :target tabs with no JavaScript, plus WAI-ARIA tabs with arrow keys. Live demos and copyable HTML and CSS.",
  intro: "Six tab sets in plain HTML and CSS, grouped by how they switch panels. Three use hidden radio buttons and the :checked selector: an underline that slides between equal tabs, a segmented control with a white pill, and a vertical settings list that stacks into one column when its container is narrow. One uses links and the :target selector, so every tab has its own address you can share. Two follow the WAI-ARIA tabs pattern with a short script: a horizontal set that selects as the arrow keys move, and a vertical queue with counts where arrows move focus and Enter or Space selects. A comparison tab sets out how each technique behaves for keyboard and screen reader users. Cards stack to one column on phones.",
  useWhen: [
    "A product page has overview, specification and delivery details that would make the page long if shown at once.",
    "You need tabs on a static page or in an email-safe template where script is unavailable or unwelcome.",
    "Documentation splits setup into steps and readers should be able to link straight to the step they mean.",
    "An app screen switches between filtered views of the same list and keyboard users expect arrow key navigation.",
  ],
  customize: [
    "To add a fourth radio tab, add another input and label pair, a fourth panel, and extend the selector list built from `.__radio:nth-of-type(n):checked ~ .__panels .__panel:nth-child(n)`. Change `calc(100% / 3)` on the underline to match.",
    "Recolour the underline and active text by changing `#1d4ed8` in the tabs-line rules, or `#0f766e` on the `::after` of the ARIA tabs.",
    "The vertical sets switch to one column inside `@container (max-width: 460px)`. Raise that number if your sidebar labels are long.",
    "For the :target tabs, rename the ids and hrefs together and update the matching `:has(#...:target)` selectors, which highlight the active link.",
    "Turn the automatic ARIA tabs into manual ones by adding `data-manual` to the root element; the script then moves focus without changing the panel.",
  ],
  accessibility: [
    "The ARIA versions use role tablist, tab and tabpanel, aria-selected, aria-controls and aria-labelledby, with only the selected tab in the tab order. Arrow keys, Home and End behave as the APG tabs pattern describes.",
    "Each ARIA panel has tabindex=\"0\" so keyboard users can reach a panel that holds only text. Remove it if every panel starts with a focusable element.",
    "Radio tabs are announced as a group of radio buttons, which is honest about how they work, but the panel is not linked to its label. Keep panels short and simple when you use them.",
    "Hidden radios stay focusable, and a :focus-visible rule draws the ring on the matching label. Keep that rule if you restyle the labels.",
  ],
  faqs: [
    {
      question: "Can I make tabs with only HTML and CSS?",
      answer: "Yes. Hidden radio buttons that share a name, each followed by a label, give you one selected tab at a time, and :checked selectors show the matching panel. The :target selector is the other option, using links to ids on the page.",
    },
    {
      question: "Are CSS-only tabs accessible?",
      answer: "They work with a keyboard, but screen readers hear radio buttons or links rather than tabs, and the panel is not announced as belonging to a tab. For app interfaces, the ARIA tabs with a short script are the better choice.",
    },
    {
      question: "What is the difference between automatic and manual activation?",
      answer: "With automatic activation the panel changes as soon as an arrow key moves to a tab. With manual activation arrows only move focus and Enter or Space shows the panel, which suits panels that are slow to load.",
    },
    {
      question: "Why does the page jump when I click a :target tab?",
      answer: "Following a link to an id scrolls that element into view. The snippet adds scroll-margin-top to keep the tab row visible. If the jump still bothers you, use radio tabs or the ARIA version instead.",
    },
    {
      question: "Which browsers support the :has() rules in the :target example?",
      answer: "Current Chrome, Edge, Safari and Firefox support :has(). It is only used to show the first panel before any tab is chosen and to highlight the active link; the panels themselves switch with :target, which every browser supports.",
    },
  ],
  related: [
    "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
    "css-toggle-switch-collection-with-15-styles-on-a-real-checkbox-sizes-disabled-and-rtl",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  ],
  tags: ["css tabs", "tabs html css", "css only tabs", "radio button tabs", "target selector tabs", "aria tabs", "accessible tabs javascript"],
  height: 1250,
  section: true,
  interactive: true,
};

export default meta;
