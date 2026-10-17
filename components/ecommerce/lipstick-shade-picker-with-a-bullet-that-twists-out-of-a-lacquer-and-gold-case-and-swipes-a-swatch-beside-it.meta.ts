const meta = {
  slug: "lipstick-shade-picker-with-a-bullet-that-twists-out-of-a-lacquer-and-gold-case-and-swipes-a-swatch-beside-it",
  category: "ecommerce",
  name: "Lipstick Shade Picker with a Bullet That Twists Out of a Lacquer and Gold Case and Swipes a Swatch Beside It",
  keyword: "lipstick shade picker react",
  title: "React Lipstick Shade Picker with a Swatch | We.Inc",
  description: "Shade picker on a canvas: pick a colour and the bullet winds down into its gold case and returns to swipe a swatch. Free React and HTML code.",
  intro: "A lipstick lying open on a pale table beside its cap, seen from straight above like a magazine flat lay, with one thick swipe of colour under it. Everything is painted on a canvas: black lacquer with a hard white streak, a polished gold sleeve, a knurled ring whose ridges travel as it turns, and a slant-cut bullet with a soft waxy highlight. Pick another shade from the dots and the bullet winds back into the sleeve, changes colour out of sight, winds out again, and the old swipe fades while a new one is drawn strand by strand, ending in a dry, broken tail. You can also drag along the case to wind the bullet by hand. On phones the name, price and shade dots drop below the picture.",
  useWhen: [
    "A lipstick, lip gloss or crayon product page needs a variant picker that shows the colour on something other than a flat circle.",
    "A beauty brand is launching a small shade range and the page should give each colour a moment of its own.",
    "You sell cosmetics without studio packshots for every shade and want one drawing that covers the whole range.",
    "A gift set or subscription box page wants a tactile centrepiece above the add to bag button.",
  ],
  customize: [
    "`shades` at the top is the range: each entry has a `name`, a shade number `no` and a `hex`. The bullet, the swipe and the dot under the stage all read from it, so adding a sixth entry is enough.",
    "`product` holds the line name, weight and price in the caption, plus `engraving`, the gold lettering along the black base. Keep the engraving under about fourteen characters or it runs into the ring.",
    "`LIP`, `CAP` and `SMEAR` inside the effect are the position and angle of each object in the 600 by 520 drawing. Give `SMEAR.rot` a steeper value for a more diagonal swipe, or raise `SMEAR.wide` from 60 for a fatter one.",
    "The case finish is the `lacquer` list of grey stops. Swap it for the `gold` list in the two `tube` calls that draw the base and the cap to get an all metal case.",
    "The stage colour is `bg-[#dde2d4]` and the radial gradient beside it on the section. The cast shadows are tinted to match in `cast`, so change both together.",
  ],
  accessibility: [
    "Each shade is a real button with its name and number as the label and `aria-pressed` on the chosen one, so the range can be tabbed through and picked with Enter or Space.",
    "The shade name in the caption is a polite live region, which lets a screen reader hear the new colour after a pick.",
    "Winding the bullet has its own button labelled Twist down or Twist up, so the drag gesture is never the only way.",
    "With reduced motion the bullet and the swipe change colour in one step and the idle tour through the shades does not run.",
  ],
  faqs: [
    {
      question: "How is the swatch swipe drawn so it does not look like a flat brush stroke?",
      answer: "It is 52 thin lines laid side by side along a slightly bowed path. Each line has its own lightness, its own width and its own stopping point, with the middle ones running furthest, so the end frays the way a real swipe does when the product runs out. A lighter pass over the upper strands and a soft bloom at the start stand in for the sheen of fresh paste.",
    },
    {
      question: "How do I wire the chosen shade to my cart?",
      answer: "The component keeps the selected index in the `picked` state. Read `shades[picked]` where you build the add to bag request, or lift that state up by turning `picked` and `setPicked` into props.",
    },
    {
      question: "Why does the ring look like it is turning?",
      answer: "The ridges are placed at the sine of an angle around the ring, and only the ones facing the viewer are drawn, narrower toward the edges. Adding the twist amount to that angle slides every ridge across and round the back, which is what a knurled collar does when you turn it.",
    },
    {
      question: "Can the lipstick stand upright instead of lying down?",
      answer: "Set `LIP.rot` to minus a quarter turn and it will point up, but the shading assumes a tube lying on a table lit from the upper left, with the shadow thrown down and to the right. For a standing product you would also want elliptical end faces, which this drawing leaves out on purpose.",
    },
    {
      question: "Does it cost much to run?",
      answer: "One canvas, a few gradients and about a hundred and fifty short lines per frame. The loop stops when the stage scrolls out of view or the tab is hidden, and the pixel ratio is capped at two.",
    },
  ],
  related: [
    "heavy-glass-perfume-bottle-you-tilt-with-amber-liquid-that-stays-level-and-a-gold-stopper-that-lifts-out",
    "velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light",
    "pearl-necklace-length-picker-on-a-velvet-bust-with-a-knotted-strand-that-drapes-and-swings-like-a-real-chain",
  ],
  tags: ["lipstick", "shade picker", "beauty", "canvas", "variant selector", "cosmetics", "swatch"],
  height: 730,
  section: true,
  interactive: true,
};

export default meta;
