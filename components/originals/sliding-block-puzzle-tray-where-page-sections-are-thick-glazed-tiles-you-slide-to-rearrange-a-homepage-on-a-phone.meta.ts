const meta = {
  slug: "sliding-block-puzzle-tray-where-page-sections-are-thick-glazed-tiles-you-slide-to-rearrange-a-homepage-on-a-phone",
  category: "originals",
  name: "Sliding Block Puzzle Tray Where Page Sections Are Thick Glazed Tiles You Slide to Rearrange a Homepage on a Phone",
  keyword: "sliding puzzle bento grid react",
  title: "React Sliding Puzzle Bento Grid for a Homepage | We.Inc",
  description: "A tray of thick glazed tiles, each a section of a shop's homepage: slide one and the page on the phone beside it rearranges. Free React and HTML to copy.",
  intro: "A black lacquer tray lies at an angle on a sand-coloured table, with a phone beside it. In the tray are seven thick tiles on a three by five grid: a large photo hero, a tall photo, two wide tiles and three small ones in white, blue and black glaze. Two cells are left empty, so the tiles can slide like the old wooden block puzzles. Press a tile and it runs into the free space next to it. A tile with nowhere to go gives a short shake. The phone shows the same arrangement as a flat homepage for a made-up gelato shop, and its sections move in step with the tiles. Left alone, the piece makes a handful of moves and then takes them back. The table leans slightly towards the pointer, and on a narrow screen tray and phone shrink together.",
  useWhen: [
    "You are showing a bento-style layout and want to make the point that its cells can be rearranged.",
    "A page about layout tools needs something a visitor can play with for ten seconds and understand.",
    "You want a sliding puzzle with mixed tile sizes and correct collision rules as a starting point for a small game.",
    "A product story needs one picture that shows a model of a page and the page itself side by side.",
  ],
  customize: [
    "`tiles` holds each tile's starting column and row (`c`, `r`), its width and height in cells (`w`, `h`) and its `glaze`. Leave at least one cell empty or nothing can move.",
    "`COLS` and `ROWS` set the grid and `P` the size of one cell in pixels. The tray, the phone and the overall drawing are all derived from them.",
    "`GLAZE` gives every finish a `face` and an `edge` colour. The edge colour is used for the stacked shadow that makes a tile look thick, so keep it darker than the face.",
    "`Face` draws what is printed on a tile, by `id`. The phone reuses it at the scale `K`.",
    "`RX` and `RZ` are the tilt of the table. Set `RZ` to 0 for a square-on view.",
  ],
  accessibility: [
    "Every tile is a `button` labelled with its name and its current column and row.",
    "Arrow keys slide the focused tile one cell in that direction when the way is clear. Enter or Space slides it in the first free direction.",
    "A blocked move is announced in words as well as shown by the shake, so it is not signalled by motion alone.",
    "Reduced motion removes the lean, the shake and the self-running demo. Tiles then jump to their new cell.",
  ],
  faqs: [
    {
      question: "How does it decide whether a tile can move?",
      answer: "The `free` function shifts the tile's rectangle one cell in the asked direction, checks it is still inside the grid, and then checks it does not overlap any other tile's rectangle. Because it works on rectangles, tiles of any size are handled by the same few lines.",
    },
    {
      question: "Why can the big hero tile hardly ever move?",
      answer: "A two by two tile needs two empty cells side by side along one of its edges. With only two free cells on the board that takes some shuffling, exactly as in a wooden block puzzle. Add a third empty cell by removing a small tile if you want it to move more freely.",
    },
    {
      question: "How do the tiles get their thickness?",
      answer: "Each tile has eight one-pixel box shadows stacked directly below it in its edge colour, then a soft dark shadow under those. Because the whole table is tilted back in 3D, that flat stack reads as the front wall of a thick tile.",
    },
    {
      question: "Does the self-running demo ever leave the page scrambled?",
      answer: "No. It records every move it makes and, after six, plays them back in reverse order, so it always returns to the starting layout before it begins again. It stops for good as soon as a visitor presses a tile.",
    },
    {
      question: "Can I drag a tile?",
      answer: "With a mouse you can press a tile, pull in a direction and let go, and it will slide one cell that way. On touch screens a tap is used instead, so the page can still be scrolled with a finger on the tray.",
    },
  ],
  related: [
    "page-section-blocks-in-resin-ceramic-and-anodised-metal-that-lift-out-of-a-stack-to-reorder-a-live-page",
    "click-to-edit-page-with-inlaid-pieces-you-lift-out-of-lit-sockets-and-turn-over-in-the-air",
    "typesetters-forme-where-page-sections-are-locked-up-as-metal-type-in-a-steel-chase-and-pulled-as-a-blue-proof",
  ],
  tags: ["originals", "sliding puzzle", "bento grid", "sections", "tiles", "layout", "phone"],
  height: 700,
  interactive: true,
};

export default meta;
