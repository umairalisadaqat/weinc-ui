const meta = {
  slug: "website-rack-with-feature-units-that-slide-home-on-rails-and-light-up-as-sections-of-the-page",
  category: "originals",
  name: "Website Rack with Feature Units That Slide Home on Rails and Light up as Sections of the Page",
  keyword: "css 3d rack drawer animation react",
  title: "React CSS 3D Rack with Slide-In Feature Units | We.Inc",
  description: "A 3D equipment rack whose front is a bakery's web page: Shop, Blog and Contact units slide in on rails and light up as sections. Free React and HTML code.",
  intro: "A dark metal rack stands at an angle on a pale blue stage, built from real CSS 3D faces so you see its top, its side with cooling slots and its front. The top panel of the front is fixed and shows the menu and hero of a made-up bakery. Below it are three bays, each holding a cream unit with a handle, a lamp and a glass window. A unit that is drawn out stands proud of the rack, showing a brushed lid with a large paper label and a steel slide rail down its side, and its window reads \"Not connected\". Press it and it rolls back on a spring. When it reaches the back the lamp turns blue and the window wipes on as a section of the page: three loaves to buy, a post from the bakehouse, or a short contact form. The rack turns a few degrees towards the pointer. On phones the whole object scales down as one drawing.",
  useWhen: [
    "You want to show that a page is a stack of sections and that a new one can be slotted in without disturbing the rest.",
    "A product page about modular features needs a hero with real depth and a visitor who can pull the parts in and out.",
    "A developer-facing page wants hardware imagery for something that is really about page sections.",
    "You need a CSS 3D example that uses separate top, side and front faces and still works without WebGL.",
  ],
  customize: [
    "`units` sets the bays, and `content` holds the markup shown in each window, keyed by the same `id`.",
    "`OUT` is how far a drawn unit stands out in pixels, and `D` is the depth of the cabinet and of each unit's lid.",
    "The resting view is `-26` degrees around the vertical axis and `-21` around the horizontal one. Change both numbers wherever they appear to look from the other side or from higher up.",
    "`PLATE` is the cream faceplate finish and `METAL` the dark frame. The stage colour is the `#D7E3F4` background on the root element.",
    "The hero sentence, the name on the menu and the three products come from `headline`, `bakery` and `loaves`.",
  ],
  accessibility: [
    "Each faceplate is a `button` with `aria-pressed`, labelled \"Shop unit\", \"Blog unit\" or \"Contact unit\", and is reachable in page order with the Tab key.",
    "Window contents are decorative and hidden from screen readers, and a polite live line says which unit was drawn out or pushed home.",
    "With reduced motion the rack is shown with every unit home, it does not turn towards the pointer, and units change position without a spring.",
  ],
  faqs: [
    {
      question: "How is the 3D built without a 3D library?",
      answer: "Every box is three flat elements. The front sits in place, the top is hinged on its upper edge with `rotateX(90deg)` after being moved back by its own depth, and the side is hinged on its left edge with `rotateY(90deg)`. A parent with `transform-style: preserve-3d` and a `perspective` on the stage does the rest.",
    },
    {
      question: "Why is the front frame made of separate strips?",
      answer: "A single frame element would be one large rectangle in 3D space, and the lids of the sliding units would pass straight through it. Browsers handle that case, but separate strips around the bays avoid it entirely and keep the stacking predictable.",
    },
    {
      question: "Is the text on the angled faces sharp?",
      answer: "The piece is drawn at 500 pixels and scaled up to 1.3 times on wide screens, and text on the front faces stays readable at that size. For a very large hero, raise the base sizes in the markup and keep the scale near 1.",
    },
    {
      question: "Can I add a fourth unit?",
      answer: "Add an entry to `units` and a matching key in `content`. The cabinet height `CH` is computed from the number of units, so the frame, the side panel and the shadow grow with it.",
    },
    {
      question: "Does it work on touch screens?",
      answer: "Yes. Tapping a faceplate moves that unit. Only the turn towards the pointer is skipped for touch, so the rack keeps its resting angle.",
    },
  ],
  related: ["website-console-with-feature-cartridges-that-click-into-slots-and-switch-on-sections-of-the-screen", "valve-chassis-where-glass-feature-tubes-plug-in-warm-up-and-light-parts-of-a-site-on-a-blue-display", "phone-game-built-from-stacked-glass-layers-that-press-together-into-a-playable-screen"],
  tags: ["originals", "features", "rack", "css 3d", "modules", "sections", "website"],
  height: 820,
  interactive: true,
};

export default meta;
