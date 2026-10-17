const meta = {
  slug: "glass-tube-border-feature-card-in-webgl-with-a-warm-bead-of-light-that-runs-the-edge-and-warms-the-sunlit-table",
  category: "borders",
  name: "Glass Tube Border Feature Card in WebGL with a Warm Bead of Light That Runs the Edge and Warms the Sunlit Table",
  keyword: "animated border card react webgl",
  title: "Glass Tube Border Card in React and WebGL | We.Inc",
  description: "Free animated border card: a bead of warm light runs through a glass tube bent around a feature card on a sunlit oak table, faster under the pointer.",
  intro:
    "A thick paper-faced card stands on an oak table in late afternoon sun, and a clear glass tube is bent around its front edge like a frame. Inside the tube a small, hot bead of light travels the whole way round. The scene is ray-marched in raw WebGL 2 with a real camera: the card throws a soft shadow across the planks, the tube throws a darker outline with a bright line of focused sun inside it, the varnish mirrors the card, and the far wall falls out of focus. Point at the card or tab to its link and the bead speeds up, overshoots a little and settles into a quick lap, and the places it has just passed keep a warm glow on the table and the paper that fades over a few seconds. The heading, paragraph and link are ordinary HTML laid onto the card face with a CSS projective matrix, so they stay selectable and readable by screen readers. On phones the card turns upright and the camera moves back, and browsers without WebGL 2 get a flat version with the same words.",
  useWhen: [
    "A product page has one feature worth stopping for and you want its card to feel like an object in a room rather than a box with a glowing outline.",
    "Your brand is warm and material, with paper, wood and daylight, and the usual animated gradient border would clash with it.",
    "You want a border effect that reacts to attention: quiet while a visitor reads, lively when they reach for the link.",
    "You need depth, soft shadows and reflections in a single section without adding a 3D library to the bundle.",
  ],
  customize: [
    "Edit the `card` object at the top for the kicker, heading, paragraph, link label and maker line. The heading is set at 47px on desktop and 37px on phones in `CardText`; keep it to about eight words so it fits two lines.",
    "`IDLE_SPEED` and `HOVER_SPEED` are laps per second. `SPEED_SPRING` and `SPEED_DAMP` shape how the bead takes off; drop `SPEED_DAMP` toward 4 for a springier overshoot.",
    "`WARM_DECAY` sets how many seconds the glow on the table lingers, and `DEMO_EVERY` how often an automatic fast lap plays when nobody is interacting.",
    "Card size, corner radius, thickness and turn live in the `WIDE` and `TALL` layouts (`hx`, `hy`, `rc`, `th`, `yaw`); `tr` is the tube radius. The bead colour is `WARM` in the fragment shader and the sun is the `Lraw` direction with the `uSun` colour.",
    "The wood is built in the `wood` function of the shader: change the two colours in its `mix` for a darker walnut or a pale ash, and the `4.4` for wider or narrower planks.",
  ],
  accessibility: [
    "All the words on the card are real text in a heading, a paragraph and a link, so they are read in order and can be selected and translated. The canvas is hidden from assistive technology.",
    "Keyboard focus on the link has the same effect as pointing at the card, and a visible ring shows where focus is. On touch screens a tap on the scene toggles the fast lap.",
    "With reduced motion the bead is parked at one place on the edge with its warm trail already laid down, and the scene is drawn once without camera drift or moving leaf shade.",
  ],
  faqs: [
    {
      question: "How is the text kept sharp on a 3D card?",
      answer:
        "The text is not in the WebGL picture. Each frame the four corners of the card's writing area are projected through the same camera the shader uses, and a CSS `matrix3d` maps the HTML block onto that four-sided shape. `mix-blend-mode: multiply` lets the sun, the shade and the bead's glow show through the ink.",
    },
    {
      question: "Why does the tube's shadow have a bright line in the middle?",
      answer:
        "A glass cylinder acts like a lens. The shadow test records how deep a sun ray passes through the tube: rays near its edge are bent away and leave a darker outline, while rays near its axis are focused, so the shader adds a narrow bright band there. It is a cheap stand-in for a real caustic, and it is what makes the glass read as glass.",
    },
    {
      question: "Is the warm glow on the table a texture?",
      answer:
        "No. The edge is divided into 24 places that each hold an amount of warmth. The bead adds to the places it crosses, faster laps add more, and every place fades on its own. The shader treats each one as a small warm lamp sitting in the tube, lighting the paper and the planks with distance falloff.",
    },
    {
      question: "Will it run well on an ordinary laptop?",
      answer:
        "The picture is limited to about 1.1 million pixels and a device pixel ratio of 1.5, and the loop watches its own frame time and renders fewer pixels if frames start taking too long. It stops completely when the section scrolls out of view or the tab is hidden.",
    },
    {
      question: "Can I put a different card inside the tube?",
      answer:
        "Yes. Replace the contents of `CardText` with any markup that fits the writing area, which is 620 by about 340 CSS pixels on desktop and 340 by about 500 on phones. The tube follows whatever card size you set in the layouts, so a square card only needs new `hx` and `hy` values.",
    },
  ],
  related: [
    "framed-portrait-testimonials-in-webgl-with-a-leaning-two-sided-frame-that-swings-on-its-corner-and-claps-back-onto-a-sunlit-wall",
    "glass-prism-that-splits-a-beam-carrying-one-sentence-into-a-homepage-made-of-light",
  ],
  tags: ["border", "glass", "webgl", "glow", "feature card", "animated", "ray marching"],
  height: 680,
  section: true,
  interactive: true,
};

export default meta;
