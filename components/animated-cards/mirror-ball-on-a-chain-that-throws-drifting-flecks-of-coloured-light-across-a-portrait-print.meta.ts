const meta = {
  slug: "mirror-ball-on-a-chain-that-throws-drifting-flecks-of-coloured-light-across-a-portrait-print",
  category: "animated-cards",
  name: "Mirror Ball on a Chain That Throws Drifting Flecks of Coloured Light Across a Portrait Print",
  keyword: "disco ball animation react canvas",
  title: "React Canvas Disco Ball Animation over a Portrait | We.Inc",
  description: "A tiled mirror ball turns on its chain and scatters flecks of coloured light that reveal a portrait print in a dark room. Free React canvas code and HTML.",
  intro: "A portrait print hangs in a dark room with a mirror ball turning in front of it. Three coloured spotlights are aimed at the ball, and every one of its several hundred glass tiles sends a small patch of light back onto the wall. Where a patch crosses the print you see the photograph at full brightness and in that lamp's colour; everywhere else it stays in near darkness. The patches are not sprites on a path. Each one is worked out from the tile's own angle, so they drift in slow arcs, grow and stretch into ovals as they slide away from the ball, and sit a little out of line because the tiles are glued on slightly crooked. Flick sideways anywhere to send the ball spinning and watch it wind back down to its resting speed. Moving the pointer nudges the white lamp, and a button swaps the set of coloured gels. On phones the print takes most of the width and the ball hangs over its top corner.",
  useWhen: [
    "A club night, festival or record label page needs an opening image that moves and still shows the artist's portrait.",
    "A fashion or beauty campaign wants one hero picture treated as an object in a room instead of a flat banner.",
    "A party invitation or new year landing page calls for something festive that is not confetti.",
    "A photographer's site wants a single showpiece between quieter gallery sections.",
  ],
  customize: [
    "`PHOTO` and `PHOTO_ALT` are the print. A tall picture with a plain backdrop works best, because the flecks read clearly on flat areas.",
    "`gels` lists the lamp sets. Each lamp has a `tint` in red, green, blue from 0 to 255 and a `from` direction. Add a fourth set and the button cycles through it.",
    "`ball.rows` and `ball.around` set how many tiles the ball has. 14 and 28 give a few big flecks, 30 and 60 a fine shimmer.",
    "`ball.room` is how much of the print shows in the dark, from 0 to 1. Raise it to 0.4 if the portrait must stay readable between flecks.",
    "The ball and the print are placed by the classes on the `button` and the `img`. Change `md:left-[28%]` and `md:left-[56%]` to move them; the canvas reads their positions from the page.",
  ],
  accessibility: [
    "The portrait is a real `img` with alt text sitting under the canvas, so it is announced and is still there if the script fails.",
    "The ball is a button. Enter or Space gives it a shove in the opposite direction, which does the job of a flick for keyboard users.",
    "The gel control is a labelled button whose text names the current set.",
    "With reduced motion the ball does not turn. The flecks are drawn once in place, and pressing the ball or changing gels redraws that single frame.",
  ],
  faqs: [
    {
      question: "How are the positions of the light patches worked out?",
      answer: "For each tile and each lamp the code mirrors the lamp's position in the plane of that tile, then follows the reflected ray from the middle of the tile until it reaches the wall. A soft disc of the lamp's colour is drawn there, larger the further it travelled and stretched where it lands at a slant. It is the same rule as for any flat mirror, repeated a few hundred times a frame.",
    },
    {
      question: "How does the light reveal the photo instead of just covering it?",
      answer: "The room is painted twice into hidden canvases: once dark and once fully lit. The patches are drawn in colour on black, multiplied by the lit version, and the result is added to the dark version. So a pink patch on the jacket shows the jacket's own detail tinted pink.",
    },
    {
      question: "Why do the patches look uneven, like a real ball?",
      answer: "`ball.wobble` tilts each tile by a small fixed random amount, and each row starts at a random offset. A perfectly regular ball throws a rigid grid that looks computer made. Set `wobble` to 0 to see the difference.",
    },
    {
      question: "Will it slow the page down?",
      answer: "Each frame stamps a few hundred small discs, fills the visible tiles of the ball and copies three canvases, with the pixel ratio capped at 1.5. The loop pauses when the block leaves the screen or the tab is hidden.",
    },
    {
      question: "Can the picture fill the whole block instead of hanging as a print?",
      answer: "Yes. Give the `img` the classes `inset-0 h-full w-full` in place of its size and position classes, and set the border width `edge` in `paintRoom` to 0. The flecks then travel over the full photograph.",
    },
  ],
  related: ["reversible-sequin-portrait-panel-that-flips-to-gold-foil-where-the-pointer-brushes", "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph"],
  tags: ["disco", "mirror ball", "canvas", "light", "portrait", "reflection", "party"],
  height: 700,
  section: true,
  interactive: true,
};

export default meta;
