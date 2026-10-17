const meta = {
  slug: "back-to-top-button-collection-with-progress-ring-pill-floating-label-and-smooth-scroll-snippets",
  category: "scroll-effects",
  name: "Back to Top Buttons and Smooth Scroll Snippets",
  keyword: "back to top button",
  title: "Back to Top Button and Smooth Scroll Snippets | We.Inc",
  description: "Free back to top buttons in React and vanilla JS: progress ring, square, pill, floating label, reading bar and edge tab, plus CSS and JS smooth scroll.",
  intro: "Six back to top buttons, each running inside its own scrolling article so you can try it before you copy it: a progress ring that fills as you read, a plain square icon, a centred pill with text, a round button that slides its label out on hover or focus, a slim reading bar with a Top link, and a tab that slides in from the right edge. Each one stays hidden until the reader passes a set distance, scrolls back up smoothly unless the visitor has asked for reduced motion, and then moves keyboard focus to the page heading. Every button comes as a React component and as plain HTML, CSS and a short script. Below them, a side by side note compares smooth scrolling with CSS and with JavaScript.",
  useWhen: [
    "Long articles, recipes, documentation or product lists where reaching the menu again means several screens of scrolling on a phone.",
    "A reading progress indicator would help people judge how much of a guide is left, so the ring or the reading bar does two jobs.",
    "You want smooth scrolling on in-page links without a library, and need it to switch off for people who prefer less motion.",
    "A site already has a chat or cookie button in the bottom right corner, so the centred pill or the edge tab avoids a clash.",
  ],
  customize: [
    "Change when a button appears with the showAfter prop in React, or const SHOW_AFTER = 400 in the vanilla script. The previews use 240 because their frames are short.",
    "Move a React button by passing a different position string, for example \"fixed bottom-4 left-4 z-40\". In the vanilla CSS edit right and bottom on .to-top.",
    "Recolour the ring with stroke=\"#0f766e\" for the fill and #e2e8f0 for the track, and change its thickness with strokeWidth, which is 3.",
    "Point the button at a scrolling panel instead of the window by passing scrollRef, which is how the previews here work.",
    "Change the focus target by passing topId and giving that element tabIndex={-1}; in the vanilla version edit the id in getElementById(\"top\").",
  ],
  accessibility: [
    "Hidden buttons use visibility hidden as well as opacity, so they cannot be tabbed to or read out while invisible.",
    "After scrolling, focus moves to the page heading with preventScroll, so the next Tab starts at the top instead of jumping back down the page.",
    "Smooth scrolling and every slide and fade turn off when the operating system's reduce motion setting is on, through matchMedia in script and motion-reduce classes or a media query in CSS.",
    "Icon-only buttons carry aria-label text; the ring's label includes how much has been read. All buttons are at least 40px in each direction except the reading bar link, which sits in a 40px tall bar.",
  ],
  faqs: [
    {
      question: "How do I make a back to top button appear only after scrolling?",
      answer: "Listen to the scroll event with passive: true, compare window.scrollY with a threshold such as 400 pixels, and toggle a class or a state value. Hide the button with visibility hidden and opacity 0 so it fades and also leaves the tab order.",
    },
    {
      question: "Should I use CSS scroll-behavior or JavaScript for smooth scrolling?",
      answer: "Use CSS scroll-behavior: smooth on html when every in-page link should glide. Use window.scrollTo with behavior: \"smooth\" when only one button needs it, or when you also want to move focus afterwards. Either way, turn it off under prefers-reduced-motion.",
    },
    {
      question: "Why move focus after scrolling to the top?",
      answer: "Scrolling does not move keyboard focus. Without a focus call, a keyboard user who presses the button sees the top of the page, but their next Tab lands just after the button at the bottom. Focusing the heading keeps what they see and where they are in step.",
    },
    {
      question: "Does smooth scrolling work in all browsers?",
      answer: "The scroll-behavior property and the behavior option of scrollTo are supported in current Chrome, Edge, Firefox and Safari. Older browsers jump instantly instead, which still works.",
    },
    {
      question: "Where should a back to top button go?",
      answer: "The bottom right corner is the most common spot and where people look first. Keep it clear of chat or cookie widgets, and on phones make sure it does not cover the last line of text or a sticky call to action.",
    },
  ],
  related: [
    "pagination-collection-with-numbered-load-more-infinite-scroll-and-url-synced-react-tailwind-pieces",
    "sidebar-navigation-collection-with-collapsible-icon-rail-nested-groups-and-mobile-drawer",
    "responsive-react-navbar-with-mega-menu-animated-hamburger-and-sticky-shrink-on-scroll",
  ],
  tags: ["back to top button", "scroll to top button", "smooth scroll", "scroll progress button", "react back to top", "css scroll-behavior", "back to top javascript", "reading progress bar"],
  height: 1440,
  section: true,
  interactive: true,
};

export default meta;
