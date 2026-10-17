const meta = {
  slug: "grid-thumbnail-grows-into-the-detail-photo",
  category: "navigation",
  name: "Grid Thumbnail Grows Into the Detail Photo",
  keyword: "shared element transition",
  title: "",
  description: "",
  intro: "A pottery studio shop where opening a piece makes its small grid photo grow and travel into the large photo on the detail page, while the rest of the page crossfades. Going back shrinks it into its card again. Card and detail photos share one shape, so the move is a single even scale with nothing stretched.",
  useWhen: [
    "A product, project or recipe grid where each card opens a detail page led by the same photo.",
  ],
  customize: [
    "Change `MS` in the script to make the photo travel faster or slower.",
    "Keep the `aspect-ratio: 3 / 2` rule on `.w6mph img` identical for cards and the detail photo if you change the shape.",
    "Swap `--w6mph-clay` and `--w6mph-bg` on `.w6mph` for another shop palette.",
  ],
  accessibility: [
    "Opening a piece moves focus to its name; going back returns focus to the card that was opened, so keyboard users keep their place.",
    "With reduced motion the views switch instantly with no photo movement.",
  ],
  faqs: [],
  related: [],
  tags: ["shared element transition", "view transitions", "image morph", "product grid", "detail page"],
  height: 640,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "The grid and the detail page swap at once, with the photo already in its final place.",
  perf: "One captured photo moves by transform for about half a second while the page crossfades; idle cost is zero.",
};

export default meta;
