const meta = {
  slug: "glossy-photo-print-that-peels-off-a-second-photograph-with-a-lit-curling-underside",
  category: "galleries",
  name: "Glossy Photo Print That Peels Off a Second Photograph with a Lit Curling Underside",
  keyword: "page peel image transition react",
  title: "React Page Peel Image Transition in WebGL | We.Inc",
  description: "Page peel between photos: a glossy print curls up from its corner after the pointer, shows its lit back and comes away. Free React code and HTML to copy.",
  intro: "Two photographic prints lie stacked on a pale table. The bottom right corner of the top one is already lifting, and it follows the pointer: the paper rolls over a soft cylinder, the picture side darkens and catches a streak of gloss as it climbs, and the back comes over white, shaded along the roll and tinted by the colour of the print beneath. The lifted paper drops two shadows, a tight one where it leaves the table and a wide soft one further out. Click, tap, or let go of the corner far enough across, and the print is pulled clean off the stack and the other photograph is on top. Left alone, the corner breathes and the prints change places every few seconds. On a phone the print shrinks to the width of the screen and a sideways swipe across it lifts the corner.",
  useWhen: [
    "A lookbook cover has two hero frames and you want the change between them to feel like handling paper.",
    "A before and after pair, such as a retouch or a renovation, deserves more ceremony than a crossfade.",
    "A photographer's landing page needs one tactile object above the fold and nothing else.",
    "You are teasing a second colourway or a sequel poster and want visitors to uncover it themselves.",
  ],
  customize: [
    "Put your own two pictures in `prints`. Each `tone` is the flat colour shown while that file is still loading, so set it near the picture's dominant colour.",
    "`CURL` is the radius of the roll as a share of the print height. Try `0.04` for a tight sticker peel or `0.14` for heavy card.",
    "`LET_GO` is how far the corner must be dragged before releasing takes the print off. Lower it to `0.5` to make that easier on small screens.",
    "The back of the paper is `vec3(0.972, 0.962, 0.940)` in the shader. Change it to a kraft brown or a pale blue to suit the stock you are imitating, and delete the two `rule` lines to remove the printed marks.",
    "The table is the `bg-[#e7e2d8]` class and the radial gradient on the first `div`. Darken both and the shadows still read, because they are drawn as transparent black.",
  ],
  accessibility: [
    "The print is a native button. Its label says which photograph is on top and which is underneath, and updates each time they change places.",
    "Enter or Space pulls the top print off, so the second picture never depends on a drag.",
    "Both photographs are ordinary images with alt text under the canvas. With reduced motion or no WebGL the top print is shown with its corner cut back and a folded flap, and pressing the button swaps the two.",
  ],
  faqs: [
    { question: "How is the curl worked out?", answer: "Each frame the code takes where the corner is now and where it started, and from those finds a fold line and a roll radius. The shader then asks, for every pixel, how far past the fold it is. Before the fold the print lies flat. Within one radius the paper is climbing a cylinder, so the picture is sampled further along by the arc length. The same arithmetic run the other way round gives the back of the sheet where it has come over the top." },
    { question: "Why does the underside look lit and not flat white?", answer: "Its brightness depends on how far round the roll each point is: darkest where the paper stands on edge, brightest on the crown. It also takes a little colour from the photograph lying under it, most strongly on the steep part of the roll, the way white card picks up a tint from whatever it is held over." },
    { question: "Can I peel from a different corner?", answer: "The grabbed corner is `kx, ky` in the loop, set to the bottom right. Use `0, 1` for the bottom left, change the two `pin` calls to the corners next to it, and flip the sign of the idle `lean` so the corner travels up and to the right." },
    { question: "Will the paper tear or stretch if I drag it somewhere odd?", answer: "No. Two limits keep the corner no further from its neighbouring corners than the edges of the sheet are long, which is the rule real paper obeys. The limits are lifted only once the print has been let go and is leaving the table." },
    { question: "How do I chain more than two photographs?", answer: "The shader holds two textures and a switch for which is on top. To run through a longer set, upload the next picture into the texture that has just left each time the prints change places, which is the block that flips `onTop` in the loop." },
  ],
  related: [
    "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph",
    "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table",
    "tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away",
  ],
  tags: ["page peel", "page curl", "image transition", "webgl", "photo", "paper", "before and after", "reveal"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
