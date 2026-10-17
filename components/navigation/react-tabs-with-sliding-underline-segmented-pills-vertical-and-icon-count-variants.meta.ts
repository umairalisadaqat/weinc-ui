const meta = {
  slug: "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
  category: "navigation",
  name: "React Tabs with Sliding Underline, Segmented Pills, Vertical and Icon Count Variants",
  keyword: "react tabs",
  title: "React Tabs: Underline, Pill, Vertical and Icon | We.Inc",
  description: "Free accessible React tabs in four styles: sliding underline, segmented pill, vertical and icons with counts. Arrow keys, Home and End, Tailwind.",
  intro: "Four React tabs components built on one small hook that follows the WAI-ARIA tabs pattern. The underline style slides a thin blue bar between account sections, the segmented style moves a white pill across a revenue period switch, the vertical style runs a teal rail down a settings list, and the dark style pairs each tab with an icon and a count badge for a support inbox. Each indicator is a single element that framer-motion moves with a spring, so it glides from the old tab to the new one instead of blinking. Every list has `role=\"tablist\"`, every panel is a real `tabpanel`, and the arrow keys, Home and End all work. On phones the cards stack into one column and the underline and icon rows scroll sideways inside their own strip rather than pushing the page wider.",
  useWhen: [
    "An account or project page splits into a handful of sections that share the same header, such as overview, billing and activity.",
    "A dashboard figure needs a compact day, week, month and year switch that sits right above the number it changes.",
    "A settings screen has more sections than fit across the top, so a vertical list on the left reads better.",
    "A support or orders view needs to show how many items wait in each queue before anyone clicks.",
  ],
  customize: [
    "Change the content in the four arrays at the top of the file: `underlineTabs`, `segmentTabs`, `verticalTabs` and `iconTabs`. Panels and tab buttons are rendered from them, so adding a fifth entry adds a fifth tab.",
    "Set `DEMO_AUTOPLAY` to `false` before using the code in a product. It only exists so the preview steps through the first two demos on its own, and it stops the moment someone clicks or focuses a tab.",
    "The accent colours are `#1d4ed8` (underline), `#0f766e` (vertical) and `#fbbf24` (count badges). Search and replace one hex value to restyle a variant, including its focus ring.",
    "The glide is tuned in `useSpring`: `stiffness: 520` and `damping: 40`. Drop stiffness to around 300 for a slower, softer slide, or raise damping to remove the faint settle at the end.",
    "To make tabs activate only on Enter or Space instead of as soon as the arrow keys land on them, change `focusTab` so it moves focus without calling `setActive`.",
  ],
  accessibility: [
    "Roving tabindex: only the selected tab is in the Tab order, so one press of Tab enters the list and the next press moves into the panel. Arrows move between tabs and wrap at both ends.",
    "The vertical list sets `aria-orientation=\"vertical\"` and listens for Up and Down instead of Left and Right, which is what screen readers announce for it.",
    "Count badges are folded into each tab's `aria-label`, so a screen reader says \"Flagged, 3 conversations\" rather than reading a loose number.",
    "Hidden panels use the `hidden` attribute, and with reduced motion switched on the indicators jump straight to their new place and the preview autoplay never starts.",
  ],
  faqs: [
    {
      question: "How do I build accessible tabs in React without a library?",
      answer: "You need three roles and one keyboard rule. Wrap the buttons in an element with `role=\"tablist\"`, give each button `role=\"tab\"`, `aria-selected` and `aria-controls` pointing at its panel, and give each panel `role=\"tabpanel\"` with `aria-labelledby` pointing back. Then keep only the active tab focusable and move focus with the arrow keys. The `useTabs` hook in this file does all of that in about forty lines, and you can lift it out on its own.",
    },
    {
      question: "How does the sliding underline animate between tabs?",
      answer: "Only the active tab renders the indicator, and every indicator in the same list shares one `layoutId`. When the active tab changes, framer-motion sees the element leave one button and appear in another, measures both positions and animates between them with the spring. You never calculate widths or offsets yourself, and it keeps working when labels change length or wrap.",
    },
    {
      question: "Can I use these tabs without framer-motion?",
      answer: "Yes. Delete the `motion.span` elements and replace each with a plain `span` that is only rendered on the active tab. The tabs keep working and stay fully accessible; the indicator simply appears in its new spot rather than gliding there.",
    },
    {
      question: "How do I control the active tab from outside, for example from the URL?",
      answer: "Move the `active` state out of `useTabs` and pass it in with a setter, then read the starting value from your router's search params. Write it back in the click and arrow handlers so the back button and shared links open the right tab.",
    },
    {
      question: "Should tabs change content or navigate to a new page?",
      answer: "These are for switching content on the same page. If each item loads a different URL, use a `nav` with links and `aria-current=\"page\"` instead, because screen reader users expect the tabs keyboard pattern only when the content swaps in place.",
    },
  ],
  related: [
    "woven-ribbon-tab-bar-with-a-thread-marker-that-unpicks-and-restitches-itself",
    "ring-binder-tabs-with-coloured-index-dividers-that-turn-over-chrome-rings-to-open-each-section",
    "manila-file-folder-tabs-in-a-steel-desk-rack-that-tip-forward-like-records-in-a-crate-to-show-the-chosen-file",
  ],
  tags: ["tabs", "react tabs", "segmented control", "vertical tabs", "accessible", "framer-motion", "tailwind"],
  height: 640,
  interactive: true,
};

export default meta;
