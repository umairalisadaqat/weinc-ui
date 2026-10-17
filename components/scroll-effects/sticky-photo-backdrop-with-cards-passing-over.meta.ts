const meta = {
  slug: "sticky-photo-backdrop-with-cards-passing-over",
  category: "scroll-effects",
  name: "Sticky Photo Backdrop With Cards Passing Over",
  keyword: "sticky background scroll",
  title: "",
  description: "",
  intro: "A walking holiday itinerary where a coastal photo stays pinned with position: sticky while four day cards scroll up across it. The photo also eases from a slight zoom to its natural size as you go, so the backdrop feels alive without moving sideways. It gives the fixed-background look without background-attachment: fixed, and on phones the cards take the full width.",
  useWhen: [
    "An itinerary, process or menu that reads best as cards over one strong photograph.",
    "You want the classic fixed backdrop look and it must also work on iPhones.",
  ],
  customize: [
    "Change `--w6stk-gap` to show more or less of the backdrop and title before the first card arrives.",
    "Set `ZOOM` to 0 for a perfectly still photo, or 0.2 for a stronger ease-out.",
    "Swap the photo and adjust the shade gradient on `.w6stk-shade` so the title keeps its contrast.",
  ],
  accessibility: [
    "The cards are an ordered list with real headings, the photo has a true description, and the dark shade keeps white title text readable over bright sky.",
  ],
  faqs: [],
  related: [],
  tags: ["sticky background", "position sticky", "cards over image", "itinerary", "scroll effect"],
  height: 620,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The photo stays at its natural size and the cards still scroll over it.",
  perf: "Sticky positioning is handled by the browser; the script only writes one scale per scroll frame and stops off screen.",
};

export default meta;
