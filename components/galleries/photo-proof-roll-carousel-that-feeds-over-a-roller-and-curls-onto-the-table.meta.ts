const meta = {
  slug: "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table",
  category: "galleries",
  name: "Photo Proof Roll Carousel That Feeds over a Roller and Curls onto the Table",
  keyword: "react vertical photo carousel",
  title: "React Vertical Photo Carousel on a Proof Roll | We.Inc",
  description: "Vertical carousel drawn as a roll of photo proofs: paper bends over a chrome roller, hangs facing you and curls onto the table. Free React and HTML code.",
  intro: "One unbroken length of proofing paper in a dark print room. It comes over a chrome roller at the top, hangs flat so a single photograph faces you, then bends forward and lies along the table toward the camera. Six portraits are printed down it, each with crop marks, a plate number, a title and a strip of ink control patches. The bend is real geometry: the picture wraps the roller, catches a band of light on the lower curl and stretches in perspective across the table. Drag the paper down or up and it feeds with weight, overshooting a touch before the next plate settles in the hanging run, while the knurled roller ends turn in step. It feeds itself on a timer. On phones the same scene is scaled down whole, so nothing reflows.",
  useWhen: [
    "A print studio, lab or photographer wants the gallery to say that these pictures end up on paper.",
    "You need a vertical carousel that shows one image at full size and still hints at the one before and the one after.",
    "The page is dark and you want a single bright object to carry it without any heading or supporting copy.",
    "A portfolio has a short, ordered series where sequence matters, such as a shoot shown as numbered plates.",
  ],
  customize: [
    "Change the pictures in the `frames` array. `title` is printed in the band under the photo and shown in the corner readout, and `focus` is the crop position for both the image and its bent copies.",
    "All sizes are constants in design pixels for a 300 wide roll: `W` for the paper, `PHOTO` and `BAND` for each plate, `R1` for the roller, `RUN` for the hanging length, `R2` for how tight the lower curl is and `TABLE` for the length lying flat. Keep `RUN` a little longer than `PHOTO + BAND` so one whole plate fits.",
    "Paper colour is `bg-[#f5f3ee]` on the strips. The wall and table are the two `radial-gradient` backgrounds, and the metal is the `chrome` gradient string.",
    "The weight of a pull is the `46` and `9.6` in `tick`. Raise the second number for paper that stops dead, lower it for more bounce. `HOLD_MS` is the rest between automatic feeds.",
    "The curves are built from `nTop` and `nBot` flat strips in `buildStrips`. More strips give a smoother bend at the cost of more elements.",
  ],
  accessibility: [
    "The scene is one focusable carousel group. Up and down arrows, or left and right, feed a plate at a time, and the two round buttons in the corner do the same job with labels that say which way the paper moves.",
    "Only the hanging run holds real images with alt text. The copies that wrap the roller and lie on the table are decorative and hidden, so a screen reader meets each photograph once, and the corner readout announces the current plate politely.",
    "Dragging is limited to the paper itself, so on a touch screen the page still scrolls from the dark areas either side. Reduced motion turns off the timer and the spring, and each plate appears in place.",
  ],
  faqs: [
    { question: "How does one photo bend round the roller without WebGL?", answer: "The paper is cut into 27 flat strips: nine thin ones over the roller, one tall one for the hanging run, sixteen round the lower curl and one for the table. Each strip is placed in 3D with `translate3d` and `rotateX` along a path made of two arcs and two straight lines. Inside every strip sits the same tall column of plates, shifted so each strip shows exactly the slice of paper that would be at that point." },
    { question: "What moves when the paper feeds?", answer: "Only the inner columns. The strips never move, so their 3D positions are worked out once. Each frame the code sets one `translate3d` per strip, offset by where that strip sits along the path, which keeps the animation cheap." },
    { question: "Where does the light on the curl come from?", answer: "Every strip has a fixed overlay whose strength depends on its angle. Strips over the top of the roller get darker as they turn away, strips near the middle of the lower curl get a white band, and the hanging run gets a faint shadow under the roller. Because the strips do not move, the lighting never has to be recalculated." },
    { question: "Why is the scene scaled as a whole on small screens?", answer: "The geometry is tied together: change the paper width and the roller, curl and table all need to follow. Scaling the finished scene with one `transform` keeps the proportions exact from 360 pixels up, at the cost of smaller caption type on phones." },
    { question: "Can the roll run sideways?", answer: "Not without rewriting `buildStrips` to rotate on the Y axis and swapping the drag to horizontal. If you want a horizontal object, a folded or flat strip suits that direction better than a roll, which reads naturally as hanging under gravity." },
  ],
  related: ["concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre", "sixteen-millimetre-film-projector-gallery-with-turning-reels-a-dusty-beam-and-stills-that-flicker-onto-a-tripod-screen", "slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam"],
  tags: ["carousel", "vertical", "3d", "paper", "print", "drag"],
  height: 790,
  section: true,
  interactive: true,
};

export default meta;
