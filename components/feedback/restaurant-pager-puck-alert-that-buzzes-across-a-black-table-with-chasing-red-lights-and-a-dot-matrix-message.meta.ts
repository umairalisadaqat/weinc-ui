const meta = {
  slug: "restaurant-pager-puck-alert-that-buzzes-across-a-black-table-with-chasing-red-lights-and-a-dot-matrix-message",
  category: "feedback",
  name: "Restaurant Pager Puck Alert That Buzzes Across a Black Table with Chasing Red Lights and a Dot-Matrix Message",
  keyword: "react alert animation canvas",
  title: "React Canvas Alert Animation: Buzzing Pager | We.Inc",
  description: "Alert drawn as a restaurant pager: a black puck buzzes across a table, chases red lights round its rim and scrolls your message. Free React and HTML code.",
  intro: "An alert in the shape of the pager a host hands you while you wait for a table. A gloss black puck sits on dark stone with the number 27 printed on top. When a message comes in, sixteen red lamps chase each other round a smoked band in its side, the puck shudders in short bursts and creeps a little across the table, and an amber dot-matrix display scrolls the message. Red light spills onto the stone and streaks in its polish. Press the puck to answer it: the lamps die, the display says thanks, and it goes back to a slow waiting pulse until the next page. The puck is 236 pixels across on a phone and about half as large again from tablet width up.",
  useWhen: [
    "Something the visitor was waiting for is ready, such as a table, an export, a render or an order, and it deserves more than a line of text.",
    "A waitlist or queue page needs an object that shows it is still listening while nothing is happening.",
    "A hospitality or booking product wants a hero piece that people can press.",
    "You need one persistent alert that stays until it is acknowledged, not a stack of passing toasts.",
  ],
  customize: [
    "`pages` holds the messages. `lcd` is what scrolls on the display and may use capital letters, digits and spaces. `title` and `detail` are the written version under the puck.",
    "`NUMBER` is the figure printed on top. Two characters fit at the current size of `58px`.",
    "The lamp colour is the `rgba(255,44,30,...)` family in the frame loop and the `0.085` red term in the band material. Change both to amber or green together.",
    "`RING_FOR` is how long the demo lets it buzz before answering by itself. Once a visitor has pressed the puck it rings until they answer.",
    "Set `SOUND` to `true` for a low buzz while it rings. It only plays after the visitor has pressed the pager.",
  ],
  accessibility: [
    "The puck is a `button`. Its spoken name carries the current message while it is buzzing and says what a press will do.",
    "Escape answers a buzzing pager from anywhere inside the piece, and the message is also written out in full under the puck.",
    "A hidden polite status line announces each page once. It is not repeated on every burst of buzzing.",
    "With reduced motion there is no shaking, chasing or scrolling: the lamps are simply lit while a message is waiting and the display holds still.",
    "The lamps chase and fade. They never flash the whole ring on and off, so keep it that way if you change the pattern.",
  ],
  faqs: [
    {
      question: "How is the glossy puck drawn?",
      answer: "Its side view is three short outlines: a lower shell, a red band and a domed lid. Each outline is swept round a centre line and the nearest surface is kept for every pixel, then lit as a mirror of a dark room with a window behind the table. That picture is made once. The lamps, the display and the number are painted over it each frame.",
    },
    {
      question: "Why does the number stay readable while the puck shakes?",
      answer: "The top is drawn flat and then squashed to the viewing angle, so the lettering sits in true perspective. The puck only twists by about nine degrees either way as it walks, which keeps the display close to level.",
    },
    {
      question: "Can the display show lowercase or symbols?",
      answer: "The built-in font is a five by seven grid with capitals and digits. Add a glyph by putting seven two-digit hex rows in `FONT`, one row per line of dots, with the left dot as the highest bit.",
    },
    {
      question: "How do I trigger it from my app?",
      answer: "Call `go(\"ringing\", index)` with the position of the message in `pages` when your event fires, and `go(\"answered\")` when the user has dealt with it. Remove the three timers in `go` if you do not want the demo story.",
    },
    {
      question: "Is the animation heavy?",
      answer: "Each frame is one image draw, sixteen small glows and 217 display dots, on a canvas no wider than about 520 pixels. The loop stops when the puck is off screen or the tab is in the background.",
    },
  ],
  related: ["brass-counter-bell-notification-that-rings-and-raises-a-message-card-from-a-slot-in-the-desk", "kitchen-order-rail-notifications-with-printed-paper-tickets-that-slide-under-a-steel-rail-swing-and-pull-off"],
  tags: ["alert", "pager", "canvas", "led", "glow", "dot matrix", "skeuomorphic"],
  height: 700,
  interactive: true,
};

export default meta;
