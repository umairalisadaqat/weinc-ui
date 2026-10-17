const meta = {
  slug: "open-hardback-long-read-article-header-in-ray-marched-morning-sun-on-linen-where-scrolling-turns-a-curling-page-onto-a-gilt-drop-cap",
  category: "content",
  name: "Open Hardback Long Read Article Header in Ray Marched Morning Sun on Linen Where Scrolling Turns a Curling Page onto a Gilt Drop Cap",
  keyword: "react article header webgl",
  title: "Long Read Article Header with a Turning Book Page | We.Inc",
  description: "Free React article header: an open hardback on linen in WebGL morning sun. Scroll and one page curls over to reveal a gilt drop cap.",
  intro:
    "This is the opening of a long article, built around an open cloth hardback lying on a linen tablecloth in low morning sun. The chapter title, deck, author and reading time sit above the book in large serif type as real HTML. One leaf of the book stands in the air, curled back on itself, with sun coming through the paper so the print on its other side shows faintly. Scroll over the header and the leaf follows the wheel or your finger, turning over onto the left page and settling with a small bounce, which uncovers the chapter opening and its gold drop cap as the light reaches it. Scroll back and it returns. The book, cloth, shadows and window light are ray marched in one fragment shader, and the printed pages are drawn into a texture from the text in the file. On a phone the book shrinks to the full width under the title and a button below it turns the page for anyone who would rather tap.",
  useWhen: [
    "A magazine or essay site wants the first screen of a feature to feel like opening a printed book rather than a blog template.",
    "A publisher is excerpting a chapter and wants the page itself, with its folio and running head, to be part of the header.",
    "A long read needs one striking moment above the fold while the title stays crisp, selectable text for search and screen readers.",
    "You have room for one WebGL canvas on the page and the article below it is plain HTML.",
  ],
  customize: [
    "Edit the `article` object for the kicker, title, deck, author and reading time. The same title is printed on the chapter opening page inside the book.",
    "The four printed pages come from the `pages` object: `left`, `front`, `back` (an epigraph) and `opening`, whose first letter becomes the gold drop cap.",
    "`START_P` sets how far the leaf has turned on load, and the `DEMO` list holds the seconds and targets of the idle turn that plays until someone scrolls.",
    "Scroll sensitivity is the `650` in `nudge`: lower it to turn the page with less scrolling. The spring that carries the paper is `13 * (tgt - st.p) - 4.6 * st.v` in `step`.",
    "The cloth of the boards is `vec3(0.13,0.2,0.19)` in the shader and the linen is `vec3(0.79,0.75,0.67)`; the window that shapes the sunlight is the `box2` call inside `sun()`.",
  ],
  accessibility: [
    "The title is an `h2` with the kicker, deck and byline as ordinary text, so the header reads correctly with the canvas missing.",
    "The canvas is `aria-hidden`. The epigraph and the opening paragraph printed in the book are repeated in a visually hidden block.",
    "The Turn the page button does the same job as scrolling, uses `aria-pressed` and has a visible focus ring, so keyboard users get the full effect.",
    "With reduced motion the book is drawn once, open at the chapter opening, and the button switches pages without animation.",
  ],
  faqs: [
    {
      question: "Does scrolling get trapped inside the header?",
      answer:
        "No. Wheel and touch listeners are passive and never cancel the event, so the page keeps scrolling normally. The header only reads how far you moved and turns the leaf by that amount while it is on screen.",
    },
    {
      question: "How is the curl of the page made?",
      answer:
        "The leaf is a circular arc hinged at the gutter. Its hinge angle follows the progress value, its curvature grows in the middle of the turn and with speed, so the free edge trails like paper pushing through air, and it twists slightly so the corner nearest you leads.",
    },
    {
      question: "Why does text show through the standing page?",
      answer:
        "When the sun is behind the leaf the shader lets some light pass through the paper and darkens it where the other side is printed. It is the same show-through you see holding a book page up to a window.",
    },
    {
      question: "Can I use a real chapter of my own?",
      answer:
        "Yes. Replace the strings in `pages`. The text is set justified into the texture by `setBody`, so a paragraph of roughly the same length fills the page. Much longer text will run past the bottom margin, so trim it.",
    },
    {
      question: "What happens on a slow laptop or a browser without WebGL 2?",
      answer:
        "The render scale drops by steps if the frame rate stays under forty, and the loop stops when the header is off screen. Without WebGL 2 a still book set in CSS with real text takes the canvas's place.",
    },
  ],
  related: [
    "cloth-bound-book-spine-chapter-menu-where-the-chosen-volume-leaves-the-shelf-and-opens-at-its-chapter",
    "magazine-stack-gallery-that-fans-out-across-the-table-and-lifts-the-chosen-issue-to-face-you",
  ],
  tags: ["article header", "book", "page turn", "webgl", "scroll", "drop cap", "editorial"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
