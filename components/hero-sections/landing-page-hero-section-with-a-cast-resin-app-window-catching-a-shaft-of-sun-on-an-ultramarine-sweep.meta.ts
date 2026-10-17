const meta = {
  slug: "landing-page-hero-section-with-a-cast-resin-app-window-catching-a-shaft-of-sun-on-an-ultramarine-sweep",
  category: "hero-sections",
  name: "Landing Page Hero Section with a Cast Resin App Window Catching a Shaft of Sun on an Ultramarine Sweep",
  keyword: "landing page hero section",
  title: "Landing Page Hero Section with a Photoreal Resin App Window | We.Inc",
  description: "Free React hero section: headline, two calls to action and a trust line beside a WebGL slab of amber resin shaped like an app window, lit by low sun.",
  intro: "A SaaS landing hero split into two halves. On the left sit a small announcement pill, a large headline, one supporting paragraph, a filled primary button, an outlined secondary button and a quiet line that says what it costs to try. On the right a slab of tangerine cast resin, cut like an app window with a title bar groove and three dimples for the window buttons, stands on a seamless ultramarine paper sweep. A low sun from behind it comes through a mullioned window above the frame, so the slab glows from inside, the bars of the window cross its face, and the panels of an interface cast in white resin inside it are thrown forward across the floor as a pool of warm, tinted light. The picture is one fragment shader that averages jittered frames until it is clean, then stops drawing. Move the mouse across the hero and the sun drifts with it. On a phone the copy comes first and the slab stands below it.",
  useWhen: [
    "The first screen of a product site needs one memorable image instead of a screenshot or a stock illustration.",
    "You sell a builder, an editor or any tool that makes screens, and an app window made as a physical object says that without a word.",
    "A launch page where the headline and two buttons must stay readable and keyboard friendly while the visual does the talking.",
    "You want a reference for putting real HTML copy and links over a WebGL scene without hurting search or accessibility.",
  ],
  customize: [
    "All the words live in the `copy` object at the top: brand, sign in link, announcement pill, headline, paragraph, both buttons with their `href`, and the trust line.",
    "`RESIN_ABS` is how strongly the resin soaks up red, green and blue per centimetre. `vec3(0.012, 0.16, 0.42)` is tangerine; `vec3(0.4, 0.1, 0.02)` turns it sea blue, and higher numbers make it deeper.",
    "`FIELD` is the colour of the paper sweep in linear light. Change it together with the section's `bg-[#0d1838]` so the edges and the fallback match.",
    "`SLAB` sets the half width, half height and half depth of the block in centimetres and `turn` how far it is rotated. The interface inside it is drawn by `interfaceArt`: each `block` call is one panel and its last number is how milky it is.",
    "Set `SUN_FOLLOWS_POINTER` to `false` to keep the light still. `KEY_DIR` in the rig settings moves the sun, and `WIN_HALF` sets the size of the window it shines through.",
  ],
  accessibility: [
    "The headline is a real `h1` and both calls to action are ordinary links with visible focus rings, so the hero reads and tabs in order before any picture loads.",
    "The canvas is hidden from screen readers; it carries no information the copy does not.",
    "With reduced motion, or on touch screens, the light does not follow the pointer. Without WebGL 2 the slab becomes a plain orange panel on a blue gradient with the same copy in place.",
  ],
  faqs: [
    { question: "What goes into a good landing page hero section?", answer: "One sentence that says what the product does for the visitor, a short paragraph that backs it up, one main action and at most one secondary action, and something that lowers the risk of clicking, such as a free start. This hero keeps exactly those parts and gives the remaining space to one image." },
    { question: "Will the WebGL picture slow the page down?", answer: "The copy is plain HTML and renders first. The canvas caps its own resolution, lowers it if frames run long while the light moves, pauses when it is off screen or the tab is hidden, and stops drawing completely once the image has settled, usually within about a second." },
    { question: "How is the tinted light on the floor made?", answer: "For every point on the floor the shader follows a ray toward the sun. If that ray passes through the slab, the light is dimmed by how far it travelled through the resin, more for blue than for red, and blocked where it meets the white panels inside. That is why the floor shows the interface as a warm shadow pattern." },
    { question: "Can I use a photo or video instead of the resin slab?", answer: "Yes. Delete the canvas and the effect hook and put an image in the same container. The layout, copy and buttons do not depend on the scene, so the hero keeps working as a regular split hero." },
    { question: "Is the text good for SEO?", answer: "Yes. The headline, paragraph and links are in the HTML from the first render, so search engines and screen readers see the same words visitors do. Nothing important is drawn into the canvas." },
  ],
  related: [
    "sunlit-cast-resin-cube-pricing-in-webgl-where-a-shaft-of-window-light-picks-the-plan-and-the-cubes-tumble-over-to-yearly",
    "big-headline-hero-with-stats-row",
    "app-landing-hero-with-phone-mockup",
  ],
  tags: ["hero", "landing page", "webgl", "3d", "photoreal", "resin", "saas"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
