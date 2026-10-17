const meta = {
  slug: "valve-chassis-where-glass-feature-tubes-plug-in-warm-up-and-light-parts-of-a-site-on-a-blue-display",
  category: "originals",
  name: "Valve Chassis Where Glass Feature Tubes Plug In, Warm Up and Light Parts of a Site on a Blue Display",
  keyword: "feature toggle animation react glow",
  title: "React Feature Toggle Animation with Glowing Tubes | We.Inc",
  description: "Glass valves for bookings, shop, blog and contact plug into a metal chassis, warm to a blue glow and light parts of a site. Free React and HTML to copy.",
  intro: "On a near-black stage sits a low anodised chassis with four round sockets on its deck and a strip of black glass in its face. Four glass valves hang above the sockets, each with a grey metal plate inside that has a symbol cut through it: a calendar, a shopping bag, lines of text and an envelope. Press a valve and it drops into its socket. The cut-out symbol stutters up to a blue-white glow the way a heater comes to temperature, light blooms around the glass and spills down the front of the chassis, and one cell of the display wakes up. The display is a small fluorescent drawing of a surf school's home page, with unlit parts left faintly visible. Press a seated valve and it lifts out, tilts and goes cold. Without input the piece seats all four, then pulls and replaces one at a time. It is drawn 520 pixels wide and scaled as one object on phones.",
  useWhen: [
    "A dark landing page needs a centrepiece about switching capabilities on, and a row of toggle switches would look ordinary.",
    "You are explaining that a site keeps working while individual features are added or removed.",
    "A settings or extras page wants a playful header where each part of the product is a thing you can pull out and put back.",
    "A launch post needs a short looping clip with real glow and glass in it.",
  ],
  customize: [
    "`parts` names the valves. `name` is printed on the bakelite base and read to screen readers; `tag` is the word on the display cell and in the tiny menu.",
    "Symbols are drawn in `Glyph` on a 24 unit grid. Add a branch for a new `id` and the plate and its glow pick it up.",
    "The warm-up stutter is the opacity list in `Warm`: `[0, 0.5, 0.2, 0.8, 0.62, 1]`. Replace it with `[0, 1]` for a clean fade.",
    "`LIFT` is how high a pulled valve hangs. The small tilt comes from the `rotate` value of 2.2 degrees beside it.",
    "`headline` and `school` set the words on the display. `LIT` is the colour of lit segments; the halo colours are the `rgba(79,152,251,...)` values.",
  ],
  accessibility: [
    "Each valve is a `button` with `aria-pressed` and a name such as \"Shop valve\", with a two-colour focus ring drawn around the glass so it shows on the dark stage.",
    "The display and all glow layers are hidden from assistive technology, and a polite live line reports which valve was pulled or seated.",
    "Under reduced motion the chassis opens with every valve seated and lit, the flicker is replaced by an instant change, and the display stops animating.",
    "Engraved captions use off-white at reduced opacity on the dark panel, which keeps them readable while still looking stamped into metal.",
  ],
  faqs: [
    {
      question: "Is the glass drawn with WebGL?",
      answer: "No. Each valve is a rounded element with an inset outline, two vertical highlight streaks, a soft band on the far side and a silver gradient in the crown for the getter flash. The glow is three radial gradients: one inside the bottle, one around it and one on the socket.",
    },
    {
      question: "How does the symbol inside the valve light up?",
      answer: "The symbol is drawn twice in the same place. The lower copy is nearly black, like a hole cut in the plate. The upper copy is pale blue with two drop shadows, and only its opacity is animated.",
    },
    {
      question: "Why are unlit display cells still slightly visible?",
      answer: "Every cell renders its drawing once at 13 percent opacity and once at full brightness inside the glow wrapper. Real fluorescent displays show their cold segments faintly, and keeping them makes the lit state read as light and not as content appearing.",
    },
    {
      question: "Can I wire the valves to real settings?",
      answer: "`seated` is an array of four booleans in the root component. Initialise it from your own data and call your save function inside `toggle`, where the state is already being updated.",
    },
    {
      question: "What moves when I move the mouse?",
      answer: "Only the highlight streaks on the glass. The root writes the pointer's horizontal position into a CSS variable and the streaks shift up to seven pixels, which is enough to make the glass feel curved.",
    },
  ],
  related: ["website-console-with-feature-cartridges-that-click-into-slots-and-switch-on-sections-of-the-screen", "agent-switchboard-with-swaying-patch-cords-and-lamps-that-light-as-each-step-runs", "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob"],
  tags: ["originals", "features", "valve", "glass", "glow", "dark", "website"],
  height: 820,
  interactive: true,
};

export default meta;
