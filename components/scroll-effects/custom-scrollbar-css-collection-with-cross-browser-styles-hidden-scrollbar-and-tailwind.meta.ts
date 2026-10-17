const meta = {
  slug: "custom-scrollbar-css-collection-with-cross-browser-styles-hidden-scrollbar-and-tailwind",
  category: "scroll-effects",
  name: "Custom Scrollbar CSS: 11 Cross-Browser Styles",
  keyword: "custom scrollbar css",
  title: "Custom Scrollbar CSS: 11 Styles for Chrome, Safari, Firefox | We.Inc",
  description: "Free custom scrollbar CSS you can scroll and copy: thin, pill, floating, hover-reveal, dark, horizontal and hidden bars, plus Tailwind versions without a plugin.",
  intro: "Eleven scrollable panels, each wearing a different scrollbar: a thin neutral bar, a brand colour on a tinted track, a rounded pill, a thumb that floats off the edges, one that only appears on hover or focus, a terminal bar on a code panel, a gradient thumb on a dark playlist, a slim rail under a horizontal row of cards, a hidden bar with a fade, and two written only in Tailwind classes. The CSS pieces use the pattern that keeps every browser covered: WebKit pseudo-elements for Chrome, Edge and Safari, and the standard scrollbar-width and scrollbar-color inside a block only Firefox reads. A table below lists each property and where it works. On phones the panels stack in one column and stay scrollable by touch.",
  useWhen: [
    "A sidebar, chat log or dropdown scrolls inside a fixed height and the default grey bar looks heavy next to your design.",
    "You have a dark code or terminal panel where a light system scrollbar stands out.",
    "A horizontal row of cards or product tiles needs a slim bar that hints it scrolls sideways.",
    "You want to hide the bar on a carousel or tab strip while keeping scrolling by wheel, touch and keyboard.",
    "Your project is Tailwind-only and you would rather not add a scrollbar plugin.",
  ],
  customize: [
    "Change the thumb and track colours in two places: background on ::-webkit-scrollbar-thumb and ::-webkit-scrollbar-track, and the two values of scrollbar-color in the @supports block, thumb first.",
    "Change the thickness with width on ::-webkit-scrollbar (height for horizontal bars). Firefox only offers thin or auto, so pick whichever is closest.",
    "Change the gap around the floating thumb with the border width on ::-webkit-scrollbar-thumb, for example 4px solid transparent, while background-clip: padding-box keeps the colour inside it.",
    "To stop content shifting when the bar appears, add scrollbar-gutter: stable to the panel.",
    "In Tailwind, swap the colours inside the arbitrary values, such as [scrollbar-color:#6366f1_#eef2ff], using an underscore where CSS would have a space.",
  ],
  accessibility: [
    "Every panel is focusable with tabindex=0, carries role=region and an aria-label, and shows a visible outline on focus, so keyboard users can scroll it with the arrow keys.",
    "Keep enough contrast between thumb and track for people who rely on seeing where they are in a long list. Very pale thumbs on white are hard to find.",
    "The hover-reveal style also shows the thumb on focus, so it never depends on a pointer. If you hide a scrollbar entirely, keep another cue, like the fade edge used here, that more content follows.",
  ],
  faqs: [
    {
      question: "How do I style a scrollbar in Firefox?",
      answer: "Firefox does not support the ::-webkit-scrollbar pseudo-elements. It reads the standard properties: scrollbar-width (auto, thin or none) and scrollbar-color with a thumb colour and a track colour. There is no way to round the thumb or use a gradient there.",
    },
    {
      question: "Why do my ::-webkit-scrollbar styles stop working in Chrome?",
      answer: "From Chrome 121, if an element sets scrollbar-width or scrollbar-color, Chrome uses those and ignores the ::-webkit-scrollbar rules for it. Put the standard properties inside @supports not selector(::-webkit-scrollbar) so only Firefox applies them, as these snippets do.",
    },
    {
      question: "How do I hide the scrollbar but keep scrolling?",
      answer: "Set scrollbar-width: none for browsers that support the standard property and ::-webkit-scrollbar { display: none; } for Safari and older Chrome. The element still scrolls by wheel, touch and keyboard. Do not use overflow: hidden, which stops scrolling altogether.",
    },
    {
      question: "Can I style the scrollbar of the whole page?",
      answer: "Yes. Apply the same rules to the html element instead of a panel class, for example html { scrollbar-color: #a8a29e #f5f5f4; } plus html::-webkit-scrollbar rules. Test long pages on macOS, where overlay scrollbars may hide until scrolling depending on the system setting.",
    },
    {
      question: "Do I need a plugin for custom scrollbars in Tailwind?",
      answer: "No. Arbitrary properties such as [scrollbar-width:thin] and [scrollbar-color:#6366f1_#eef2ff] set the standard values, and arbitrary variants such as [&::-webkit-scrollbar]:w-2 and [&::-webkit-scrollbar-thumb]:bg-sky-700 style the WebKit parts.",
    },
  ],
  related: [
    "css-gradient-border-collection-with-rounded-corners-animated-glow-and-copyable-css-or-tailwind",
    "css-loaders-and-spinners-collection-with-copyable-html-and-css",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  ],
  tags: ["custom scrollbar css", "css scrollbar", "scrollbar-color", "hide scrollbar css", "firefox scrollbar", "tailwind scrollbar", "webkit scrollbar"],
  height: 1450,
  section: true,
  interactive: true,
};

export default meta;
