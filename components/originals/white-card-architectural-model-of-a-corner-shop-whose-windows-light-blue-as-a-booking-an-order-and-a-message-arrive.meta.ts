const meta = {
  slug: "white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive",
  category: "originals",
  name: "White Card Architectural Model of a Corner Shop Whose Windows Light Blue as a Booking, an Order and a Message Arrive",
  keyword: "css 3d building model react",
  title: "React CSS 3D Building Model with Lit Windows | We.Inc",
  description: "A white card model of a corner shop in CSS 3D whose windows light blue as a booking, order and message land. Free React and HTML code.",
  intro: "A small business website shown as the thing architects make before a building exists: a white card model on a grey board. It is a two-storey corner shop with a fascia, an awning, a flat roof behind a parapet, two scale figures on the pavement and a slotted card tree. Every wall is a real plane in CSS 3D space, so the model turns on its board, the openings show the thickness of the card, and the loaves on the shelves slide against the room behind them as it moves. Three things can arrive: a booking, an order and a message. Each one lights a room from inside in blue, spills a little colour onto the card round the window, throws light across the board, and stands a paper flag up on its pin. The slips under the model say what came in, for an invented bakery, and each slip is a button. On a phone the whole model is scaled to the width of the screen and the slips stack into a column.",
  useWhen: [
    "A site builder, booking tool or shop platform wants one picture that says a finished site keeps working after it is published.",
    "A local business template needs a hero object that is about premises and customers, not screens.",
    "A features section lists bookings, orders and enquiries and would be stronger as three lamps on one object than as three icon cards.",
    "A status or activity widget on a marketing page should feel like a place and not a dashboard.",
  ],
  customize: [
    "The three slips and flags come from the `arrivals` array. Add a fourth only if you also cut a fourth opening, since each entry lights the room with the same index.",
    "`W`, `H` and `D` are the building and `BW` and `BD` the board. The openings are the `UP_L`, `UP_R`, `SHOPWIN`, `DOOR` and `SIDE_WIN` rectangles, cut into panes by the `panes` helper.",
    "`TILT` is how far the camera looks down and `HOME` the resting turn. The sway is the `6 * Math.sin` term and the turntable spring is the `26` and `7.5` beside it.",
    "The light is the `LIT` gradient and the three `rgba(79,152,251,...)` halos. Swap `BLUE` and those values together for a warm tungsten model.",
    "Timing lives in the `steps` list: the first number is how long the fully lit model is held before the demo clears it.",
  ],
  accessibility: [
    "The model is decorative and hidden from assistive technology. The three slips are real buttons with `aria-pressed`, and they carry the same information as the lit rooms in text.",
    "A polite status line announces each arrival that a visitor triggers, so the change is not signalled by colour alone.",
    "With reduced motion the model sits still at its resting angle with every room lit, the flags do not swing up, and the buttons switch rooms instantly.",
  ],
  faqs: [
    {
      question: "How are the window openings cut out of a CSS plane?",
      answer: "Each windowed wall is an SVG path that draws the outline of the sheet and then every pane, filled with the even-odd rule so the panes become holes. Three copies sit two pixels apart in depth, the back two darker, which is what reads as the cut edge of thick card.",
    },
    {
      question: "Why do the lit rooms look like they are inside the building?",
      answer: "The glow is not painted on the wall. It is a separate plane sixteen pixels behind the sheet, slightly larger than the opening, so when the model turns you see it shift behind the glazing bars the way a real room does.",
    },
    {
      question: "Does it need WebGL or a 3D library?",
      answer: "No. It is ordinary `div` elements placed with `translate3d`, `rotateX` and `rotateY` inside one `preserve-3d` parent. The only script is a small spring that writes one transform a frame, and it stops when the model is off screen.",
    },
    {
      question: "How do I light a room from my own data?",
      answer: "Call `setLit` with three booleans from wherever your events arrive, for example a websocket handler. Remove the `steps` timer in the effect so the demo does not overwrite your state.",
    },
    {
      question: "Can visitors turn the model on a touch screen?",
      answer: "Yes. A horizontal drag anywhere on the model turns it, with the turn limited so the unglazed back never faces the camera. Vertical swipes are left alone so the page still scrolls.",
    },
  ],
  related: ["steel-roller-shutter-stencilled-draft-that-rattles-up-to-show-a-lit-shop-window-holding-the-live-site", "layered-plywood-relief-island-model-with-walking-routes-lit-bulb-by-bulb-on-a-walnut-plinth", "website-rack-with-feature-units-that-slide-home-on-rails-and-light-up-as-sections-of-the-page"],
  tags: ["3d", "model", "shop", "bookings", "orders", "messages", "small business", "css 3d"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
