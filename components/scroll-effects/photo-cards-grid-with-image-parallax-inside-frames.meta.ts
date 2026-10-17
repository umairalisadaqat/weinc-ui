const meta = {
  slug: "photo-cards-grid-with-image-parallax-inside-frames",
  category: "scroll-effects",
  name: "Photo Cards Grid With Image Parallax Inside Frames",
  keyword: "image parallax cards",
  title: "",
  description: "",
  intro: "A two-column class listing for a pottery studio where each photo sits in a rounded frame slightly taller than it looks. As a card travels through the scroller, its photo slides the other way inside the frame, so the grid gains depth while the cards themselves keep to the normal scroll. The second column starts lower for a staggered rhythm, and on phones the cards stack into one column.",
  useWhen: [
    "A course list, menu or shop grid where photos carry the sale and a little depth helps them feel tactile.",
    "You want parallax that never moves text, only the pictures behind their own edges.",
  ],
  customize: [
    "Change `SHIFT` to set the drift; keep it below the 12% of spare photo set by `top: -12%` and `height: 124%` on `.w6crd-img`.",
    "Edit the `CLASSES` array (or each `li`) to swap titles, prices and photos; every photo keeps the 4 by 3 frame.",
    "Recolour with `--w6crd-paper` and `--w6crd-accent`.",
  ],
  accessibility: [
    "Each card is one link with a real heading and true alt text on its photo, and the frame never clips the focus ring because the ring sits on the link outside it.",
  ],
  faqs: [],
  related: [],
  tags: ["image parallax", "card grid", "scroll effect", "photo cards"],
  height: 620,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Each photo sits still and centred in its frame, so the grid reads as a plain card list.",
  perf: "A passive scroll listener writes one transform per visible photo per frame and stops when the grid leaves the screen.",
};

export default meta;
