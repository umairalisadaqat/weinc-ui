const meta = {
  slug: "three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page",
  category: "originals",
  name: "Three Folded Design Proofs Dealt Like a Hand Where the Chosen One Unfolds into a Full Page",
  keyword: "design picker react component",
  title: "React Design Picker Component: Folded Proofs | We.Inc",
  description: "Design picker with folded proofs of one website dealt like a hand: the one you choose unfolds in panels into the full page. Free React and HTML code.",
  intro: "A way to choose between three designs that treats each one as a printed proof folded in three. Two proofs lie tilted at the sides of a warm white table showing only their top fold, and the chosen one sits in the middle opened out into the whole page: the middle fold drops away from behind the first, then the last fold peels off it toward you. Paper that has been folded does not lie flat again, so the open page keeps a shallow zigzag, with a shadow in each crease, and the folds flex a little as the pointer moves up and down the stage. A blue pin drops into the proof you picked. Each proof is a real miniature page for an invented florist, with photographs, set in live text. On a phone the table is scaled down and the two spare proofs peek out from behind the open page; the three pills under the table stay full size.",
  useWhen: [
    "A site or app builder offers a few generated designs and the choice should feel like picking up a print, not ticking a radio button.",
    "A studio wants to present three directions for one client homepage side by side and open each to full length.",
    "A template or theme page needs a hero object that shows a whole long page without a scrolling screenshot.",
    "A print shop or stationery brand shows a leaflet folded and unfolded in the same picture.",
  ],
  customize: [
    "`designs` holds the three proofs. Each has a `name` for its pill, a `note` for the line under the pills and `folds`, an array of exactly three panels drawn at 300 by 184 pixels.",
    "`PW` and `PH` set the size of one fold. Keep the ratio near 5 to 3 so three folds make a believable page, and redraw the panels to the new size.",
    "`PIN` colours the pin and the dot in the active pill. The pin is three spans with a radial gradient, so a red or brass pin is a change of four colour stops.",
    "The resting angles are the `170.3` and `163.6` inside `rotB` and `rotC`. Raise them toward 179.3 and 178.6 for a page that lies flat, or lower them for a stiffer card stock.",
    "`HOLD` is how long the demo leaves each page open. The demo stops for nine seconds after any click or key press.",
  ],
  accessibility: [
    "The three pills are a `radiogroup`. Only the checked pill is in the tab order, and the arrow keys, Home and End move the choice.",
    "The table itself is one `role=\"img\"` whose label names the open design, so a screen reader is not walked through nine tiny page panels.",
    "The line under the pills is a polite live region that reads the description of the new design.",
    "With reduced motion the proofs swap in place with no folding, no pin drop and no self-running demo.",
  ],
  faqs: [
    {
      question: "How is the fold built without a 3D library?",
      answer: "Each proof is three nested boxes. The second is hinged on the bottom edge of the first and the third on the bottom edge of the second, using `transform-origin: 50% 0%` and `rotateX` inside a parent with `perspective`. Folded, the second sits at almost minus 180 degrees and the third at almost plus 180 relative to it, which is a real Z fold.",
    },
    {
      question: "Why does the open page not lie flat?",
      answer: "On purpose. The two hinges stop about nine and fifteen degrees short of flat, and a dark gradient sits in each crease. That small error is what makes it read as paper. The same two angles are nudged by the pointer height through a soft spring.",
    },
    {
      question: "Can I use it with more than three designs?",
      answer: "The fan and the side slots are laid out for three. A fourth proof needs a third resting slot in `placeOf` and a narrower `handX`. For five or more a horizontal row of folded proofs under the open page would serve better than a hand.",
    },
    {
      question: "How do I get the chosen design out?",
      answer: "The `chosen` state is the index into `designs`. Lift it to a parent, or call your own function inside `pick`, which runs for both a click on a folded proof and a pill.",
    },
    {
      question: "Do the miniature pages have to be hand built?",
      answer: "No. A fold can be any element 300 by 184 pixels, so three slices of a tall screenshot work: give each fold the same image with `object-position` set to top, centre and bottom.",
    },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "three-glass-cake-domes-on-ceramic-stands-each-keeping-a-different-site-design-where-the-dome-lifts-off-the-one-you-choose", "tri-fold-screen-that-opens-leaf-by-leaf-from-phone-to-tablet-to-desktop-as-one-page-reflows"],
  tags: ["design picker", "paper", "fold", "proof", "3d", "editorial", "chooser"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
