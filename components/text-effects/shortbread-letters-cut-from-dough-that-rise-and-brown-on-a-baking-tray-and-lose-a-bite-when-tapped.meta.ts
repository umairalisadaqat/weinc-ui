const meta = {
  slug: "shortbread-letters-cut-from-dough-that-rise-and-brown-on-a-baking-tray-and-lose-a-bite-when-tapped",
  category: "text-effects",
  name: "Shortbread Letters Cut From Dough That Rise and Brown on a Baking Tray and Lose a Bite When Tapped",
  keyword: "cookie text effect react",
  title: "React Cookie Text Effect: Baked Biscuit Letters | We.Inc",
  description: "Text effect with a word as shortbread on a baking tray: retype it to watch the dough brown, then tap a letter to bite it. Free React and HTML code.",
  intro: "A word baked as shortbread, seen from above on a steel baking sheet lined with creased parchment. Each biscuit is generated from the letter itself: its outline is roughened the way dough spreads, puffed into a low pillow, pricked with a fork wherever the stroke is wide enough, browned hardest at the thin rim, and dusted with sugar. Grains of sugar catch the light and faint steam drifts off the top of the tray while it sits. Type a new word or press the button and the letters land as pale raw dough, the oven light comes on, and over a few seconds they swell and colour. Tap any finished biscuit and a scalloped bite comes out of it at that exact spot, leaving crumbs on the paper. Phones get the same tray, taller, with longer words set on two lines.",
  useWhen: [
    "A bakery, cafe or cake maker wants the shop name to be the product on the opening screen.",
    "A thank you page after an order or a donation should hand the visitor something small and warm.",
    "A food blog needs a seasonal header, such as a single festive word, that it can change in one line.",
    "A cooking class or recipe box landing page wants a playful object above the sign-up form.",
  ],
  customize: [
    "`START_WORD` sets the opening word. Capitals read best because lowercase descenders make thin, fragile biscuits.",
    "`GOLD` and `BROWN` are the baked colours as red, green, blue triples. For gingerbread try `[176, 108, 56]` and `[108, 58, 26]`; `DOUGH` is the raw colour.",
    "`BAKE_SECONDS` is how long the oven light stays on and how long the colour change takes.",
    "`WORKTOP` is the surface around the tray. The focus ring on the button uses the same hex in `ring-offset-[#27382f]`.",
    "Fork holes come from the `pitch` value in `cut`. Raise it from 30 to 44 for fewer holes, or skip the loop for plain sugar biscuits.",
  ],
  accessibility: [
    "The word lives in an `h2` that changes with the field, so the text is in the page for readers and crawlers while the biscuits are decoration on top.",
    "Every biscuit is a button labelled with its letter. Pressing Enter or Space takes a bite from the rim, so the bite is not a pointer-only trick.",
    "The line under the tray is a polite live region that reports raw, in the oven, baked and the number of bites.",
    "With reduced motion a new word appears already baked, and the steam and the landing animation are switched off.",
  ],
  faqs: [
    {
      question: "How is the browning worked out?",
      answer: "The letter outline is blurred, which gives a number at every pixel for how close it is to the edge. That number mixes the gold and brown colours, with large soft blotches added so one side of a biscuit catches more than the other, as it does on a real tray.",
    },
    {
      question: "Is the baking a video or a sprite sheet?",
      answer: "Neither. Every letter is drawn twice when the word changes, once as raw dough and once baked, on two stacked canvases. Baking fades the second over the first while the pair scales up by a few percent.",
    },
    {
      question: "Why are no two biscuits the same, even for a repeated letter?",
      answer: "The roughened edge, the lumps, the fork holes and the sugar all come from a random sequence seeded by the letter, its position and the batch number. Press Bake a fresh tray and the batch number changes, so the whole set comes out slightly different.",
    },
    {
      question: "Can I stop people eating the letters?",
      answer: "Remove the `onClick` from the biscuit buttons, or swap the buttons for plain `span` elements if nothing should be focusable. The rest of the component does not depend on the bite.",
    },
    {
      question: "How do the bites get that toothed edge?",
      answer: "A bite is one large circle with six smaller circles spaced round its rim, erased from both canvases with the `destination-out` blend. Just before that, a slightly larger copy of the same shape is filled in a pale crumb colour, so a thin cut face is left showing the inside of the biscuit.",
    },
  ],
  related: ["magnetic-fridge-letters-you-can-drag-across-enamel-that-slide-back-to-spell-the-word", "silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio", "chalkboard-cafe-menu-where-a-felt-eraser-wipes-the-prices-and-chalk-writes-new-ones"],
  tags: ["biscuit", "cookie", "dough", "baking", "letters", "canvas", "bakery"],
  height: 660,
  interactive: true,
};

export default meta;
