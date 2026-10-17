const meta = {
  slug: "handheld-catching-game-laid-out-in-parts-on-a-cutting-mat-that-slide-together-and-can-be-played",
  category: "originals",
  name: "Handheld Catching Game Laid out in Parts on a Cutting Mat That Slide Together and Can Be Played",
  keyword: "playable lcd game react component",
  title: "React Playable LCD Game That Assembles Itself | We.Inc",
  description: "A pocket LCD game laid out in parts on a cutting mat: shell, display, buttons and screws slide together, then you can play it. Free React and HTML code.",
  intro: "A cream pocket console sits on a dark gridded cutting mat under one sentence describing a game for a bakery. Its display is the old segment kind: every loaf, every pose of the baker and every digit is printed on the glass once and simply switched on or off. Loaves drop down three lanes and the baker shuffles under them with a tray, while the score counts up in seven-segment numerals. Press the pill under the mat and the console comes apart the way a tidy repair bench looks: the four screws spin out, the blue rubber buttons lift, the display and its brushed metal bezel slide up side by side, and the empty shell drops back to show its sockets. Putting it together reverses the order, flashes every segment once as a power-on test and starts the game. It plays itself until you press a button. The drawing is 600 pixels wide and shrinks as one object on phones.",
  useWhen: [
    "A page about making small games from a description needs proof that the result is something you can play, not a screenshot.",
    "You want a hero object that people poke at: two big buttons and a falling loaf explain themselves without instructions.",
    "A launch post or talk slide needs a loop that shows a product being put together and then working.",
    "An about page or a 404 page could use a small, self-contained game that costs no extra packages.",
  ],
  customize: [
    "`sentence` and `gameName` are the caption above the mat and the name printed on the shell.",
    "`TICK` is the length of half a step in milliseconds. Lower it to 180 for a harder game; `MISSES` is how many dropped loaves end a round.",
    "`LAID` holds where each part rests when the console is apart, as an x and y offset and a tilt from its fitted position. The `screws` array does the same for the four screws with `lx` and `ly`.",
    "The shell colour is the three-stop gradient on the first `Part` (`#fefdfb`, `#f3f0e9`, `#e3dfd5`), and the buttons take theirs from the `rubber` helper.",
    "The falling object is one SVG path inside the `ROWS_Y` loop. Redraw it as a wave, a parcel or a coffee cup and rename the labels to make a different game.",
  ],
  accessibility: [
    "Both rubber buttons are real buttons with spoken names, and the left and right arrow keys move the baker whenever focus is on either of them.",
    "The display is an image whose label carries the live score and the number of dropped loaves, so it can be read on demand without a stream of announcements.",
    "With reduced motion the parts change places without flying, the self-playing demo does not run, and the game clock starts only after the first button press.",
    "The take-apart pill reports its state with `aria-pressed`, and a polite live line says when the parts are laid out and when a round has ended.",
  ],
  faqs: [
    {
      question: "Is this a real game or an animation of one?",
      answer: "It is a real one. A single `game` object holds the baker's lane, the loaves, the score and the misses, and an interval advances it every quarter second. In the demo a few lines steer the baker toward the lowest loaf; the first button press switches that steering off and hands over the same state.",
    },
    {
      question: "Why are faint grey shapes visible where nothing is happening?",
      answer: "That is how a segment display looks. Each figure exists at a fixed place on the glass and is either dark or nearly clear, so the unlit ones leave a ghost. The `lit` helper returns 0.92 for an active segment and 0.055 for a resting one; set the lower number to 0 if you want a clean screen.",
    },
    {
      question: "How do the parts know where to go?",
      answer: "Every part is absolutely placed at its fitted position on a 600 by 640 drawing. Taking the console apart animates an offset from the `LAID` table with a spring, and each part has its own delay so the screws leave first and return last.",
    },
    {
      question: "Can the game be played on a phone?",
      answer: "Yes. The whole drawing is scaled to the container width, and at 360 pixels the two buttons still measure about 43 pixels across, large enough for a thumb. Taps go to the same handler as the arrow keys.",
    },
    {
      question: "What happens when three loaves are dropped?",
      answer: "The figures blink for about two seconds, a hidden live line reads out the final score, and the round restarts at zero. Change `MISSES` to allow more or fewer mistakes.",
    },
  ],
  related: ["phone-game-built-from-stacked-glass-layers-that-press-together-into-a-playable-screen", "website-console-with-feature-cartridges-that-click-into-slots-and-switch-on-sections-of-the-screen"],
  tags: ["originals", "game", "handheld", "lcd", "assembly", "playable", "tactile"],
  height: 840,
  interactive: true,
};

export default meta;
