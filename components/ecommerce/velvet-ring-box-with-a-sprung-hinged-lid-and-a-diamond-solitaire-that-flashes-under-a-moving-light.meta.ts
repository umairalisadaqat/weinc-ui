const meta = {
  slug: "velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light",
  category: "ecommerce",
  name: "Velvet Ring Box with a Sprung Hinged Lid and a Diamond Solitaire That Flashes Under a Moving Light",
  keyword: "jewellery product reveal react",
  title: "React Jewellery Product Reveal: Ring Box | We.Inc",
  description: "Ring box on a canvas: a velvet case whose sprung lid snaps open on a solitaire, with a diamond that flashes as the light moves. Free React and HTML code.",
  intro: "A jeweller's ring box for the top of a product page, drawn as real geometry on one canvas. The case is a rounded square in bottle green flock with a brass stud, a satin lining stamped in foil and a suede cushion split by a slot. A yellow gold band stands in the slot with a round brilliant held by four claws. Moving the pointer moves the lamp: the pile of the velvet pales along its edges, the reflections run round the band, and each of the stone's facets brightens and dims on its own rhythm, so the diamond scintillates instead of glowing evenly. Press the box and the hinge throws the lid open or pulls it down onto its stop with a small bounce. You can also drag upward to lift the lid by hand. On a phone the canvas narrows with the screen and the caption stays in the lower left corner.",
  useWhen: [
    "An engagement ring or fine jewellery product page wants the piece presented the way it is handed over in the shop.",
    "A proposal planner, wedding site or gift guide needs one object at the top that people will want to open.",
    "A limited release should stay closed until the visitor chooses to look, with the name and price given beside it.",
    "A jeweller's home page needs a quiet centrepiece on a pale background in place of a photo slider.",
  ],
  customize: [
    "`piece` holds the name, the detail line, the price and the two lines of the foil stamp inside the lid (`maker` and `makerLine`).",
    "`VELVET` is the flock colour as red, green and blue. `[20, 28, 66]` gives midnight blue and `[92, 16, 30]` gives burgundy; the pale edges are worked out from it.",
    "`OPEN_ANGLE` is how far back the lid rests, in radians. 1.57 stands it upright, and 2.1 lets it fall well past vertical.",
    "`GEM`, `RING` and `TUBE` inside the effect set the stone radius, the band radius and the thickness of the band. A `GEM` of 24 reads as a two carat stone.",
    "The hinge is the pair `150` and `9.5` (opening) and `210` and `13` (closing) in the frame loop: stiffness, then damping. Raise the damping to remove the bounce.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. A real `button` sits over it with `aria-pressed`, and its label says what is in the box and whether the lid is up.",
    "Enter and Space work the catch from the keyboard, and the focus ring is drawn in the velvet green against the pale stage.",
    "The name, description and price are ordinary text under the box, so nothing a buyer needs is locked inside the drawing.",
    "With reduced motion the lid changes position at once, the self-running demo is switched off and the canvas is only redrawn when you act.",
  ],
  faqs: [
    {
      question: "How is the sparkle of the diamond made without a 3D library?",
      answer: "The crown is built from its real facets: a table, eight stars, eight kites and sixteen upper girdle faces, projected to the screen every frame. Each facet owns a seeded frequency and phase, and its brightness is a sharpened sine of the lamp position, so a small move of the light switches some faces on and others off. Roughly a third of them also pick up a spectral tint as they pass through mid brightness.",
    },
    {
      question: "Why does the velvet look soft and not like painted plastic?",
      answer: "Flock scatters light back along its fibres, which makes it brightest where you see the surface nearly edge on. Every wall strip is shaded by how square it is to the viewer as well as to the lamp, and a speckle pattern drawn once is laid over the fill to stand in for the pile.",
    },
    {
      question: "Can I show my own ring in the box?",
      answer: "The ring is drawn, not a photograph, so you change it through the numbers. Swap the colour stops in the conic gradient on the band for greys to get platinum, change `GEM` for the stone size, and edit the claw angles in the `claws` array for a six claw head.",
    },
    {
      question: "How do I react when a visitor opens the box?",
      answer: "The `open` state is true while the lid is up. Lift it into the parent or add an effect that watches it, then reveal the price panel, start a video or record the event at that moment.",
    },
    {
      question: "Is it heavy on a phone?",
      answer: "A frame is about 150 small polygons and a handful of gradients, on a canvas capped at two device pixels per CSS pixel. The loop stops while the box is off screen or the tab is in the background.",
    },
  ],
  related: [
    "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes",
    "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches",
    "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put",
  ],
  tags: ["jewellery", "ring box", "diamond", "velvet", "canvas", "product reveal", "luxury"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
