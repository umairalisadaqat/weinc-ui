const meta = {
  slug: "bento-grid-collection-with-ten-tailwind-layouts-grid-template-areas-and-copyable-code",
  category: "feature-sections",
  name: "Bento Grid Layouts: 10 Tailwind Designs with Copyable Code",
  keyword: "bento grid",
  title: "Bento Grid: 10 Tailwind Layouts with Copyable Code | We.Inc",
  description: "Free bento grid layouts in Tailwind: feature, portfolio, stats and product designs. Copy Tailwind HTML, React JSX or plain CSS built on grid-template-areas.",
  intro: "Ten complete bento grids, each filled with believable content: a product analytics feature section, a designer portfolio, a month of shop numbers, a headphones product page, a dark developer tool, an about-me page, a café homepage, a company and hiring section, changelog highlights and a mobile app launch. Every grid is placed with named areas rather than a pile of col-span classes, and under each preview three small maps show exactly how the tiles rearrange on phones, from 768px and from 1024px. Copy the layout as Tailwind HTML, as a React component, or as plain CSS with grid-template-areas and two media queries. On a phone every grid becomes one column in a sensible reading order.",
  useWhen: [
    "A landing page needs a feature section that shows four or five ideas at different weights instead of a uniform three-column grid.",
    "You want a portfolio or about page where one large tile introduces you and smaller tiles carry projects, links and facts.",
    "A dashboard or report page needs one headline number with supporting figures around it.",
    "You are building a product page and want an image tile, spec tiles and a buy tile in one block.",
    "You prefer to see the whole layout as a picture in the code, which grid-template-areas gives you, rather than counting spans.",
  ],
  customize: [
    "Move a tile by editing the area strings. In lg:[grid-template-areas:'a_a_b_c'_'a_a_d_e'] each quoted group is a row and each letter a column; repeat a letter to make that tile wider or taller.",
    "Change the number of columns with lg:grid-cols-4 or md:grid-cols-2, and make sure every row in the matching area string has that many names.",
    "Change the minimum tile height in auto-rows-[minmax(150px,auto)]. Tiles still grow taller when their content needs it.",
    "Change the order on phones by reordering the base string, for example [grid-template-areas:'c'_'a'_'b'] puts tile c first without moving it in the HTML.",
    "Change spacing with gap-3 on the grid and rounding with rounded-2xl on the tiles; keep one radius across a grid so it reads as a single object.",
  ],
  accessibility: [
    "Tiles are articles and links in source order, so screen readers and keyboard users move through them in the order of the HTML. If you reorder tiles visually with the area strings, keep the HTML order close to the reading order on desktop.",
    "Decorative shapes, charts and the phone mock are marked aria-hidden; the figures they illustrate are written out as text in the same tile.",
    "The layout switcher is a tablist with arrow key, Home and End support, and every link and button has a visible focus ring and is at least 40px tall.",
  ],
  faqs: [
    {
      question: "What is a bento grid?",
      answer: "A layout of rounded tiles of different sizes packed into one rectangle, named after the compartments of a bento box. One or two large tiles carry the main message and smaller ones add detail, which gives a page hierarchy without long paragraphs.",
    },
    {
      question: "How do I make a bento grid in Tailwind?",
      answer: "Make a grid container, set the columns per breakpoint with md:grid-cols-2 and lg:grid-cols-4, and size tiles either with col-span and row-span classes or, as here, with arbitrary [grid-template-areas:...] on the grid and [grid-area:a] on each tile. Areas keep the shape readable in one place.",
    },
    {
      question: "How does grid-template-areas work?",
      answer: "Each quoted string is one row and each word in it names the area that fills that column. A name repeated across columns or rows makes the area span them, as long as the shape stays a rectangle. A tile joins an area with grid-area: name. A dot can mark an empty cell.",
    },
    {
      question: "How do I make a bento grid responsive?",
      answer: "Define a one-column area list for phones, then redefine grid-template-columns and grid-template-areas inside media queries for wider screens. Only the grid rules change; the tiles keep their grid-area names, so no markup moves.",
    },
    {
      question: "Why does my grid area not show up?",
      answer: "Usually because a row has a different number of names from the others, or an area forms an L shape. Either one makes the whole grid-template-areas declaration invalid, and the browser ignores it and places tiles automatically.",
    },
  ],
  related: [
    "moulded-pulp-bento-tray-feature-section-in-webgl-where-a-glass-loupe-a-brass-key-a-spool-and-a-folded-card-lift-into-focus",
    "css-gradient-border-collection-with-rounded-corners-animated-glow-and-copyable-css-or-tailwind",
    "html-form-examples-collection-with-every-input-type-and-copyable-html-css-or-tailwind",
  ],
  tags: ["bento grid", "bento grid design", "tailwind bento grid", "bento layout css", "grid-template-areas", "bento feature section", "bento portfolio"],
  height: 1180,
  section: true,
  interactive: true,
};

export default meta;
