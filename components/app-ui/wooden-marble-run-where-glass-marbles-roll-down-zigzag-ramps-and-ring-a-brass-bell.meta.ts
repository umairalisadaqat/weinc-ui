const meta = {
  slug: "wooden-marble-run-where-glass-marbles-roll-down-zigzag-ramps-and-ring-a-brass-bell",
  category: "app-ui",
  name: "Wooden Marble Run Where Glass Marbles Roll Down Zigzag Ramps and Ring a Brass Bell",
  keyword: "marble run physics react",
  title: "React Marble Run with Physics and a Brass Bell | We.Inc",
  description: "Canvas marble run: glass marbles roll down zigzag ramps, ring a hanging brass bell and gather in a tray. Drag one to drop it. Free React and HTML code.",
  intro: "A wall toy on a cobalt stage: a birch board with walnut sides, three sloping beech rails held by brass screws, a brass bell on a leather loop and a strip of green felt at the bottom. Six glass marbles run it in turn. Each one rolls down a rail, knocks against the side, drops to the next rail and leaves the last one fast enough to swing the bell before it lands on the felt. Marbles bump each other, stack in the tray, and turn as they roll so the coloured vane inside them twists. You can pick any marble up, carry it anywhere on the board and let go, or flick it. Left alone, the marble that has waited longest is lifted back to the top every couple of seconds. A small counter keeps the number of times the bell has rung. On a phone the board scales to the screen width and the button moves under the caption.",
  useWhen: [
    "A toy shop, nursery or woodworking brand wants a hero object that shows the product being played with.",
    "A children's game needs a waiting screen that is itself a small game.",
    "A physics or maths lesson page wants a live example of slopes, bounces and a pendulum that pupils can poke.",
    "A 404 or empty state should give the visitor something to do for a few seconds before they move on.",
  ],
  customize: [
    "`marbles` lists each marble as a `glass` tint (three numbers) and a `vane` colour. Add entries for a busier run, or keep two for a slow one.",
    "`ramps` holds every rail as four numbers: the high end and the low end of its top edge. The physics and the drawing both read from it, so a fourth rail only needs one more line.",
    "`GRAVITY` and `BOUNCE` set the feel. 700 and 0.2 behave like heavy steel bearings on rubber, 1250 and 0.34 like glass on wood.",
    "`STAMP` is the text burnt into the top of the board, and `DIPS` holds the paint colour on the low end of each rail.",
    "The stage colour is `bg-[#3a5fc4]` plus the radial gradient next to it on the outer element. The same hex appears once more in the button's focus ring offset.",
  ],
  accessibility: [
    "Drop a marble is a real button that works with Enter and Space and does what dragging does, so no pointer is needed to play.",
    "The bell counter is a polite live region, which lets a screen reader announce each new ring without stealing focus.",
    "With reduced motion the loop never starts. The board is drawn at rest, and pressing the button works out where that marble ends up and redraws once.",
    "The canvas and the drag layer are hidden from assistive technology, and the drag layer only covers the board, so the page still scrolls from the margins on a touch screen.",
  ],
  faqs: [
    {
      question: "Is this a physics library?",
      answer: "No, it is about sixty lines of its own. Each marble is a circle with a position and a speed. The step function applies gravity, moves it, then pushes it out of any rail, wall, other marble or the bell it overlaps and reflects the part of its speed that points into that surface. It runs 240 small steps a second so nothing tunnels through a rail.",
    },
    {
      question: "How does the bell react to being hit?",
      answer: "The bell is a pendulum with an angle and a swing speed. When a marble touches it, the two exchange an impulse along the line between their centres, scaled so the bell behaves as one and a half marbles in weight. A hard enough knock sets the ring value to one, which draws the sound arcs and adds to the counter.",
    },
    {
      question: "Why do the marbles look like glass and not like flat discs?",
      answer: "Four things are layered. A tinted fill that is paler where the light enters, the vane clipped inside it and rotated by the distance rolled, a bright patch on the far side where glass gathers light, and a sharp window reflection that never rotates. The shadow on the board also carries a small coloured spot, the way a real marble throws one.",
    },
    {
      question: "Can I move the bell or leave it out?",
      answer: "`PIVOT` is the hook position, `ARM` the length of the loop and `BELL` the size. To remove it, delete the `drawBell()` call and the block in `step` under the comment about striking the bell.",
    },
    {
      question: "How heavy is it for the browser?",
      answer: "The board, rails, felt and screws are painted once into a hidden canvas when the size changes. A frame then copies that picture and draws six marbles and the bell. The loop pauses when the block is off screen or the tab is in the background.",
    },
  ],
  related: ["snow-globe-you-shake-with-drifting-flakes-over-a-tiny-cabin-on-a-turned-walnut-base", "ebony-and-ivory-domino-spiral-that-topples-tile-by-tile-with-real-contact-physics-and-stands-back-up", "gumball-machine-with-a-crank-you-turn-that-drops-a-glossy-ball-down-the-chute"],
  tags: ["marble run", "toy", "physics", "canvas", "wood", "glass", "drag", "bell"],
  height: 760,
  interactive: true,
};

export default meta;
