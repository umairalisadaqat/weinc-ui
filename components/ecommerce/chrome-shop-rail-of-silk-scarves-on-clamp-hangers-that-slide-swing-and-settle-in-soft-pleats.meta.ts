const meta = {
  slug: "chrome-shop-rail-of-silk-scarves-on-clamp-hangers-that-slide-swing-and-settle-in-soft-pleats",
  category: "ecommerce",
  name: "Chrome Shop Rail of Silk Scarves on Clamp Hangers That Slide, Swing and Settle in Soft Pleats",
  keyword: "product carousel with cloth physics",
  title: "React Product Carousel with Cloth Physics | We.Inc",
  description: "Product carousel on a canvas: printed silk scarves hang in pleats from a chrome rail and swing when you slide them along. Free React and HTML code to copy.",
  intro: "A polished rail runs across a warm white wall on two ceiling rods. Seven scarves hang from it, each gripped along its top edge by a walnut clamp on a wire hook. The prints are photographs, mapped onto cloth that falls in three soft pleats and flares toward the hem, with a dark face and a bright face on every fold and a rolled edge all round. Drag sideways and the hangers run along the rail with you. When you let go the row coasts to the nearest scarf and everything swings: the hooks rock on the rail and the silk trails a beat behind them, so the hem is still moving after the clamp has stopped. Passing the pointer through a scarf ruffles it. The caption names the scarf in front. At phone width the scene scales so one scarf sits in the middle with a slice of its neighbours either side.",
  useWhen: [
    "A fashion or accessories shop wants to browse a small range the way you would in the shop, by pushing hangers along a rail.",
    "A collection launch has six to ten printed pieces and the prints themselves are the selling point.",
    "A textile designer or print studio needs a homepage piece that shows patterns on moving cloth instead of flat swatches.",
    "A product page offers one item in several prints and wants the print picker to be the hero.",
  ],
  customize: [
    "The `scarves` list holds a name, alt text, a short note, a price, a print address and a `tone`. Square or portrait prints with bold colour work best. The list can be any length from five up, since the row wraps round.",
    "`TOP_W`, `HEM_W` and `LENGTH` shape the cloth: bring `HEM_W` closer to `TOP_W` for a narrow straight fall, or raise `LENGTH` for a long stole. `PLEATS` is how many folds run across it.",
    "`GAP` is the spacing between hangers. `CROP` is the share of each print's width that is used, taken from the middle.",
    "The clamp's wood is the `wood` gradient and the rail and hook colours are the stops in `chrome`. The wall is `bg-[#efece6]` with a radial gradient over it.",
    "In `step`, the numbers 34 and 1.25 are the hanger's swing rate and damping, and 30 is how firmly the silk follows the clamp. Lower that last one for heavier, lazier cloth.",
  ],
  accessibility: [
    "Two labelled buttons slide the rail one scarf at a time, and the left and right arrow keys do the same while focus is inside the section. Dragging is never the only way to move.",
    "The canvas is hidden from assistive technology. In its place is a visually hidden list of the seven prints as real images, each with alt text, and the caption gives the name, note and price of the scarf in front as text.",
    "The caption only becomes a live region after someone has used the controls, so the automatic slide does not interrupt a screen reader every few seconds.",
    "With reduced motion nothing swings and nothing slides by itself. The scarves hang straight, and the buttons move the row in a single step.",
  ],
  faqs: [
    {
      question: "How is a photograph made to hang like cloth on a 2D canvas?",
      answer: "The scarf is a grid of 26 columns by 4 rows. For every frame the code works out where each grid point is, then draws each cell of the photo with `setTransform` so that three of its corners land on three of the cell's corners. Cells are small enough that the fourth corner is never far off, and each is drawn a few percent oversize to hide the joins.",
    },
    {
      question: "Where do the pleats and the sheen come from?",
      answer: "One cosine across the width, plus a faster one at a third of the strength, stands in for how far each column of cloth is from you. Its slope decides the light: columns turning away get a dark wash, columns at one particular angle get a pale one, which is the narrow highlight silk has. Both grow toward the hem, where the folds are deepest.",
    },
    {
      question: "Why does the hem keep moving after the hanger stops?",
      answer: "Each scarf has two angles. One is the hanger, a pendulum on the rail that is shoved by the rail's acceleration. The other is the silk, a second pendulum tied to the first by a soft spring. The cloth is drawn bending from the first angle at the clamp to the second at the hem.",
    },
    {
      question: "Does drawing photos from another site onto a canvas cause problems?",
      answer: "Not here. Cross-origin images can be drawn freely; the restriction only applies if you try to read pixels back out, which this component never does. If you want to export the canvas as an image you would need to serve the prints with CORS headers and set `crossOrigin` on each image.",
    },
    {
      question: "Can a click on a scarf open its product page?",
      answer: "Yes. In the `up` handler, a release with `s.moved` under a few pixels is a tap, not a drag. Work out which scarf is under the pointer the same way the ruffle code does, then navigate or bring it to the centre with `go`.",
    },
  ],
  related: ["shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes", "paper-shopping-bag-that-catches-boxed-products-bulges-leans-and-flexes-its-rope-handles", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table"],
  tags: ["canvas", "ecommerce", "carousel", "cloth", "physics", "drag", "fashion"],
  height: 690,
  section: true,
  interactive: true,
};

export default meta;
