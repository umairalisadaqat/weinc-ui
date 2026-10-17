const meta = {
  slug: "ebony-and-ivory-domino-spiral-that-topples-tile-by-tile-with-real-contact-physics-and-stands-back-up",
  category: "app-ui",
  name: "Ebony and Ivory Domino Spiral That Topples Tile by Tile with Real Contact Physics and Stands Back Up",
  keyword: "domino effect animation react",
  title: "React Domino Effect Animation with Physics | We.Inc",
  description: "Domino run on a canvas: tiles stand in a spiral, topple in a chain when you push one and rise again on request. Copy the React code or the HTML free.",
  intro: "A spiral of dominoes on a blue table, each tile an ivory face glued to an ebony back with a brass pin through the middle. Push the first tile and the fall travels round the spiral to the centre. The chain is worked out from the geometry of two neighbouring tiles: a tile only moves once the top edge of the one behind it reaches its back, it cannot lean further than the tile in front allows, and the last one lies flat while the rest come to rest overlapping. Tiles that are touching share their spin as one linkage, which is why the wave settles at a steady speed without being given one. Click any standing tile to start the fall from there. When everything is down, a line of text gives the count and the time taken, and the second button stands the tiles back up from the centre outwards. The drawing scales to the screen and the two buttons wrap under it on phones.",
  useWhen: [
    "A page about cause and effect, automation or workflows wants one picture that shows a single action setting off many.",
    "A loading or waiting screen for a game needs something to play with that resets itself.",
    "A physics or maths lesson on chain reactions needs a run where pupils can start the fall from different tiles and compare the times.",
    "A launch page wants a hero that plays once on arrival and can be replayed by the visitor.",
  ],
  customize: [
    "`TURNS`, `OUTER` and `INNER` shape the spiral. One turn from 8 to 5 gives a single open ring of about forty tiles.",
    "`PITCH` is the gap from tile to tile. It must stay above `TILE.t` and below about 1.6 or the tiles cannot reach each other. Wider gaps make a slower, heavier fall.",
    "`IVORY` and `EBONY` are the two layers of the tile as red, green, blue. Swap `EBONY` for `[178, 34, 40]` to get red backs. `PIP` is the paint in the dots.",
    "`GRAVITY` sets the speed of the wave. 45 takes just under four seconds for the full spiral. 300 is close to real tiles on a table.",
    "The table is the Tailwind background on the outer `div`. Change `#2452c4` and the two gradient stops, and the `rgba(6,16,58,0.5)` shadow colour in `draw` to suit.",
  ],
  accessibility: [
    "Both actions are real buttons, `Push the first tile` and `Stand them up`, each disabled while it cannot do anything, so the whole piece runs from the keyboard.",
    "The line above the buttons is a polite live region. It is updated four times per run at most: standing, toppling, the final count with the time, and standing back up.",
    "With reduced motion nothing plays automatically. A push is calculated in one go and the fallen spiral is drawn, with the same count and time in the text.",
    "Clicking a single tile is a pointer extra. Everything it leads to can also be reached from the buttons.",
  ],
  faqs: [
    {
      question: "Is this a scripted stagger or a simulation?",
      answer: "A simulation, reduced to what a line of dominoes needs. Each tile has one angle and one spin and turns about its bottom front edge under gravity. Two formulas link neighbours: the lean that a tile forces on the next one once its top edge touches, and the furthest a tile can lean before it rests on the one in front. No delay is assigned per tile.",
    },
    {
      question: "Why do the fallen tiles overlap and not lie flat?",
      answer: "Only the last tile has room to lie flat. Every other tile comes down onto the back of the one ahead of it, so the row ends up stacked like roof slates at an angle set by the thickness and the spacing. The angle comes out of the contact formula as the arc cosine of thickness over pitch.",
    },
    {
      question: "How do I run my own code when the last tile falls?",
      answer: "Inside `tick`, the phase changes from `falling` to `down` once nothing has moved for a fifth of a second, and `report` is called. Add your callback next to that call, or watch the `phase` field of the `state` object from an effect.",
    },
    {
      question: "Can the tiles follow a different path?",
      answer: "Yes. The loop near the top of the effect fills the `tiles` array with a position, a unit direction `e` and the sideways direction `c`. Replace the spiral maths with any curve, a straight row or a wave, as long as neighbours are one `PITCH` apart and the curve does not bend more sharply than about two tile widths.",
    },
    {
      question: "How heavy is it to draw?",
      answer: "About sixty tiles with up to three visible faces each, plus one blurred fill for every shadow at once. The canvas is only redrawn while tiles are moving. A standing or fallen spiral costs nothing per frame, and the loop stops when the piece is off screen.",
    },
  ],
  related: ["walnut-dice-tray-lined-in-green-baize-where-two-dice-tumble-with-rigid-body-physics-and-settle-on-true-faces", "walnut-chess-clock-with-a-rocker-bar-two-analogue-faces-ticking-hands-and-red-flags-that-lift-and-fall", "wooden-marble-run-where-glass-marbles-roll-down-zigzag-ramps-and-ring-a-brass-bell"],
  tags: ["domino", "physics", "canvas", "chain reaction", "game", "tabletop", "animation"],
  height: 720,
  interactive: true,
};

export default meta;
