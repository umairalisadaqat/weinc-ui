const meta = {
  slug: "brass-servants-bell-board-where-a-sprung-bell-rings-and-a-blue-pendulum-keeps-swinging-when-a-booking-order-or-message-arrives",
  category: "originals",
  name: "Brass Servants' Bell Board Where a Sprung Bell Rings and a Blue Pendulum Keeps Swinging When a Booking, Order or Message Arrives",
  keyword: "notification animation react svg",
  title: "React Notification Animation: Sprung Bell Board | We.Inc",
  description: "A lacquered board of brass bells on coiled springs: one rings for each booking, order or message and its pendulum swings on. Free React and HTML code.",
  intro: "Before there were inboxes, a big house had a board of bells in the back corridor, one for every room, and under each bell a small pendulum that went on swinging after the sound had stopped so that whoever arrived late could still see which room had called. This piece is that board, wired to a website instead of a house. Four brass bells hang from coiled steel springs on a black lacquered panel, each over an enamel plate: bookings, orders, messages and sign-ups. When something comes in, that bell is jerked on its spring, the clapper rattles inside it, the coil winds and unwinds, and the blue pendulum below is left rocking for a good ten seconds. A paper slip under the board reads out what arrived, written for an invented bakery. Every bell is a button, so a visitor can ring any of them. It is one SVG driven by a small physics loop, and it scales down as a whole to fit a phone screen.",
  useWhen: [
    "A product page needs to show that enquiries, orders and bookings reach the owner as they happen, without drawing yet another phone lock screen.",
    "A booking, ordering or form tool wants a hero object for its notifications feature.",
    "An agency site lists the channels a finished site handles and wants them as one object that moves.",
    "An activity feed on a dark landing page needs a calmer, more memorable stand-in than a scrolling list.",
  ],
  customize: [
    "The `bells` array holds each plate, the word shown on the slip and the notes it cycles through. Four fit the board; for five, lower `GAP` to about 136 and `X0` to 108.",
    "The ring is the `5.6` added to `m.av` in `ring`. The spring is `-430` (stiffness) and `-2.3` (damping) in the loop: lower the damping for a bell that shivers longer.",
    "The pendulum is the line with `-62` and `-0.42`. The second number is how fast it dies away, so `-0.2` roughly doubles how long it tells on a bell.",
    "Brass comes from the `-brass` gradient stops and the lacquer from `-board`. The pendulum bob is the `-bob` radial gradient built on `BLUE`.",
    "`SOUND` is off. Set it to `true` for a short synthesised strike on each ring, and only after you have a visible mute control on the page.",
    "The demo order is the `order` list and its pace is the `2900` passed to `loop`.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology and each bell has a real `button` over it with its own label, reachable by Tab and rung with Enter or Space.",
    "The slip is a polite live region, so each arrival is read out as text and nothing depends on seeing which pendulum is moving.",
    "With reduced motion nothing swings: the last bell to ring is marked by its brighter bob and glow, and the slip changes without sliding in. No sound plays unless you switch it on in code.",
  ],
  faqs: [
    {
      question: "How is the coiled spring animated?",
      answer: "The coil is a path rebuilt every frame from forty-five points on a spiral. The inner end is fixed and the total angle of the spiral grows or shrinks by the arm's current swing, so the turns tighten and relax instead of the whole coil rotating as a rigid picture.",
    },
    {
      question: "Why does the pendulum outlast the bell?",
      answer: "They are separate oscillators. The bell's spring is stiff and well damped, so it settles in about two seconds. The pendulum is slow and barely damped, and it is only nudged by the acceleration of the arm, so it carries on long after the arm is still.",
    },
    {
      question: "How do I ring a bell from real events?",
      answer: "Call `api.current?.ring(index)` from your own handler, for example when a form submission or order webhook reaches the page. Delete the `loop` call in the effect to stop the built-in demo, and pass your own text into `setLast` if the notes should come from your data.",
    },
    {
      question: "Does the animation run all the time?",
      answer: "No. The loop adds up the remaining movement of every bell and pendulum each frame and stops asking for frames once it falls below a small threshold. It also pauses while the board is scrolled out of view or the tab is hidden.",
    },
    {
      question: "Can I use it on a light background?",
      answer: "Yes, though the board itself should stay dark for the brass to read. Change the root background classes, keep the `-board` gradient, and lighten the large blurred shadow rectangle behind the board to around 0.25 opacity.",
    },
  ],
  related: ["white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive", "agent-switchboard-with-swaying-patch-cords-and-lamps-that-light-as-each-step-runs"],
  tags: ["notifications", "bell", "brass", "spring physics", "svg", "bookings", "orders", "small business"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
