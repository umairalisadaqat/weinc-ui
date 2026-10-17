const meta = {
  slug: "website-console-with-feature-cartridges-that-click-into-slots-and-switch-on-sections-of-the-screen",
  category: "originals",
  name: "Website Console with Feature Cartridges That Click into Slots and Switch on Sections of the Screen",
  keyword: "add feature to website animation react",
  title: "React Animation: Add a Feature to a Website | We.Inc",
  description: "A console whose screen shows a florist's site: push in a Bookings, Shop or Journal cartridge and that section switches on. Free React and HTML code.",
  intro: "A cream plastic console stands alone on a pale stage. Its screen shows the home page of a made-up florist, and three cartridges stand in slots along the top: a blue one for bookings, a black one for the shop and a grey one for the journal. Each cartridge is a real button. Push one and it springs down until only its ridged grip and name show, a lamp under the slot turns blue, and the matching row of the page wipes on from the left behind a thin blue scan line. Push it again and it pops back up with a bounce, the lamp goes out and the row returns to a dashed empty slot. The link for that feature in the tiny site menu fades in and out with it. Left alone, the piece seats two cartridges, leaves the third standing for a moment so you can read its label, pushes it in, and then pulls and reseats one every few seconds. The whole object is drawn 460 pixels wide and scaled to its container, so a phone shows the same console smaller.",
  useWhen: [
    "A page about extending a site needs one object that shows a feature being added as a single physical action.",
    "You want visitors to try switching parts of a page on and off before they read anything about it.",
    "A product tour needs a looping picture for the step where someone adds bookings, a shop or a blog to a site that already exists.",
    "An add-ons or extras page wants a hero that is a toy to press and not a grid of icons.",
  ],
  customize: [
    "`carts` lists the cartridges. `shell` holds the three stops of the plastic gradient, `edge` the outline, and `ink` the colour of the name moulded on the top band.",
    "`IN` is the distance a cartridge sinks. Lower it to leave more of the paper label showing above the console when seated.",
    "The page on the screen is plain markup inside three `Row` elements. Swap `shopName`, `days`, `products` and the hero sentence for your own business.",
    "The seated spring is `stiffness: 520, damping: 24` and the eject spring is `damping: 13`; raise the second number for a calmer pop.",
    "For a fourth slot, add an entry to `carts`, change `126` (the slot pitch) and the `118` slot width so four fit across 408 pixels, and add a `Row`.",
  ],
  accessibility: [
    "Every cartridge is a `button` with `aria-pressed`, so a screen reader hears \"Bookings cartridge, pressed\" and Space or Enter seats or ejects it.",
    "The miniature page is hidden from assistive technology because it is a picture of a site, and a polite live line announces each cartridge as it is seated or ejected.",
    "With reduced motion the console appears fully loaded, cartridges move without a spring, and the day marker in the bookings row stays still.",
  ],
  faqs: [
    {
      question: "How do the cartridges disappear into the console without clipping?",
      answer: "They are not clipped at all. The cartridges are drawn first and the front panel of the console is drawn after them, so the panel covers whatever has moved below its top edge. A separate strip behind both draws the top face and the dark slot mouths.",
    },
    {
      question: "Can a cartridge control a real section of my page?",
      answer: "Yes. `seated` is an array of three booleans. Lift it into a parent or read it in an effect, and show or hide your own sections from the same values that drive the rows on the screen.",
    },
    {
      question: "Why does the demo stop when I click?",
      answer: "The first press on a cartridge or on the Eject all button sets `auto` to false, which cancels every pending timer. That keeps the loop from undoing a choice the visitor has just made.",
    },
    {
      question: "What makes the plastic look moulded and not flat?",
      answer: "Three things stacked: a vertical gradient with a white top edge, three hard one-pixel steps under the body for the bottom lip, and a multiply layer of SVG noise for grain. The screen adds an inner shadow and a diagonal highlight for the glass.",
    },
    {
      question: "Do the photographs need to load before the first frame looks right?",
      answer: "No. The hero and each product tile carry a background colour sampled from their photo, so the screen looks complete while the images arrive.",
    },
  ],
  related: ["sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray", "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube", "agent-switchboard-with-swaying-patch-cords-and-lamps-that-light-as-each-step-runs"],
  tags: ["originals", "features", "cartridge", "console", "add-ons", "tactile", "website"],
  height: 820,
  interactive: true,
};

export default meta;
