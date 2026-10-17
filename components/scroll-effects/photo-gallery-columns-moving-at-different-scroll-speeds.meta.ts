const meta = {
  slug: "photo-gallery-columns-moving-at-different-scroll-speeds",
  category: "scroll-effects",
  name: "Photo Gallery Columns Moving at Different Scroll Speeds",
  keyword: "parallax gallery",
  title: "",
  description: "",
  intro: "A print shop's landscape gallery laid out in three columns of portrait photos, where the middle column runs ahead of the scroll while the outer two lag slightly behind. The columns slide past each other like shelves at different distances, and the staggered start keeps the grid from looking like a table. Phones get two columns.",
  useWhen: [
    "A portfolio, print shop or lookbook with many photos of the same shape.",
    "You want a gallery that feels alive while scrolling without any hover tricks.",
  ],
  customize: [
    "Change each column's `data-speed` (or `speed` in `COLUMNS`); values between -0.3 and 0.2 keep the columns from drifting apart.",
    "Adjust the middle column's `margin-top` to change the stagger at rest.",
    "Swap photos in each list; keep a shared `aspect-ratio` so the columns stay even.",
  ],
  accessibility: [
    "Photos sit in plain lists with true alt text, and reduced motion leaves the columns in their staggered resting layout.",
  ],
  faqs: [],
  related: [],
  tags: ["parallax gallery", "photo grid", "masonry", "scroll effect", "portfolio"],
  height: 640,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The columns keep their staggered starting layout and scroll together as one grid.",
  perf: "Three column transforms per scroll frame from a passive listener; nothing runs while the gallery is off screen.",
};

export default meta;
