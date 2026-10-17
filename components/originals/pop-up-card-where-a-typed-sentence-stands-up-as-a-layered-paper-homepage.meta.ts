const meta = {
  slug: "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage",
  category: "originals",
  name: "Pop-Up Card Where a Typed Sentence Stands Up as a Layered Paper Homepage",
  keyword: "css 3d pop-up card react",
  title: "React CSS 3D Pop-Up Card That Builds a Homepage | We.Inc",
  description: "Pop-up card in CSS 3D: a typed sentence lies on the table and a paper homepage stands up from the fold in die-cut layers. Free React and HTML code to copy.",
  intro: "A folded card on a dark table. The leaf that lies flat carries one typed sentence about a bakery. The leaf that stands up is that bakery's homepage, and it is built the way a real pop-up is built: the menu and headline are printed on the back leaf, while the arched photograph, the row of three products, the pickup note and the blue button are separate die-cut pieces standing in front of it at four depths, each held by a paper tab that stays level with the table. Press the card down and every piece folds flat on the same parallelogram hinge, the sentence clears, and when you let go the words type back as the page rises. The card turns a little toward the pointer so the gaps between layers show. On a phone the whole scene scales down as one picture and the button under it does the folding.",
  useWhen: [
    "The first screen of a site builder, agency or studio page, where the pitch is that a short brief turns into a real page.",
    "A launch or waitlist page that wants one object to look at and no feature grid.",
    "A case study opener: put the client's brief on the flat leaf and their finished homepage on the standing one.",
    "An about page for a paper goods, stationery or print shop that wants its own homepage shown as a card.",
  ],
  customize: [
    "All words and photographs live in the `site` object at the top: `sentence`, `brand`, `links`, `headline`, `cta`, `note`, `hero` and `tiles`.",
    "Each standing piece is a `Flat` with `x`, `w`, `h` and `d`. `d` is how far in front of the fold it stands, so raising it from 52 to 80 pushes the photograph forward. Give the matching `Cast` and `Foot` the same numbers so the shadows follow.",
    "`OPEN` is the resting angle between the leaves. 97 leans the page back slightly like a screen; 90 stands it square.",
    "The camera is the `rotateX(-27deg) rotateY(...)` on the card. A flatter view such as -18 shows more of the page and less of the sentence.",
    "Spring feel is the `58` and `8.2` in the frame loop. Raise 8.2 to 14 to take out the wobble when the card lands.",
  ],
  accessibility: [
    "The sentence is real text with a screen reader copy that never changes, so the letter by letter typing is not announced as a stream of fragments.",
    "The headline is an `h2` and both product photographs and the hero carry alt text; cast shadows, tabs and card edges are hidden from assistive technology.",
    "Folding is available without a pointer through the pill button, which reports its state with `aria-pressed` and has a visible focus ring.",
    "With reduced motion the card is drawn standing, the sentence is complete, the sway stops and the caret does not blink.",
  ],
  faqs: [
    {
      question: "How do the layers stay upright while the card folds?",
      answer: "Each piece is rotated by the same angle as the back leaf, so it stays parallel to it, and its paper tab is rotated by the opposite angle, so it stays parallel to the table. Those two rules are the parallel fold used in real pop-up cards, and they hold at every angle because a single CSS variable, `--a`, drives all of the transforms.",
    },
    {
      question: "Is this drawn on a canvas?",
      answer: "No. Every leaf, tab and die-cut piece is an ordinary element inside a `preserve-3d` group, which is why the homepage text stays sharp and selectable. One animation frame loop runs a spring and writes three CSS variables.",
    },
    {
      question: "Can the standing page be a real, clickable page?",
      answer: "The pieces are normal markup, so you can swap the spans for links and buttons. Keep in mind that dragging on the scene folds the card, so give any live control its own `button` or `a` element; pointer presses that start on a button are ignored by the drag handler.",
    },
    {
      question: "Why does the sentence disappear when the card is pressed down?",
      answer: "The number of typed characters is tied to the fold angle. Below about 20 degrees none are shown and by 72 degrees the sentence is whole, so the words and the page always arrive together whether the card moves by itself or under your finger.",
    },
    {
      question: "How do I add a fifth layer?",
      answer: "Add another `Flat` after the existing ones with a larger `d`, keep it shorter than the pieces behind it so they remain visible, and list one or two `tabs` positions measured from its left edge. Add a `Foot` on the base leaf at the same `x` and `d`.",
    },
  ],
  related: ["layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters", "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table"],
  tags: ["pop-up", "paper", "css 3d", "card", "homepage", "fold", "originals"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
