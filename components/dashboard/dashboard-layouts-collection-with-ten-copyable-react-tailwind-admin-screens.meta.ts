const meta = {
  slug: "dashboard-layouts-collection-with-ten-copyable-react-tailwind-admin-screens",
  category: "dashboard",
  name: "Dashboard UI Layouts: 10 Copyable React and Tailwind Admin Screens",
  keyword: "tailwind dashboard template",
  title: "Dashboard UI Layouts: 10 React + Tailwind Admin Screens | We.Inc",
  description: "Free Tailwind dashboard templates: ten full admin screens with sidebar, KPI cards, SVG charts and data tables. Copy a screen or one block as React or HTML.",
  intro: "Ten complete admin screens built with Tailwind CSS: site analytics, a subscription revenue console, shop orders, a sales pipeline, budget tracking, a project sprint, a support queue, fleet routes, a clinic front desk and a campaign report. Each one has a sidebar, a row of four KPI cards, a chart drawn as inline SVG from a small data array, a side panel and a real table. Three of them are dark. Open the Code panel to copy the whole screen or only the sidebar, KPI row, chart, panel or table, as React JSX or plain HTML. Below the lg breakpoint the sidebar is hidden and a top bar with a sideways scrolling menu takes its place, the KPI cards drop to two per row and wide tables scroll inside their card.",
  useWhen: [
    "You are starting the signed-in area of a product and need a believable first screen to build the real data into.",
    "A client wants an internal admin page for orders, bookings or tickets and you would rather adapt a finished layout than arrange cards from nothing.",
    "You need a single block, such as a KPI row or an SVG bar chart, that already matches a sidebar and table you have.",
    "You are pitching a dashboard idea and want a screenshot-quality mock in an afternoon, in light or dark.",
  ],
  customize: [
    "Change the accent by swapping the colour family in the screen's classes, for example every `indigo-600` and `indigo-50` in the analytics screen to `teal-600` and `teal-50`.",
    "Chart series take their colour from `text-*` classes on the SVG group, because lines and bars use `currentColor`. Change `text-sky-400` on a group to recolour that series.",
    "The bar heights and line points in the copied code are plain numbers. Replace them with values from your data, or map an array into `rect` elements the same way the y position is computed: height minus value divided by maximum, times height.",
    "Make the sidebar narrower by changing `w-60` to `w-52`, or use the icon rail from the project tracker (`w-[72px]` with `aria-label` on each link).",
    "Tighten the density by dropping the card padding from `p-5` to `p-4` and the table cells from `py-3` to `py-2`.",
  ],
  accessibility: [
    "The sidebar and the phone menu are both nav landmarks with their own aria-label, and the current page link carries aria-current=\"page\" so screen readers announce where you are.",
    "Every chart SVG has role=\"img\" and an aria-label that states what it shows; the donut label lists each share in words, so nothing depends on colour alone.",
    "Tables use th with scope=\"col\" for headings and scope=\"row\" for the first cell of each row. Keep those if you generate rows from data.",
    "Text colours were chosen for at least 4.5:1 contrast on their card, including the muted labels on the dark screens, and every link, button and search field shows a focus ring.",
  ],
  faqs: [
    {
      question: "Do the charts need a charting library?",
      answer: "No. Lines are SVG polylines and bars are SVG rects whose positions are worked out from the numbers, with a viewBox of 600 by 200 stretched to the card width. For a handful of series that is lighter than a library. If you later need tooltips, zooming or live updates, keep the card and swap the SVG for your library's chart.",
    },
    {
      question: "How does the sidebar behave on a phone?",
      answer: "The aside has `hidden lg:flex`, so it disappears below 1024px. A second block with `lg:hidden` shows the brand, a notifications button and the same links in a row that scrolls sideways. It needs no JavaScript. If you prefer a drawer, keep the aside markup and show it in a dialog toggled by a menu button.",
    },
    {
      question: "Can I copy just the KPI cards or the table?",
      answer: "Yes. Press Code under any screen and pick Sidebar, KPI row, Chart, the panel or Table before copying. Each block is self-contained markup with its own card styles, so it drops into an existing layout. The sidebar block copies both the desktop aside and the phone menu.",
    },
    {
      question: "How do I add dark mode to a light screen?",
      answer: "The dark screens show the colour choices that hold up: zinc or slate 900 cards on a 950 page, 800 borders, 400 for muted text and a bright accent such as lime or amber with dark text on it. Add `dark:` variants with those values next to the light classes, or copy one of the dark screens as the starting point.",
    },
    {
      question: "Will these work in Tailwind v4 and in Next.js?",
      answer: "Yes. Only standard utilities and a few arbitrary values such as `w-[72px]` are used, and the JSX has no hooks or browser APIs, so it renders on the server in a Next.js page or layout. The HTML version works in any template that loads Tailwind.",
    },
  ],
  related: [
    "tailwind-table-react-data-table-with-sorting-search-row-selection-and-pagination",
    "tailwind-footer-collection-with-copyable-react-jsx-and-html-for-every-footer",
    "big-headline-hero-with-stats-row",
  ],
  tags: ["tailwind dashboard template", "dashboard ui", "admin dashboard", "react admin template", "tailwind sidebar", "kpi cards", "svg charts", "dark dashboard"],
  height: 1600,
  section: true,
  interactive: true,
};

export default meta;
