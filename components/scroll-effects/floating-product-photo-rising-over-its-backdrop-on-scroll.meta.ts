const meta = {
  slug: "floating-product-photo-rising-over-its-backdrop-on-scroll",
  category: "scroll-effects",
  name: "Floating Product Photo Rising Over Its Backdrop on Scroll",
  keyword: "product parallax",
  title: "",
  description: "",
  intro: "A single product feature for a small skincare maker: the bottle's photo sits in a card over a terracotta arch, and as the section passes the card rises and settles while the arch sinks a little the other way. A soft shadow under the card deepens as it reaches the middle of the view, so the product seems to hover. On phones the copy moves below the stage.",
  useWhen: [
    "One hero product deserves a quiet moment of depth on a shop or launch page.",
    "You have a plain product photo, not a cut-out, and still want it to feel lifted off the page.",
  ],
  customize: [
    "Set `LIFT` and `SINK` for how far the product rises and the backdrop sinks; small numbers look more expensive.",
    "Recolour the arch with `--w6prd-clay` and change the number behind the product in the backdrop's span.",
    "Swap the photo for your own; keep the 3 by 4 card so the layout holds.",
  ],
  accessibility: [
    "The arch, the number and the shadow are decorative and hidden; the product photo carries a full description, and reduced motion leaves the card resting over the arch.",
  ],
  faqs: [],
  related: [],
  tags: ["product parallax", "floating product", "product feature", "scroll effect", "ecommerce"],
  height: 640,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The product card rests centred over the arch with its full shadow and does not move.",
  perf: "Two transforms and one opacity per scroll frame from a passive listener, paused when the section is off screen.",
};

export default meta;
