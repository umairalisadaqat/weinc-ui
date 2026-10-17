const meta = {
  slug: "layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters",
  category: "text-effects",
  name: "Layered Paper Cut Word with a Photograph Drifting Behind the Letters",
  keyword: "tailwind image text mask",
  title: "Tailwind Image Text Mask in Layered Paper | We.Inc",
  description: "Text effect with one word cut through stacked sheets of card, each cut a little wider, and a photograph drifting behind. Free React and HTML code to copy.",
  intro: "One heavy word is cut through four sheets of card stacked in a box. The cut in each sheet is slightly wider than the one beneath, so every letter is ringed by three stepped rims of off-white card, and each sheet drops a soft shadow on the next. At the bottom of the well a photograph of flowers drifts and cross-fades to the next picture every few seconds. The stack leans a few degrees and the sheets slide against each other as the viewpoint moves, slowly without input and under the pointer or a finger when there is one, which gives the stack real depth. The whole piece keeps its 15 to 7 shape and scales down to a phone without any sideways scroll.",
  useWhen: [
    "A campaign or season needs a single word as its poster: a sale name, a festival, a collection title.",
    "You have strong photography and want the headline to be the frame for it.",
    "A florist, a gallery, a print studio or a food brand wants an opener that looks made by hand.",
    "You want depth and parallax in a hero without loading a 3D package.",
  ],
  customize: [
    "The word is `WORD`. It is stretched to 80 percent of the box with `textLength`, so three to seven capitals fit; lower `fontSize={300}` for longer words.",
    "Sheet colours and how much wider each cut is live in the `sheets` array as `fill` and `grow`. Give each `fill` a different colour, light at the top and dark at the bottom, for a contour-map look.",
    "Pictures are the `photos` array. Each needs a true `alt`, and busy, saturated images read best through letter shapes.",
    "How far the sheets slide is the `0.34` multiplier on `depth`, and the photograph's travel is the `2.3` beside it. Raise both for a deeper box; the lean is the `5` and `4` degrees in the tilt line.",
    "`SECONDS_PER_PHOTO` sets the cross-fade rhythm, and the `layered-paper-cut-word-drift` keyframes set how far the picture pans.",
  ],
  accessibility: [
    "The word exists as a real `h2` that is visually hidden, because text inside an SVG mask is not exposed to assistive technology. Change the heading level to suit the page outline.",
    "The cut sheets are marked `aria-hidden`, while each photograph keeps its own `alt` so the imagery is still described.",
    "With reduced motion the parallax loop never starts, the pan is switched off and the first photograph stays in place.",
    "Nothing here depends on hover: the idle sway shows the depth on touch screens and for keyboard users.",
  ],
  faqs: [
    { question: "How do you cut text out of a solid block so a picture shows through?", answer: "CSS masks cannot take live text as their shape, so the sheet is an SVG rectangle with a mask that is white everywhere except for black text. Black areas of a mask are removed, which leaves a letter-shaped hole. The photograph is an ordinary `img` sitting behind the SVG." },
    { question: "How are the stepped rims around each letter made?", answer: "Every sheet uses the same text in its mask, but with a black stroke of a different width added. A wider stroke eats a wider hole. The top sheet has the widest hole, so the edges of the three sheets under it show as rings." },
    { question: "Why not use background-clip: text?", answer: "That paints a picture inside flat letters, which is fine for a headline but has no thickness. Here the letters are holes in separate sheets, so each sheet can carry its own drop shadow and slide independently. That is where the depth comes from." },
    { question: "Will it work if the visitor does not have Arial Black?", answer: "Yes. The font stack falls back to other heavy system faces, and `textLength` forces whichever one loads to the same width, so the word always fits the box. Letter shapes will differ a little between devices." },
    { question: "Does the parallax hurt performance?", answer: "Each sheet is rasterised once with its shadow, then only moved with `translate3d`, which the compositor handles. The loop pauses when the box is off screen or the tab is hidden." },
  ],
  related: ["magnetic-fridge-letters-you-can-drag-across-enamel-that-slide-back-to-spell-the-word", "ray-marched-liquid-chrome-word-on-a-mirror-floor-with-a-mercury-bead-that-chases-the-pointer", "shortbread-letters-cut-from-dough-that-rise-and-brown-on-a-baking-tray-and-lose-a-bite-when-tapped"],
  tags: ["text mask", "paper cut", "parallax", "photo text", "svg mask"],
  height: 665,
  section: true,
};

export default meta;
