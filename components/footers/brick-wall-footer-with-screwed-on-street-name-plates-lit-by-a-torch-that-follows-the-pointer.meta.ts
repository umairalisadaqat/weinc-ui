const meta = {
  slug: "brick-wall-footer-with-screwed-on-street-name-plates-lit-by-a-torch-that-follows-the-pointer",
  category: "footers",
  name: "Brick Wall Footer with Screwed-On Street Name Plates Lit by a Torch That Follows the Pointer",
  keyword: "creative footer react tailwind",
  title: "React Footer with Street Name Plate Links | We.Inc",
  description: "Footer whose links are enamel street name plates on a brick wall at night, lit by a torch beam that follows the pointer. Free React and HTML code to copy.",
  intro: "A site map footer set on a brick wall after dark. The wall is laid once on a canvas, brick by brick in stretcher bond, with the business name painted across the top in cream that has flaked off the faces and let go of the mortar joints. Nine links hang on it as street name plates in three finishes, one per column: white enamel with black lettering and a red district line, blue enamel with white lettering, and black cast iron with raised cream serif letters. A warm pool of light wanders over the wall until you move a pointer, then it becomes your torch. Where the beam lands on a glazed plate there is a hot spot. Plates throw their shadows away from the light, the raised iron letters pick up a lit edge on the near side, and the bricks show a bright edge on whichever side faces the beam. On phones the three columns stack into one, each plate a full-width 68 pixel target.",
  useWhen: [
    "A pub, bakery, pottery, record shop or city guide wants the last thing on the page to feel like the street outside.",
    "A footer needs around nine links in three groups and a legal line, and the usual four grey columns would let the rest of the design down.",
    "A dark-themed site wants a closing section with atmosphere that still reads as plain links to a crawler and a screen reader.",
    "A local business site wants to play on its address or neighbourhood without using a map.",
  ],
  customize: [
    "`quarters` holds the three columns. Each has a `title`, a `finish` (`white`, `blue` or `iron`) and its links as pairs such as `[\"Journal\", \"Walk\"]`. Drop the second word if you want plain names.",
    "`BRAND` is the faded lettering painted across the top of the wall. It shrinks to fit, so a long name gets smaller letters, not a second line.",
    "`BRICKS` is the list of clay colours picked at random per brick. Swap in greys such as `#6b6b6b` and `#7d7a76` for engineering brick, or creams for a painted wall.",
    "`TORCH.night` is how dark the unlit wall gets. 0.48 keeps every plate readable. At 0 the wall is evenly lit and the beam only adds warmth.",
    "`TORCH.reach` is the radius of the pool in pixels and `TORCH.warm` its colour as three numbers. `210,225,255` turns the torch into a cold LED.",
  ],
  accessibility: [
    "Under the paint this is a `footer` with three labelled `nav` landmarks, each a list of real links with visible text, plus a list of legal links.",
    "Moving through the links with Tab swings the torch onto each plate as it takes focus, and the focused plate also gets an amber outline.",
    "The darkness layer stops at 48 percent so the plates stay legible in the far corner from the beam, and the column titles and legal links sit above that layer at full brightness. Check contrast again if you raise `TORCH.night`.",
    "With reduced motion the light stays where it is until a pointer or the keyboard places it, and it moves there in one step.",
  ],
  faqs: [
    {
      question: "Is the lighting calculated per pixel?",
      answer: "No. The wall is three stacked canvases painted once: the bricks, a set of edge lines lit from the left and a set lit from the right. The two edge layers are faded in and out with CSS masks centred on the beam, and the dark and warm pools are radial gradients. Each frame only updates a few custom properties.",
    },
    {
      question: "How do the plate shadows know where the torch is?",
      answer: "On each frame the direction from the light to the centre of every plate is written to that plate as `--sx` and `--sy`. The box shadow, the screw shadows and the text shadow on the iron letters all multiply those two numbers, so they lean the same way.",
    },
    {
      question: "Can I use more or fewer than nine links?",
      answer: "Yes. Add or remove pairs inside any column, or add a fourth column and change `sm:grid-cols-3` to `sm:grid-cols-4`. The wall is repainted to whatever height the content needs.",
    },
    {
      question: "Why is the painted name not a heading?",
      answer: "It is part of the canvas, so it carries no text. The business name is repeated in a visually hidden paragraph and in the copyright line, which is where assistive technology and search engines read it.",
    },
    {
      question: "What happens on a touch screen?",
      answer: "The light keeps drifting by itself. Touching or dragging on the wall brings the beam to the finger, and about a second and a half after you let go it wanders off again.",
    },
  ],
  related: ["enamel-platform-sign-breadcrumbs-hanging-from-rail-trolleys-that-roll-away-swinging-when-you-step-back-up-the-trail", "bronze-garden-sundial-whose-shadow-points-at-the-time-and-polished-arc-marks-opening-hours", "bubble-wrap-sheet-over-a-photo-print-with-air-cells-that-magnify-the-picture-until-you-pop-them-flat"],
  tags: ["footer", "brick", "street sign", "enamel", "torch", "lighting", "sitemap"],
  height: 660,
  section: true,
  interactive: true,
};

export default meta;
