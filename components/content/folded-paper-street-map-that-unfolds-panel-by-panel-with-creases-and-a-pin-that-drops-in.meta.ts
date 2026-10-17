const meta = {
  slug: "folded-paper-street-map-that-unfolds-panel-by-panel-with-creases-and-a-pin-that-drops-in",
  category: "content",
  name: "Folded Paper Street Map That Unfolds Panel by Panel with Creases and a Pin That Drops In",
  keyword: "react folding map animation",
  title: "React Folding Map Animation with a Drop Pin | We.Inc",
  description: "Location section built as a pocket street plan: paper panels unfold on springs, keep their creases, and a red pin drops in. Free React and HTML to copy.",
  intro: "A pocket street plan lying on a blue table. It starts folded to the size of its red cover, then the four columns swing open like a concertina and the lower half of each one flips down in turn, until an eight panel sheet is lying there with every fold still slightly raised and shaded. The plan itself is drawn in the browser: two street grids that meet at a river, yellow avenues that bridge it, three parks, a railway, a harbour with piers and a ferry line, a title box, grid letters and a scale bar. A glossy red pin then falls onto one of four numbered places, wobbles on its steel point and moves on every few seconds. On a phone the whole sheet is scaled down as one object and the number buttons sit underneath it.",
  useWhen: [
    "A cafe, shop or studio wants its find us section to feel like a keepsake and has no need for turn by turn directions.",
    "A festival, market or campus page has to point at a handful of spots on a made up or simplified plan.",
    "A travel or hotel site wants a neighbourhood guide where each recommendation gets its own moment under the pin.",
    "A game or story site needs an invented town shown as a believable printed object.",
  ],
  customize: [
    "The `places` list sets where the pin can go: `x` and `y` are fractions of the open sheet from its top left corner, and `name` is printed under the numbered dot as well as read out in the caption.",
    "Everything printed on the sheet is in `drawPlan`. Change the two `grid(...)` calls for street angle and block size, the `avenues` list for the yellow roads, and the `park(...)` calls for green space.",
    "`COLS`, `PW` and `PH` set how many columns there are and the size of one panel. `REST` is the angle each fold keeps when open: raise it for a sheet that looks freshly unfolded, set it to 0 for one pressed flat.",
    "`RED` colours the cover. The table is `bg-[#1c3fb0]` plus the radial gradient over it, and `TIP` and `TURN` are the camera angles.",
    "The pin's speed is the `duration: 0.36` on its fall, and the pause between places is the `3400` in the interval.",
  ],
  accessibility: [
    "Each place has a real button with `aria-pressed` and a label naming where the pin will go, and the fold control is a button with `aria-expanded`, so nothing depends on dragging or hovering.",
    "The caption is an `aria-live` region that reads out the number, name and note of the pinned place, which is the only route to that information for someone who cannot see the drawing.",
    "The drawn plan is decoration from an assistive technology point of view. If your version carries a real address, add it as text next to the component.",
    "With reduced motion the sheet is shown open with the pin already standing on a place, and choosing another place moves it without the fall.",
  ],
  faqs: [
    {
      question: "How are the folds built so the panels do not drift apart?",
      answer: "Each column is a child of the one before it and turns about the edge they share, so a fold can never open a gap. The lower panel of a column hangs from the bottom edge of the upper one in the same way. Everything sits in `preserve-3d`, and each panel has a front and a back with `backface-visibility: hidden`.",
    },
    {
      question: "Does this use a map service or map tiles?",
      answer: "No. The plan is painted once onto an off screen canvas with ordinary 2D drawing calls, turned into a single image, and shown through eight windows using `background-position`. There is no key, no network request and no licence to think about.",
    },
    {
      question: "Why does the open sheet still look creased?",
      answer: "Three things. Every column keeps a few degrees of its fold, set by `REST`, so the sheet rests as shallow ridges and valleys. The `creases` function adds a soft shadow beside each fold and lightens the panels that lean toward the lamp. And the drawing itself has pale flecks rubbed along each fold line, the way ink wears off real paper.",
    },
    {
      question: "How does the pin stand upright on a tilted sheet?",
      answer: "The pin lives inside the panel it lands on. It is first turned back by the camera's `TURN` so it faces you, then stood up with `rotateX(-80deg)` about its point. The fall is a `z` animation with an accelerating curve, and the wobble is a short rotation about the point that starts the moment it lands.",
    },
    {
      question: "Can I show my real street instead of an invented town?",
      answer: "Yes, as long as you draw it yourself. Replace the shapes in `drawPlan` with your own roads and landmarks, or draw an image you own onto the canvas at that point. Do not paste in a screenshot from a mapping product: those are not free to republish.",
    },
  ],
  related: ["paper-folding-fan-menu-that-unfolds-from-a-brass-rivet-with-links-on-the-pleats", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["map", "paper", "fold", "3d", "pin", "location", "canvas"],
  height: 755,
  section: true,
  interactive: true,
};

export default meta;
