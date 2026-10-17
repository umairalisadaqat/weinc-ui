const meta = {
  slug: "three-glass-cake-domes-on-ceramic-stands-each-keeping-a-different-site-design-where-the-dome-lifts-off-the-one-you-choose",
  category: "originals",
  name: "Three Glass Cake Domes on Ceramic Stands Each Keeping a Different Site Design Where the Dome Lifts off the One You Choose",
  keyword: "design selector glass dome react",
  title: "React Design Selector Under Glass Domes | We.Inc",
  description: "Design selector with card models of one website on cake stands under glass domes: the dome lifts off the one you choose. Free React and HTML code to copy.",
  intro: "A selector that keeps three designs of the same homepage the way a bakery keeps its cakes: each one is a small card model standing on a white ceramic stand under a glass dome. Choosing a design raises its dome by the blue glass knob. The dome trails behind the lift, swings a few degrees and settles, the card underneath grows a little, loses the haze of the glass and the wall behind it brightens. The other two stay covered, with a streak of studio light down the shoulder of the glass, a reflected window and a slow glint crossing each dome in turn. Hovering a covered dome cracks it open a finger's width. The models are live text and photographs for an invented bakery, in three different palettes and typefaces. On wide screens the three stands share a counter; on a phone the chosen stand sits in the middle and its neighbours lean in from the edges of the screen.",
  useWhen: [
    "A site builder offers a few finished designs and the moment of choosing should feel like being served, with the other options still on the counter.",
    "A bakery, patisserie, florist or jeweller wants a product or theme picker that borrows its own shop fittings.",
    "A studio shows three concept directions and wants the unchosen ones visibly kept safe for later.",
    "A landing page needs a light, calm hero object with glass and ceramic in it, not another dark gradient.",
  ],
  customize: [
    "`designs` holds the three models: `name`, `note` and `page`, an element drawn at 200 by 275 pixels (`CW` and `CH`). A screenshot with `object-cover` works as well as hand-built markup.",
    "`BLUE` colours the glass knob, the enamel line round each plate and the dot in the active pill. The knob is one radial gradient, so amber or clear glass is a change of five stops.",
    "`LIFT` is how far a dome rises, in pixels before scaling, and `HEAD` is the air left above the row for it. Keep `HEAD` within about 30 of `LIFT` or the knob leaves the frame.",
    "The swing comes from the `swing` spring in `Stand` (`stiffness: 46, damping: 6.5`) fed by the lift velocity. Raise the damping to 14 for a dome that rises without rocking.",
    "The wall and counter are the two halves of the section's background gradient, split at `counterTop`. Swap the four colours for marble grey or a dark slate.",
  ],
  accessibility: [
    "The pills are a `radiogroup`: arrow keys, Home and End move the choice and only the checked pill is in the tab order.",
    "Hover is decoration only. The peek on a covered dome shows nothing that is not already visible through the glass.",
    "The counter is one labelled image naming the uncovered design, and the note under the pills is a polite live region.",
    "With reduced motion the glint is switched off, domes change position without swinging and the demo does not cycle.",
  ],
  faqs: [
    {
      question: "How is the glass drawn?",
      answer: "With gradients and shadows only. The dome is one box whose border radius makes a half circle on top and a shallow curve at the bottom. Its fill is bright at both edges and clear in the middle, inset shadows add the darker line where glass bends light, and three small shapes add the light streak, the crown highlight and a window reflection cut with a CSS mask.",
    },
    {
      question: "Why are there two dome layers?",
      answer: "So the card can stand inside the glass. A first layer draws only the far side of the rim and sits behind the card; the second draws the body, the near lip and the knob in front of it. Both share the same lift and swing values, so they move as one object.",
    },
    {
      question: "What makes the dome swing?",
      answer: "Its rotation is a soft spring driven by the velocity of the lift, with the pivot placed above the knob. While the dome accelerates upward it tips, and when the lift stops the spring carries it past centre and back.",
    },
    {
      question: "Can I have four or five stands?",
      answer: "Yes on wide screens: add entries to `designs` and the row scales to fit, although each model gets smaller. On phones the carousel layout already handles any number, because only the chosen stand and its neighbours are in view.",
    },
    {
      question: "How do I use the choice?",
      answer: "`chosen` is the index of the uncovered design and `pick` is called for a click on a stand or a pill. Run your own code in `pick`, for example to load the full design below the counter.",
    },
  ],
  related: ["three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page", "snow-globe-you-shake-with-drifting-flakes-over-a-tiny-cabin-on-a-turned-walnut-base", "white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive"],
  tags: ["design picker", "glass", "dome", "ceramic", "chooser", "bakery", "selector"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
