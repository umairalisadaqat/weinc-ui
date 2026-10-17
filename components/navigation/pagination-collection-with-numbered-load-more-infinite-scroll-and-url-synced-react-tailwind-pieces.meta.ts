const meta = {
  slug: "pagination-collection-with-numbered-load-more-infinite-scroll-and-url-synced-react-tailwind-pieces",
  category: "navigation",
  name: "Pagination Components for React, Tailwind and HTML",
  keyword: "react pagination",
  title: "Pagination Components: React, Tailwind and HTML | We.Inc",
  description: "Free pagination components: numbered with ellipsis, prev and next, load more, infinite scroll, URL page sync and a usePagination hook, in React or HTML.",
  intro: "Nine pagination patterns you can click through before you copy them: numbered pages with an ellipsis, a joined segmented bar, a table footer with a rows per page select, previous and next links, a compact phone control, a load more button, infinite scroll driven by a sentinel row, a version that keeps the page in the address bar, and the usePagination hook with a live playground. Every number comes from one small pageItems function, so the hook you copy draws exactly what you see. Pieces that make sense without JavaScript also come as server-rendered HTML with real ?page= links. On a phone the cards stack, Previous and Next shrink to arrows, and the compact control fits a 320px screen.",
  useWhen: [
    "A product catalogue, search page or admin table has more rows than one screen should hold and people need to jump to a specific page.",
    "A blog or changelog only needs older and newer, and a row of page numbers would add noise without helping anyone.",
    "A gallery or comment thread reads better as one growing list, so a load more button or infinite scroll suits it better than separate pages.",
    "Filters and page numbers must survive a refresh, a shared link and the back button, which means the page has to live in the URL.",
  ],
  customize: [
    "Change how many numbers sit beside the current page with the siblings argument: usePagination({ total, siblings: 2 }) shows two each side and keeps the control a fixed nine slots wide.",
    "Restyle the current page by editing \"bg-slate-900 text-white\" in the numbered version, or the \"shadow-[inset_0_-2px_0_#047857]\" underline in the segmented bar.",
    "Set the batch size with const step = 4 in Load more and const batch = 8 in the infinite list, then replace the setTimeout in the observer callback with your request for the next page.",
    "Change rootMargin: \"0px 0px 120px 0px\" to start loading earlier or later, and set root to null when the whole window scrolls instead of a box.",
    "For Next.js or React Router, keep the markup of UrlSyncedPagination and swap the body of useUrlPage for the router's search params helper.",
  ],
  accessibility: [
    "Each control is a nav landmark with its own label, such as \"Pagination\" or \"Table pages\", so a screen reader user can tell it apart from the site menu.",
    "The current page carries aria-current=\"page\" and a filled background, so it is announced and does not rely on colour alone. Icon-only arrows have aria-label text.",
    "Load more moves focus to the first new article after loading, and the infinite list keeps a real Load more button inside its sentinel for keyboards and for browsers where the observer does not fire.",
    "Counts such as \"Showing 8 of 14 articles\" sit in polite live regions. Every button is at least 40px tall, and the spinner stops when reduced motion is on.",
  ],
  faqs: [
    {
      question: "How do I add pagination to a React component without a library?",
      answer: "Copy the usePagination hook, call it with your page count, and render its items array: a number becomes a button and \"gap\" becomes an ellipsis. Slice your data with (page - 1) * pageSize to get the rows for the current page.",
    },
    {
      question: "Is infinite scroll or a load more button better?",
      answer: "Load more is usually the safer choice. It keeps the footer reachable, lets people stop when they want, and gives keyboard users a clear control. Infinite scroll suits feeds that people browse without a goal. If you use it, keep a fallback button like the one in the sentinel row here.",
    },
    {
      question: "Is paginated content good for SEO?",
      answer: "Search engines can only find items they can reach through links. Give every page its own URL such as ?page=3, link to it with a normal anchor, and avoid putting the page in a # fragment. The HTML versions here use real links for that reason. Google says it no longer uses rel=\"next\" and rel=\"prev\" as an indexing signal, so they are optional.",
    },
    {
      question: "How do I keep the current page in the URL in React?",
      answer: "Read the page from URLSearchParams on load, write it with history.pushState when it changes, and listen for popstate so the back button updates the view. The useUrlPage hook in the URL sync card does exactly that in about twenty lines.",
    },
    {
      question: "Why does the numbered control always show the same number of buttons?",
      answer: "pageItems returns siblings * 2 + 5 slots once there are enough pages: first, last, the window around the current page and up to two gaps. A fixed width stops the buttons shifting under the pointer as you click through.",
    },
    {
      question: "Should pagination use buttons or links?",
      answer: "Use links when each page has its own URL, as in the HTML versions and the URL sync piece. Use buttons when the page only changes local state, such as a table inside a dialog. Either way, mark the active one with aria-current.",
    },
  ],
  related: [
    "tailwind-table-react-data-table-with-sorting-search-row-selection-and-pagination",
    "react-tabs-with-sliding-underline-segmented-pills-vertical-and-icon-count-variants",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  ],
  tags: ["react pagination", "tailwind pagination", "css pagination", "pagination component", "usePagination hook", "infinite scroll react", "load more button", "pagination html"],
  height: 1560,
  section: true,
  interactive: true,
};

export default meta;
