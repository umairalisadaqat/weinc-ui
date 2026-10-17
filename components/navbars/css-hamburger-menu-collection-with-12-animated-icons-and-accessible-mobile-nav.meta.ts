const meta = {
  slug: "css-hamburger-menu-collection-with-12-animated-icons-and-accessible-mobile-nav",
  category: "navbars",
  name: "CSS Hamburger Menu Collection with 12 Animated Icons and an Accessible Mobile Nav",
  keyword: "css hamburger menu",
  title: "CSS Hamburger Menu: 12 Animated Icons and a Mobile Nav | We.Inc",
  description: "Free CSS hamburger menu set: 12 animated icons, a slide-in drawer, a dropdown and a no-JavaScript checkbox menu, plus a React and Tailwind version to copy.",
  intro: "A working set of hamburger menus rather than a single icon. Twelve animated icons (cross, spin, squeeze, arrows, collapse, plus, ring, elastic, flip and more) each copy as one button, a short CSS block and four lines of script that flip aria-expanded. Three complete phone menus show where the icon leads: a slide-in drawer that traps focus and closes on Escape, a dropdown panel under the bar, and an overlay that needs no JavaScript at all because a hidden checkbox and its label do the work. A fourth tab holds the same drawer as a React component styled with Tailwind. On narrow screens the icons drop to one or two columns and each menu fills the width of its card.",
  useWhen: [
    "Your site header collapses its links on phones and you want an icon whose open state matches what assistive technology reports.",
    "You are building a static or CMS theme with no framework and need a mobile menu in plain HTML, CSS and a few lines of script.",
    "Scripts are restricted or you are prototyping, so the checkbox overlay that runs on CSS alone is the practical choice.",
    "You have a React and Tailwind app and want a drawer with focus handling already written instead of pulling in a dialog library.",
  ],
  customize: [
    "Change the icon size by editing `width: 22px; height: 16px` on `__box` and the line offsets `top: 7px` and `top: 14px`; keep the `translateY(7px)` in the open rule equal to the gap between lines.",
    "Recolour an icon through the `background` and `color` on its root rule. The bars draw in `currentColor`, so changing `color` is enough for the lines.",
    "Tune the timing in the `transition` line on `__line`. The elastic icon gets its overshoot from `cubic-bezier(.68, -.55, .27, 1.55)`; swap in `ease` for a calmer close.",
    "For a full-screen drawer on a real page, change `position: absolute` to `position: fixed` on the panel and scrim rules, and delete the 420px height on the demo root.",
    "In the React version, edit the `NAV_LINKS` array for your pages and change `w-72` on the nav to widen or narrow the drawer.",
  ],
  accessibility: [
    "Icon buttons carry aria-label=\"Menu\" and aria-expanded, and the CSS reads the open state from that attribute, so the picture and the announced state cannot drift apart.",
    "The drawer moves focus to its first control when it opens, keeps Tab inside the panel, closes on Escape or a scrim click and returns focus to the menu button. Keep the close button if you change the layout.",
    "Closed panels use visibility: hidden, which takes their links out of the tab order. If you swap in your own animation, keep that rule or the hidden links stay reachable by keyboard.",
    "The checkbox menu works without script but is announced as a checkbox named Menu, cannot close on Escape and stays open after a link is chosen. Prefer the button version when you can run JavaScript.",
  ],
  faqs: [
    {
      question: "How do I make a hamburger menu with only HTML and CSS?",
      answer: "Put a checkbox before the header, a label for it in the header and the nav after both. A rule like `.check:checked ~ .panel` shows the nav, and the same selector turns the bars into a cross. The Pure CSS overlay in the Mobile menus tab is a complete example.",
    },
    {
      question: "Should a hamburger button change its label to Close when it opens?",
      answer: "Keep one name, such as Menu, and let aria-expanded carry the open or closed state. Changing both the name and the state makes some screen readers announce the change twice. The drawer adds a separate Close menu button inside the panel.",
    },
    {
      question: "Why do my menu links stay focusable when the menu is hidden?",
      answer: "Moving a panel off screen with transform or hiding it with opacity leaves its links in the tab order. Add visibility: hidden to the closed state, delayed until the slide finishes, as these snippets do.",
    },
    {
      question: "Do I need a focus trap for a mobile menu?",
      answer: "For a drawer that covers the page, yes: people using a keyboard should not tab into content hidden behind the scrim. A dropdown that pushes or overlays only part of the page can skip the trap, as long as Escape closes it.",
    },
    {
      question: "How do I connect one of these icons to my own menu?",
      answer: "Give your menu an id, add aria-controls with that id to the icon button, and in the click handler show or hide the menu alongside flipping aria-expanded. The script in the drawer example shows the full version.",
    },
  ],
  related: [
    "responsive-react-navbar-with-mega-menu-animated-hamburger-and-sticky-shrink-on-scroll",
    "css-loaders-and-spinners-collection-with-copyable-html-and-css",
  ],
  tags: ["css hamburger menu", "hamburger icon animation", "mobile menu css", "responsive navbar html css", "checkbox hack menu", "aria-expanded menu button", "react mobile nav tailwind"],
  height: 1150,
  section: true,
  interactive: true,
};

export default meta;
