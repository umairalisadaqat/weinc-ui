const meta = {
  slug: "hand-gilded-shop-fascia-headline-where-gold-leaf-is-laid-brushed-off-and-burnished",
  category: "text-effects",
  name: "Hand-Gilded Shop Fascia Headline Where Gold Leaf Is Laid, Brushed Off and Burnished",
  keyword: "gold leaf text effect react",
  title: "React Gold Leaf Text Effect on a Shop Sign | We.Inc",
  description: "Canvas text effect: a painted shop fascia whose name is gilded as you watch, with gold leaf laid, brushed off and burnished. Free React and HTML to copy.",
  intro: "A shopfront fascia in bottle green gloss under a moulded cornice, with a name being gilded on it the way a signwriter does the job. The letters start as flat ochre, the colour of the sticky size they are painted in. Squares of leaf are then pressed over them one after another, crinkled and overlapping. A soft brush crosses the board and knocks away everything that is not stuck down, sending flakes of gold spinning off, and what is left is the name in leaf with a blocked shade behind it. Last, a burnishing pass travels along the word and the matt gold becomes a mirror: a band of light and two bands of dark that slide across the letters with the pointer, or by themselves when nobody is steering. A second line in gold paint sits underneath inside a pinstripe border. On phones the board is drawn deeper and the name is scaled to fit its width.",
  useWhen: [
    "An independent shop, florist, barber, bakery or pub wants its name at the top of the page as it appears over the door.",
    "A heritage, craft or restoration business needs an opener that says made by hand without a photograph.",
    "A wedding stationer, jeweller or tailor wants gold that looks like metal and not a yellow gradient.",
    "A section title on a long page should reveal itself once, with a short piece of theatre, and then sit still.",
  ],
  customize: [
    "`NAME` and `TRADE` are the two lines. The name is fitted to the board, so shorter names are drawn larger. An empty `TRADE` centres the name.",
    "`PAINT` is three hex values for the board: light, body and deep shadow. The comment beside it gives a claret set; `['#2b3f6b', '#1a2a4c', '#0d1730']` is a navy one. The moulding highlights are separate greens in `build` and should be shifted to match.",
    "`FACE` is the lettering style. A high contrast serif suits gilding; swap in a slab or a sans stack for a different shopfront.",
    "The stages are timed in the `time` object: `lay`, `wipeFor` and `burnFor` are seconds. Double them for a slower, more ceremonial reveal.",
    "How shiny the finished gold looks is set by the two `glaze` calls in `draw`. Lower the `0.5` alpha values in the first one, the multiply pass, for a softer, satin gild.",
  ],
  accessibility: [
    "Both lines are a real `h2` in the page for screen readers and search engines, kept in step with whatever the visitor types. The canvas is marked as decoration.",
    "The two labelled inputs and the Gild again button work from the keyboard, with a visible focus ring on each.",
    "With reduced motion the board is drawn once, finished and burnished, and the replay button is hidden.",
    "Steering the light with the pointer changes nothing but the reflection.",
  ],
  faqs: [
    {
      question: "How does flat canvas text get a rounded, metallic edge?",
      answer: "The letter shapes are punched out of an opaque sheet, and that sheet is drawn over the gold twice with a blurred shadow and nothing else showing. Offset one way with a dark brown shadow it shades the lower right inside edge of every stroke; offset the other way with a cream shadow it lights the upper left. That baked edge is why the letters look domed.",
    },
    {
      question: "What makes the gold look burnished and not just yellow?",
      answer: "Polished gold shows more dark than light. Each frame a gradient with brown bands either side of a clear gap is multiplied over the letters, then a second gradient with one narrow hot band is screened on top. Both are cut to the letter shapes first and both slide with the light position.",
    },
    {
      question: "Are the gold squares random every time?",
      answer: "No. A seeded generator places them, so the same name always gets the same leaves, creases and seams, and the finished letters keep faint joins exactly where the squares overlapped during the laying stage.",
    },
    {
      question: "Why does the board wait before re-gilding when I type?",
      answer: "The letter shapes, the punched sheet and the finished gold are rebuilt for each new name, which is more work than one frame. A 320 millisecond pause after the last keystroke means it happens once per edit.",
    },
    {
      question: "Will my own font work?",
      answer: "Yes, if it has loaded before the component mounts, because the lettering is drawn to canvas once at build time. Put its family name first in `FACE`.",
    },
  ],
  related: ["silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio", "layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters", "magnetic-fridge-letters-you-can-drag-across-enamel-that-slide-back-to-spell-the-word"],
  tags: ["gold leaf", "signwriting", "shop sign", "canvas", "gilding", "headline", "metallic"],
  height: 740,
  interactive: true,
};

export default meta;
