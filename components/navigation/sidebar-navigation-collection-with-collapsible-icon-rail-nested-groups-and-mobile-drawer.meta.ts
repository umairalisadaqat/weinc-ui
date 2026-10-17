const meta = {
  slug: "sidebar-navigation-collection-with-collapsible-icon-rail-nested-groups-and-mobile-drawer",
  category: "navigation",
  name: "Sidebar Navigation Layouts for React and Tailwind",
  keyword: "react sidebar",
  title: "React Sidebar Navigation Layouts in Tailwind | We.Inc",
  description: "Free React and Tailwind sidebars: collapsible icon rail, two-level rail with panel, nested groups with filter, mobile drawer, dark switcher and HTML only.",
  intro: "Six sidebar layouts, each a working app frame you can click through. One collapses from a labelled 232px column to a 64px icon rail. One pairs a dark rail of sections with a panel of pages. One holds long documentation in disclosure groups with a filter box. One is a phone drawer that traps focus while open and hands it back to the menu button when it closes. One is a dark workspace sidebar with a switcher, counts and the signed-in person at the foot, and the last is plain HTML that opens its groups with details and summary and no script. Each sits inside a fixed-height frame; change that frame to h-screen, or fixed inset-0 for the drawer, when you drop it into an app.",
  useWhen: [
    "An admin area, dashboard or internal tool has more top-level pages than fit across a header bar.",
    "People need more room for tables or a canvas, so the sidebar should collapse to icons and remember nothing else about the layout.",
    "A product has sections that each hold several pages, like an inbox with folders or a shop with order states, and a rail plus panel shows both levels at once.",
    "Documentation or a help centre has dozens of pages grouped by topic and needs a filter to find one quickly.",
    "The same navigation has to work on a phone, where it becomes a drawer behind a menu button.",
  ],
  customize: [
    "Change the widths with w-[232px] and w-[64px] in the collapsible sidebar, w-[60px] and w-[200px] in the rail version, and w-[78%] max-w-[300px] for the drawer.",
    "Recolour the active link by editing bg-emerald-50 text-emerald-900 (collapsible), bg-violet-50 (drawer) or the border-amber-700 marker in the nested docs sidebar.",
    "Edit the link lists at the top of each component: MAIN_LINKS, SECTIONS, GROUPS, DRAWER_LINKS and DARK_GROUPS. Icon names come from the PATHS object, where you can add your own 24px paths.",
    "Start a docs group closed or open through the open object in NestedSidebar, or the open attribute on each details element in the HTML version.",
    "To use the drawer on a real page, change the overlay and panel from absolute to fixed and add z-50, then lock page scrolling while it is open.",
  ],
  accessibility: [
    "Every sidebar is a nav element with a label, and the current page carries aria-current=\"page\". In the icon rail, each link keeps its name through aria-label and shows it on hover with title.",
    "The collapse button and every docs group button report their state with aria-expanded; the docs groups also point to their lists with aria-controls.",
    "The drawer is a dialog with aria-modal. Opening it moves focus to its first control, Tab and Shift Tab cycle inside it, Escape closes it, and focus goes back to the menu button.",
    "Links are 36px to 48px tall with visible focus rings. Width and slide transitions turn off under reduced motion.",
  ],
  faqs: [
    {
      question: "How do I make a collapsible sidebar in React?",
      answer: "Hold a collapsed boolean in state, switch the aside's width class between two values, and hide the text labels when it is collapsed. Keep each link's name available with aria-label so the icon-only version is still announced, and give the toggle button aria-expanded.",
    },
    {
      question: "How should a sidebar behave on mobile?",
      answer: "Hide it behind a menu button and open it as a drawer over the page with a dim overlay. Move focus into it, keep Tab inside while it is open, close it on Escape, on an overlay tap and after choosing a link, and return focus to the button that opened it.",
    },
    {
      question: "Can I build a sidebar menu with only HTML and CSS?",
      answer: "Yes. The last example uses details and summary for its groups, which open and close natively with the keyboard and announce their state, and Tailwind's group-open variant rotates the arrow. You only need script for things like remembering which groups were open.",
    },
    {
      question: "Should the sidebar use nav or aside?",
      answer: "Use nav for the list of links, since that is what makes it a navigation landmark. Wrapping it in aside is fine for layout, but when a page has more than one nav, give each an aria-label such as Main or Documentation so they can be told apart.",
    },
    {
      question: "How is this different from a full dashboard layout?",
      answer: "These pieces focus on the sidebar itself and its behaviour. For complete admin screens with headers, charts and tables around a sidebar, see the dashboard layouts collection linked below.",
    },
  ],
  related: [
    "dashboard-layouts-collection-with-ten-copyable-react-tailwind-admin-screens",
    "responsive-react-navbar-with-mega-menu-animated-hamburger-and-sticky-shrink-on-scroll",
    "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
  ],
  tags: ["react sidebar", "tailwind sidebar", "sidebar menu html css", "collapsible sidebar", "mobile drawer navigation", "icon rail sidebar", "nested sidebar menu", "admin sidebar"],
  height: 1560,
  section: true,
  interactive: true,
};

export default meta;
