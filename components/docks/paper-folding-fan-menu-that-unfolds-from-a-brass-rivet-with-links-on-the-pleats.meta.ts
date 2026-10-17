const meta = {
  slug: "paper-folding-fan-menu-that-unfolds-from-a-brass-rivet-with-links-on-the-pleats",
  category: "docks",
  name: "Paper Folding Fan Menu That Unfolds from a Brass Rivet with Links on the Pleats",
  keyword: "radial fan menu react",
  title: "React Radial Fan Menu in Pleated Paper | We.Inc",
  description: "Radial menu built as a paper fan: links printed on the pleats, lacquered sticks and a brass rivet it unfolds from. Copy the React code or HTML free.",
  intro: "A radial menu drawn as a hand fan. Six wedges of cream paper, dyed orange where they meet the sticks and edged in gilt, spread through 150 degrees from a brass rivet. Each wedge is one link with its name printed along the rim. The pleat you are on stands a little proud of its neighbours, and any pleat you point at or tab to rises to meet you. Press the rivet and the fan folds: every pleat narrows as it swings to the middle until only the two black guard sticks are left standing, then it snaps open again with the pleats arriving one after another. A silk tassel hangs from the rivet on a spring, so it lags and swings whenever the fan leans. The fan measures its container and shrinks its stick length to fit a 360 pixel phone.",
  useWhen: [
    "A floating action button should open into five to seven destinations and a plain circle of icons feels generic.",
    "A tea house, stationery shop, theatre or festival site wants its main menu to carry the same craft as the brand.",
    "A portfolio landing page has room for one large object in the first screen and it may as well be the navigation.",
    "A kiosk or tablet screen needs big wedge targets that are easy to hit with a thumb.",
  ],
  customize: [
    "`links` holds the pleat names. The wedge angle is `SPREAD` divided by the number of links, so seven links give narrower pleats with no other change.",
    "`SPREAD` is the open angle. 150 looks like a hand fan. 180 makes a half circle, and 110 suits a corner of the screen.",
    "`DYE` and `PAPER` colour the leaf. Try `#1f3f8f` on `#eef0f2` for indigo on white. The printed rules and gilt rim are the second entry of the `paper` array.",
    "`MAX_R` is the stick length on wide screens. The labels switch to the smaller size when the measured length drops under 230.",
    "The opening feel is the `spring` helper: `stiffness: 150, damping: 13.5`. Set damping to 22 to stop the pleats bouncing past their place.",
  ],
  accessibility: [
    "The rivet is a `button` with `aria-expanded` and `aria-controls`, and its label changes between fold and unfold.",
    "While folded, the list is hidden from assistive technology and the links leave the tab order, so nothing invisible can take focus.",
    "A focused pleat lifts and draws a dark ring around its printed name. The ring sits inside the paper because the wedge shape would clip an outline.",
    "The open page is marked with `aria-current` as well as the raised pleat and red dot. Reduced motion removes the sway, the tassel swing and the springs.",
  ],
  faqs: [
    {
      question: "How does a pleat fold without 3D transforms?",
      answer: "Each wedge does two things at once as the fan shuts: it rotates toward the centre line and it is scaled sideways to a tenth of its width around its own stick. Seen from the front that is what a folding pleat looks like, and it keeps the label attached to the paper.",
    },
    {
      question: "Why is the outer edge a row of shallow points and not a smooth arc?",
      answer: "Folded paper is flat between creases, so the rim of a real fan is a chain of straight cuts. The wedge is a six point `clip-path` with its peak on the stick, which gives that zigzag for free and makes the click area match the paper exactly.",
    },
    {
      question: "What moves the tassel?",
      answer: "One small animation loop tracks the angle of the fan and pulls the tassel toward straight down with an underdamped spring. Folding, unfolding and choosing a pleat each add a shove, so it swings and settles on its own.",
    },
    {
      question: "Can the fan start folded?",
      answer: "Yes. It already mounts folded and a short effect opens it after 180 milliseconds. Delete that effect and it waits for a press on the rivet, with the caption under the fan telling visitors how to open it.",
    },
    {
      question: "Can I put icons on the pleats?",
      answer: "Add an inline SVG above the label inside the anchor. Keep it under 24 pixels wide on phones, where a pleat is about 60 pixels across at the rim.",
    },
  ],
  related: ["paper-shopping-bag-that-catches-boxed-products-bulges-leans-and-flexes-its-rope-handles", "pearl-necklace-length-picker-on-a-velvet-bust-with-a-knotted-strand-that-drapes-and-swings-like-a-real-chain", "pepperoni-pizza-share-picker-on-an-aluminium-pan-that-cuts-the-photograph-into-equal-slices-and-pulls-one-out"],
  tags: ["radial menu", "fan", "paper", "dock", "floating menu", "tassel", "skeuomorphic"],
  height: 680,
  interactive: true,
};

export default meta;
