const meta = {
  slug: "paper-shopping-bag-that-catches-boxed-products-bulges-leans-and-flexes-its-rope-handles",
  category: "ecommerce",
  name: "Paper Shopping Bag That Catches Boxed Products, Bulges, Leans and Flexes Its Rope Handles",
  keyword: "add to bag animation react",
  title: "React Add to Bag Animation with a Paper Bag | We.Inc",
  description: "Add to bag piece where boxed products fall into a paper carrier that bulges, leans under the load and flexes its rope handles. Free React and HTML to copy.",
  intro: "A vermilion paper carrier bag stands on a pale grey sweep with its mouth open toward you. Five cartons, each with a product photograph on its face, fall in one after another. Every landing does four things at once: the front of the bag bellies forward, the folded sides are pushed flatter, the bag rocks toward the heavier side and the two twisted cord handles jump. The last two cartons are tall enough to stand proud of the rim. When the bag is full it is lifted away by its handles and an empty one drops into its place with a small bounce. A running count and total sit bottom left, and one button bottom right drops the next carton. On phones the bag scales down as a single object and the button wraps onto two lines if it needs to.",
  useWhen: [
    "A shop wants its add to bag moment to feel like something landing in a real bag instead of a number changing in the header.",
    "A gift set or bundle page shows what is included by packing it in front of the visitor.",
    "A checkout success screen needs a short, physical summary of what was bought.",
    "A homepage for a homeware, beauty or bookshop brand wants one object on a clean stage instead of a product grid above the fold.",
  ],
  customize: [
    "The `goods` list is everything that falls: `w`, `h` and `d` size each carton, `x` and `rest` say where it comes to rest inside the bag, `kg` is how hard it lands and `card` is the colour of the box and of the frame shown until the photo loads.",
    "`RED`, `RED_SIDE` and `INSIDE` are the front, the shaded gusset and the unprinted inside of the paper. The wordmark comes from `shop.name` and `shop.line`.",
    "`BW`, `BH` and `BD` are the bag's width, height and depth. If you change them, move the `x` and `rest` values in `goods` so the cartons still stack inside.",
    "In `settle`, `kg * 6` is how far the front bellies out per unit of weight and `tip * 0.085` is how many degrees the bag leans. Halve them for stiffer paper.",
    "The demo timer drops a carton every 430 milliseconds. Change that interval to slow the packing down.",
  ],
  accessibility: [
    "One real button does everything. Its text always names the carton it is about to drop and that carton's price, or says it will carry the bag off when the bag is full.",
    "The count and total are in a paragraph with `aria-live=\"polite\"`, so each drop is announced without moving focus.",
    "Every carton photograph has alt text. Paper, cords, shadows and carton sides are decoration and are hidden from assistive technology.",
    "With reduced motion the bag is drawn already packed and bellied out. The button still adds and empties, with cartons appearing in place instead of falling.",
  ],
  faqs: [
    {
      question: "How can a flat panel of paper bulge?",
      answer: "The front is not one panel. It is six narrow ones, each hinged on its left edge, and on every frame they are laid along a sine arc whose height is the current belly value. Each panel takes a slice of one shared background with `backgroundPosition`, so the cuff, creases and grain run unbroken across the joins, and a tint on each panel brightens the half that turns toward the light.",
    },
    {
      question: "What makes the sides fold in and out?",
      answer: "Each gusset is two panels that meet on a centre crease, as on a real carrier. The crease starts 21 pixels inside the bag and a spring moves it out toward 3 pixels as weight is added, so an empty bag looks pinched and a full one looks square.",
    },
    {
      question: "Is this a physics engine?",
      answer: "No. Cartons fall under constant gravity with one small bounce, and six damped springs handle belly, fold, lean, squash and the two handles. A landing adds a kick to each spring in proportion to the carton's weight and speed. That is under a hundred lines and runs only while something is moving.",
    },
    {
      question: "How do I connect it to a real basket?",
      answer: "Call the same function the button calls, `add`, from your own add to bag handler, and build `goods` from the products on the page. The count shown in the caption is React state, so you can lift it into your store.",
    },
    {
      question: "Why are the products shown as cartons?",
      answer: "A stock product photo has a background, and a rectangle with a background reads as a printed box, not as a floating cut-out. Putting each photo on the face of a carton with its own sides and lid keeps the scene physical without needing cut-out images.",
    },
  ],
  related: ["shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes", "pearl-necklace-length-picker-on-a-velvet-bust-with-a-knotted-strand-that-drapes-and-swings-like-a-real-chain", "pepperoni-pizza-share-picker-on-an-aluminium-pan-that-cuts-the-photograph-into-equal-slices-and-pulls-one-out"],
  tags: ["3d", "ecommerce", "shopping bag", "add to bag", "physics", "spring", "product"],
  height: 764,
  section: true,
  interactive: true,
};

export default meta;
