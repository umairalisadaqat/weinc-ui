const meta = {
  slug: "medium-format-contact-sheet-gallery-where-a-red-grease-pencil-circles-the-keepers-and-the-last-pick-lands-as-a-work-print",
  category: "galleries",
  name: "Medium Format Contact Sheet Gallery Where a Red Grease Pencil Circles the Keepers and the Last Pick Lands as a Work Print",
  keyword: "contact sheet gallery react",
  title: "React Contact Sheet Gallery with Pencil Circles | We.Inc",
  description: "Contact sheet gallery of square frames on film strips: red wax circles ring your picks and the last lands beside as a work print. Free React and HTML code.",
  intro: "A thumbnail gallery laid out the way an editor reads a roll: four strips of three square negatives contact printed onto one glossy black sheet, with the film stock and frame numbers along the rebates and a typed job label taped to the bottom. Click a frame and a red china marker ring is scrawled round it, slightly different each time, running over the edge of the strip like the real thing. The frame circled last arrives as a bordered work print next to the sheet, captioned with its number and its place among the keepers. Click a circled frame again to rub the mark off. Two frames arrive struck through as rejects. On wide screens the print sits to the right of the sheet with the pencil lying under it, and on phones it drops below and overlaps the lower margin.",
  useWhen: [
    "A photographer portfolio wants to show the selection process and the outtakes, with one picture large at a time.",
    "A client proofing page needs people to mark favourites from a shoot before retouching starts.",
    "A magazine or studio about page wants a gallery with more character than a grid of rounded thumbnails.",
    "A case study shows several options that were considered and which ones were chosen.",
  ],
  customize: [
    "`frames` is the roll. Each entry has a square `photo` address, a `tone` shown while it loads and the `alt` text. Keep the count a multiple of `PER_STRIP`.",
    "`GREASE` sets the wax colour for rings, slashes and the pencil tip. Yellow `#f5c518` and white `#f4f1ea` are the other colours editors used.",
    "`START`, `REJECTS` and `DEMO` are lists of frame positions counted from zero: circled on load, struck through, and circled by the idle demo.",
    "For colour film remove `grayscale` from both `img` class lists and change `STOCK` to a colour negative name of your own.",
    "The wobble of the line is `scale=\"2.6\"` on the displacement step of the `csgp-wax` filter, and how much it skips is the `-2.6` in the colour matrix.",
  ],
  accessibility: [
    "Every frame is a `button` with `aria-pressed`, labelled with its number and a description of the picture, so the sheet can be worked with Tab and Space.",
    "The large print carries the full `alt` text. The thumbnails use an empty `alt` because the button label already describes them.",
    "A visually hidden live region announces which frame was printed and how many are circled.",
    "With reduced motion the rings appear complete, the print swaps without sliding and the demo does not run.",
  ],
  faqs: [
    {
      question: "How is the grease pencil line made to look like wax?",
      answer: "Each ring is one SVG path of 65 points, generated from the frame number so no two match. An SVG filter pushes the stroke around with fractal noise so the edge wobbles, then multiplies it by a second, finer noise so the line breaks up where a waxy pencil would skip on glossy paper. Drawing it is a change of `pathLength` from 0 to 1.",
    },
    {
      question: "Can I read which frames were picked?",
      answer: "The `picked` state is an array of frame positions in the order they were circled, and `shown` is the one on the print. Pass them to a parent or post them from a submit button to use the sheet as a real proofing form.",
    },
    {
      question: "Why are the frames square and the strips three long?",
      answer: "It follows 120 roll film shot at six by six centimetres: twelve pictures a roll, cut into strips of three so four of them fit an eight by ten sheet of paper. For 35mm change `PER_STRIP` to six and give the frame buttons `aspect-[3/2]`.",
    },
    {
      question: "Are the photos really black and white?",
      answer: "They are requested as ordinary square crops and turned grey in the browser with the `grayscale` and `contrast` utilities, so any colour picture can go on the sheet and still look like part of one roll.",
    },
    {
      question: "Does the demo fight with a visitor who is clicking?",
      answer: "No. Any click on a frame stamps the time, and the timer that circles frames by itself does nothing until eight seconds have passed without one. It also never keeps more than three rings of its own on the sheet.",
    },
  ],
  related: ["light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies", "linen-archive-box-photo-gallery-whose-lid-opens-into-an-easel-for-loose-prints", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table"],
  tags: ["contact sheet", "gallery", "photography", "film", "proofing", "svg", "black and white"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
