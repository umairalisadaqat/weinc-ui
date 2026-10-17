const meta = {
  slug: "responsive-react-navbar-with-mega-menu-animated-hamburger-and-sticky-shrink-on-scroll",
  category: "navbars",
  name: "Responsive React Navbar with Mega Menu, Animated Hamburger and Sticky Shrink on Scroll",
  keyword: "react navbar",
  title: "Responsive React Navbar with Mega Menu (Tailwind) | We.Inc",
  description: "Free responsive React navbar in Tailwind: mega menu, dropdown, animated hamburger, sticky bar that shrinks on scroll, active link and full keyboard support.",
  intro: "A complete responsive navbar for React and Tailwind, shown in three styles you can switch between: a light bar, a dark bar and a floating pill. It has a logo, five links, a six-item mega menu with a featured card, a smaller Resources dropdown, a sign-in link and a call-to-action button. The page you are on is marked with a small dot and `aria-current`. The bar is sticky and tightens its padding and gains a shadow once the page scrolls, and an open menu closes as you scroll. Below 768 pixels of its own width it swaps the links for a hamburger whose three bars fold into a cross, opening a panel with the dropdowns turned into accordions. The preview shows the desktop bar and an open phone menu side by side.",
  useWhen: [
    "You are starting a marketing site or SaaS app and need a header that already handles desktop, tablet and phone.",
    "One of your top-level items has more than four children and deserves a mega menu with short descriptions instead of a bare list.",
    "Your pages are long and you want the navigation to stay in reach without taking up a tall strip the whole time.",
    "You want a hamburger menu without installing a headless UI or menu package.",
  ],
  customize: [
    "All links live in the `links` array. Give an entry a `mega` array for the wide panel or a `menu` array for a small dropdown; leave both off for a plain link. Each item has `label`, `text` and an SVG `icon` path.",
    "Set `ACTIVE` to the label of the current page, or replace that comparison with your router's pathname check so `aria-current` follows the real route.",
    "Pick one style from the `variants` object and delete the rest. Colours are plain Tailwind classes there: swap `bg-emerald-600` in `dot` or `bg-orange-600` in `cta` to rebrand.",
    "`COMPACT_BELOW` (768) is where the hamburger takes over. The navbar measures its own width with a ResizeObserver, so it also works inside a sidebar layout or a narrow column.",
    "To make it stick to the window instead of a preview box, render `<Navbar variant=\"light\" />` with no `scrollBox`; `useScrolled` then listens to `window.scrollY`. Change its `offset` (12) to delay the shrink.",
  ],
  accessibility: [
    "Dropdown triggers are real buttons with `aria-expanded` and `aria-controls`. Down Arrow opens a menu and moves focus to its first link, Escape closes it and returns focus to the trigger, and clicking outside closes it.",
    "The hamburger's label switches between Open menu and Close menu, and Escape closes the phone panel and puts focus back on the hamburger.",
    "Every link and button has a visible focus ring in the variant's accent colour and is at least 40 pixels tall for touch.",
    "With reduced motion turned on, the panels, chevrons and hamburger change state instantly and the preview's self-playing scroll does not run.",
  ],
  faqs: [
    { question: "How do I make a navbar responsive in React with Tailwind?", answer: "Render the same `links` data twice: as a row of links for wide screens and as a collapsible panel behind a menu button for narrow ones. This component decides which to show from its own measured width, but you can use `hidden md:flex` on the link row and `md:hidden` on the hamburger if you prefer pure CSS breakpoints." },
    { question: "How does the navbar shrink when the page scrolls?", answer: "The header is `sticky top-0`. A small `useScrolled` hook adds a passive scroll listener and returns true once the page has moved past 12 pixels. The nav then switches from `py-4` to `py-2` and adds a soft shadow, with a 300 millisecond transition so it eases instead of snapping." },
    { question: "How is the hamburger icon animated?", answer: "It is three 2 pixel bars drawn with spans. When the menu opens, framer-motion moves the top and bottom bars to the middle and rotates them 45 and minus 45 degrees, while the middle bar fades and shrinks, all on one spring. No icon font or second SVG is needed." },
    { question: "Should a mega menu open on hover or on click?", answer: "Click, here. Hover menus open by accident when the pointer crosses the bar, do not exist on touch screens and are hard to make keyboard friendly. If you want hover as well, add `onMouseEnter` and a short close delay on `onMouseLeave` to each `li`, but keep the click and keyboard handlers." },
    { question: "Can I use this with Next.js or React Router links?", answer: "Yes. Replace the plain `<a href>` tags with your router's link component and keep the same class names. Set the current page from the router's pathname so the dot and `aria-current` move as people navigate." },
  ],
  related: ["navbar-with-centered-links-and-mobile-menu", "navbar-with-search-field-and-category-bar", "navbar-with-liquid-stretch-highlight-and-inverting-labels"],
  tags: ["react navbar", "responsive navbar", "mega menu", "hamburger menu", "sticky header", "dropdown", "tailwind"],
  height: 640,
  section: true,
  interactive: true,
};

export default meta;
