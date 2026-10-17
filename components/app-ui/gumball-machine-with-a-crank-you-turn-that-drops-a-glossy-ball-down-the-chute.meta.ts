const meta = {
  slug: "gumball-machine-with-a-crank-you-turn-that-drops-a-glossy-ball-down-the-chute",
  category: "app-ui",
  name: "Gumball Machine with a Crank You Turn That Drops a Glossy Ball Down the Chute",
  keyword: "gumball machine animation react",
  title: "React Gumball Machine Animation with a Crank | We.Inc",
  description: "Canvas gumball machine: turn the chrome handle a full circle and a gumball drops down the chute and rolls across the table. Free React and HTML to copy.",
  intro: "A red enamel gumball machine on a sunflower yellow sweep of paper: glass globe, chrome collar, a butterfly handle on a chrome face plate and a flap over the chute. Thirty-eight gumballs lie in the globe as a real pile, each one resting on its neighbours. Drag the handle round clockwise, tap it, or press the button, and after one full turn the gumball nearest the outlet is taken away, the pile slumps into the gap, the flap lifts and the gumball drops onto the table, hops once and rolls off to one side until friction stops it. Gumballs on the table knock into each other. When a sixth arrives the oldest rolls out of the picture and comes back in through the lid, which jumps as it lands. A click on the glass makes the whole pile jump. On narrow screens the machine shrinks to fit and the table simply gets shorter.",
  useWhen: [
    "A sweet shop, arcade, party supplier or toy brand wants a centrepiece that hands something over when it is touched.",
    "A rewards, raffle or daily bonus screen needs a physical way to say that you get one item per turn.",
    "A children's app wants a menu toy that can be played with for a minute without instructions.",
    "A random picker, such as a colour of the day or a prompt generator, needs a friendlier front than a plain button.",
  ],
  customize: [
    "`COLOURS` is the list of gumball colours as three numbers each. Use two or three for a brand palette, or one for a machine of identical gumballs.",
    "`COUNT` is how many start in the globe. About 60 fills it to the lid, 16 leaves a shallow layer.",
    "`ENAMEL` is the paint colour of the lid, shell and foot. `24,96,200` gives a blue machine, `28,30,36` a black one. The shading is calculated from it.",
    "`STAGE` is the backdrop. It is also a good idea to change the hex in the button's `focus-visible:ring-offset` class to match.",
    "To learn which colour came out, read `b.c` inside `deal`. It is an index into `COLOURS`, so a callback there can drive a prize or a result.",
  ],
  accessibility: [
    "Turn the crank is a real button. Tab reaches it, Enter or Space gives the handle one full turn, and up to two turns can be queued.",
    "A visually hidden live region reports the running number of gumballs handed out.",
    "With reduced motion there is no loop and no self-running demo. Pressing the button moves one gumball from the pile to the table and redraws a single still picture.",
    "Only the small circle over the handle blocks touch scrolling. A swipe anywhere else on the block scrolls the page as usual.",
  ],
  faqs: [
    {
      question: "How do the gumballs stack without shaking?",
      answer: "The pile uses position-based steps. Each gumball remembers where it was a moment ago, moves on by that difference plus gravity, and then four passes push every overlapping pair apart and keep everything inside the glass and above the shelf. Because speed is only ever the difference between two positions, a resting pile has nothing left to jitter with.",
    },
    {
      question: "Why does the handle have to go all the way round?",
      answer: "That is how the real mechanism works: the wheel behind the handle carries one pocket past the outlet per turn. The code counts whole turns of the handle angle and queues one gumball for each. Let go early and the handle springs on to the next stop if you are past the first half radian, or back if you are not.",
    },
    {
      question: "Can the handle be turned backwards?",
      answer: "No. In the drag handler only clockwise movement is added to the angle, which acts as a ratchet. Anticlockwise movement is ignored and the handle waits for your pointer to come round again.",
    },
    {
      question: "Where do the gumballs on the table go?",
      answer: "Five can rest on the table. The sixth pushes the oldest into rolling off the edge of the block, and that same colour is put back at the top of the globe, so the machine never runs empty however long it is left.",
    },
    {
      question: "How are the chrome and enamel drawn?",
      answer: "Both are stacked gradients. Chrome is a band of white, grey and near black with the stage yellow reflected in its lower half. Enamel is one colour taken through nine shades across the width of the shell, with two narrow white strips laid over it as window reflections. The reflections on the handle are fixed to the room, so they stay put while the shape turns.",
    },
  ],
  related: ["snow-globe-you-shake-with-drifting-flakes-over-a-tiny-cabin-on-a-turned-walnut-base", "wooden-marble-run-where-glass-marbles-roll-down-zigzag-ramps-and-ring-a-brass-bell"],
  tags: ["gumball", "toy", "physics", "canvas", "chrome", "crank", "drag"],
  height: 740,
  interactive: true,
};

export default meta;
