const meta = {
  slug: "tailwind-table-react-data-table-with-sorting-search-row-selection-and-pagination",
  category: "tables",
  name: "Tailwind Table: React Data Table with Sorting, Search, Row Selection and Pagination",
  keyword: "tailwind table",
  title: "Tailwind Table: React Data Table with Sorting and Search | We.Inc",
  description: "Free Tailwind table for React: sortable columns, search, status filters, checkbox selection, pagination and phone cards. No table library needed.",
  intro: "A complete React data table built with Tailwind and nothing else. It sorts by any column, searches across name, email, plan and invoice number, filters by status, and lets people tick rows one by one or a whole page at once, with the header checkbox going half-ticked when only some are chosen. The header stays pinned while the body scrolls, rows can switch between a comfortable and a compact density, and a clear empty state appears when a search finds nothing. Below 768px the table turns into a list of cards with a sort menu, so phones never scroll sideways. The rows shown are labelled demo invoices.",
  useWhen: [
    "An admin screen lists orders, invoices, users or tickets and people need to find one row quickly.",
    "You want bulk actions such as sending reminders, so checkbox selection with a running count matters.",
    "Your list is a few hundred rows held in the browser and a table package would be more weight than help.",
    "The same screen is opened on phones by staff in the field, and a squeezed table would be unreadable there.",
  ],
  customize: [
    "Swap `ROWS` for your data and edit `COLUMNS` to choose which fields show and which one aligns right.",
    "Change `PAGE_SIZE` to show more rows per page; for server paging, fetch the page in an effect and pass the total count in place of `filtered.length`.",
    "Status colours live in `BADGE` and `DOT`; add a key there for every status your data uses.",
    "The pinned header height comes from `max-h-[420px]` on the scrolling wrapper; raise it or remove it to let the page scroll instead.",
    "Point the Send reminder button at your own handler and read the chosen invoice numbers from the `selected` set.",
  ],
  accessibility: [
    "It is a real table with a hidden caption that states the current sort, and each sortable header sets `aria-sort` and holds a button you can reach with Tab.",
    "Every checkbox has its own label naming the invoice, and the page checkbox uses the native indeterminate state when only some rows are ticked.",
    "The selected count sits in a polite live region, filter and density buttons report `aria-pressed`, and the current page button carries `aria-current`.",
    "Status badges show the word as well as a colour dot, so the meaning does not rely on colour alone.",
  ],
  faqs: [
    {
      question: "How do I make a table header sticky in Tailwind?",
      answer: "Give the wrapper a fixed max height and `overflow-auto`, then put `sticky top-0` and a background colour on each `th`. Use `border-separate border-spacing-0` on the table, because with collapsed borders the header line scrolls away with the body.",
    },
    {
      question: "Do I need a library like a headless table package for sorting and paging?",
      answer: "Not for lists that fit in memory. Here one `useMemo` filters and sorts, and a slice gives the page. A dedicated package earns its place once you need column resizing, grouping, virtual scrolling or tens of thousands of rows.",
    },
    {
      question: "How does the select all checkbox show a partial state?",
      answer: "HTML has no attribute for it, so a small effect sets the `indeterminate` property on the input through a ref whenever some, but not all, rows on the page are ticked.",
    },
    {
      question: "How should a data table look on mobile?",
      answer: "Wide tables either scroll sideways or fold into cards. This one hides the table under the `md` breakpoint and renders a list where each record shows its name, amount, status and date, plus a select menu so sorting still works without column headers.",
    },
    {
      question: "Why does the page reset to one when I search or sort?",
      answer: "A new search can leave fewer pages than the one you were on, which would show an empty view. Resetting avoids that, and the page index is also clamped as a safety net.",
    },
  ],
  related: [
    "sortable-order-table-beside-a-webgl-oak-card-index-drawer-that-riffles-its-cards-into-the-new-order-and-lifts-the-hovered-row",
    "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
    "navbar-with-search-field-and-category-bar",
  ],
  tags: ["table", "data table", "sorting", "pagination", "checkbox", "search", "react"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
