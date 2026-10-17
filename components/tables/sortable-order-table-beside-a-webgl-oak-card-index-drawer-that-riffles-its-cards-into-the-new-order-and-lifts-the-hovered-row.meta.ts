const meta = {
  slug: "sortable-order-table-beside-a-webgl-oak-card-index-drawer-that-riffles-its-cards-into-the-new-order-and-lifts-the-hovered-row",
  category: "tables",
  name: "Sortable Order Table Beside a WebGL Oak Card Index Drawer That Riffles Its Cards into the New Order and Lifts the Hovered Row",
  keyword: "tailwind sortable data table react",
  title: "Sortable React Table with a 3D Card Index Drawer | We.Inc",
  description: "Free sortable React table of shop orders beside a WebGL oak card drawer. Sorting re-files the index cards and the hovered row lifts its card.",
  intro: "A plain, accessible orders table for a small stationery shop sits beside an oak card index drawer on a sunlit desk. Every order has its own ruled index card in the drawer, typed with the customer, the item, the date and the total, stamped with its status and tabbed in a matching colour. Click a column header and the table sorts as any table should, while the drawer re-files to the same order: each card is pulled up out of the pack, carried to its new place and dropped in, front card first, so the whole file riffles like a thumb running through it. Point at a row, or move to it with the keyboard, and its card rises out of the drawer with a little overshoot and the lens racks focus onto it. The drawer is ray marched in raw WebGL 2 with window light falling through glazing bars, soft shadows, light glowing through the thin card stock and a shallow depth of field. On phones the drawer sits above the table, the item and date columns fold away, and without WebGL a layered still of the drawer is drawn instead.",
  useWhen: [
    "An order, booking or inventory list on a shop or studio site where you want the data to stay readable but the page to feel made by hand.",
    "A portfolio or case study that shows off a data feature and needs one memorable interaction rather than a dashboard of charts.",
    "Small tables of about five to ten rows, where every row can have a card that is large enough to read when it is lifted.",
    "A light, warm page where a dark analytics style table would look out of place.",
  ],
  customize: [
    "Change the rows in the `orders` array at the top. Each card is typed from the same row, so the drawer always matches the table. The drawer has room for eight cards, set by the `uCard[8]` uniform and `SLOT_Z` spacing.",
    "Recolour the card tabs and status pills in `STATUS`. The hex values are converted to linear colour for the shader, so pick them as you would for CSS.",
    "Tune the riffle with `RIFFLE_SECONDS`, `RIFFLE_STAGGER` and `RIFFLE_HEIGHT`, and how far a pointed row's card rises with `HOVER_LIFT`. Set `DEMO` to false to stop the self-playing demo.",
    "The sun direction is `L` at the top of the shader and the window shape lives in `gobo`. The oak colours are the two `vec3` values in `oak`, and the desk colours sit in the last branch of `main`.",
    "Change which columns hide on phones by moving the `wide` flag in `columns`, which adds `hidden md:table-cell` to the header and cells.",
  ],
  accessibility: [
    "It is a real table with a caption, column headers with `scope`, and a row header for the order number. Sorting uses buttons inside the headers and `aria-sort` marks the sorted column, so screen readers announce the order without needing the drawer.",
    "Each row can be reached with Tab, and focusing it lifts the matching card exactly as a pointer does. A polite live region says which column is sorted and in which direction.",
    "The canvas is hidden from assistive technology because everything on the cards is already in the table. With reduced motion the cards move straight to their places and the scene is drawn once per change.",
  ],
  faqs: [
    { question: "Is the table usable without the 3D drawer?", answer: "Yes. The drawer only mirrors the table. Sorting, the row highlight and every value live in normal HTML, so you can delete the drawer column and keep a complete sortable table with the same styling." },
    { question: "How does the drawer know the new order?", answer: "The sorted rows are turned into a slot number for each order. When the slots change, every card records where it is, where it needs to go and a start time staggered by its new slot. Each frame works out its depth, how high it is pulled up and how far it leans, and sends those four numbers per card to the shader." },
    { question: "How is the text printed on the cards?", answer: "Once at start up, a 2D canvas draws all eight cards into one tall image: typewriter text in the red channel and the status stamp in the green channel. The shader reads it on the front face of each card and inks it over the ruled lines, so the print bends and lights with the card." },
    { question: "Will it slow down the page?", answer: "The drawer is one full screen pass plus a short lens pass. The canvas is capped at 1.5 device pixels and about one million pixels in total, the render scale drops if frames run long, and drawing stops when the section scrolls out of view or the tab is hidden." },
    { question: "Can I sort by more than one column?", answer: "The `compare` function already breaks ties by order number. For a true multi column sort, keep a list of keys in state instead of one and compare by each in turn; the drawer will follow whatever order the rows end up in." },
  ],
  related: [
    "oak-card-index-box-faq-with-tabbed-question-cards-that-rise-out-and-stand-against-the-open-lid",
    "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce",
    "index-card-checklist-where-a-pencil-draws-each-tick-in-graphite-and-its-eraser-rubs-it-out",
  ],
  tags: ["table", "sortable", "data table", "webgl", "3d", "card index", "orders", "daylight"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
