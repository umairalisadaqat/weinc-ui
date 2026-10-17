const meta = {
  slug: "silver-cloche-pricing-in-webgl-where-the-chosen-dome-lifts-off-its-plate-on-a-white-tablecloth-in-window-light",
  category: "pricing",
  name: "Silver Cloche Pricing in WebGL Where the Chosen Dome Lifts Off Its Plate on a White Tablecloth in Window Light",
  keyword: "webgl pricing section with silver cloches",
  title: "WebGL Pricing Section with Silver Cloches | We.Inc",
  description: "Free React pricing section in raw WebGL: three polished silver cloches on a linen tablecloth; choosing a plan lifts its dome to show the price on the plate.",
  intro: "Three spun silver cloches sit on white porcelain plates along a pressed linen tablecloth, each one a size larger than the last. Daylight comes in through a tall sash window on the left, so the glazing bars lie across the cloth, the ironed fold lines catch the light and every dome throws a soft shadow toward you. The silver mirrors the whole room: the window as a bright panel, the dark panelling behind the camera, the white cloth along its lower half and its neighbours on either side. Choose a plan and its cloche dips a few millimetres, as a waiter's hand would, then rises and tips its front edge up while drawing back, so you look straight down at the plate. The plan name, an example monthly price and the word example are piped on the plate in dark chocolate. The previous dome drops back onto its plate with a small damped settle. The scene is one ray-marched fragment shader with soft shadows, ambient occlusion, a traced reflection bounce and a shallow depth of field, and the picker under the plates is a native radio group. On phones the camera pulls back so the three plates fit, and the feature list moves below the picture.",
  useWhen: [
    "A restaurant, hotel or hospitality product wants its plans to feel like a course being served rather than a row of cards.",
    "You have three tiers and want the moment of choosing one to feel like a reveal.",
    "A pricing block needs one striking visual on a launch page but must still work from the keyboard and with a screen reader.",
    "Prices are not settled yet and the placeholders must be clearly labelled as examples on the picture and in the text.",
  ],
  customize: [
    "Plan names, prices, pitches and features live in `plans` at the top. The chocolate lettering on each plate is drawn from the same values by `artwork`, so editing `price` changes the plate and the large number together.",
    "`dome` is each cloche radius in metres; the plate is `PLATE(dome)` and `GAP` is the cloth between plates. The row recentres itself when you change them.",
    "`LIFT` sets how high the chosen dome rises and `TILT` how far its front edge tips up. The spring constants inside `physics` control the overshoot and the settle when a dome comes down.",
    "The cloth colour is `clothAlb` in the shader and `CLOTH` behind the canvas; the room the silver reflects is painted in `env`, so a brighter or warmer room changes the look of the metal at once.",
    "Set `DEMO` to `false` if the domes should wait for a visitor instead of lifting in turn.",
  ],
  accessibility: [
    "The plans are three native radio inputs inside a `fieldset` with a hidden legend, placed under their plates, so Tab reaches the group and the arrow keys move between plans. Clicking a dome or plate in the picture selects the same radio.",
    "The large price, its label and the pitch sit in a polite live region that only turns on after the first interaction, so the self-playing demo stays quiet for screen reader users.",
    "The canvas is hidden from assistive technology. With reduced motion there is no dip, lift or settle and the camera holds still; each choice is drawn as a single finished frame with the chosen dome already raised.",
  ],
  faqs: [
    { question: "How is a cloche built without a 3D library?", answer: "The dome is half an ellipsoid turned into a thin shell by taking the absolute distance to its surface and subtracting the metal thickness. A small torus forms the rolled bead at the rim and a thinner one the decorative band above it, and the knob is a squashed sphere blended into a short stem. All of it is measured as distances, which the shader walks along each pixel's ray." },
    { question: "Why does the silver look like metal and not grey paint?", answer: "Metal has no diffuse colour of its own, so the dome is lit only by what it reflects. Each silver pixel sends a second ray into the scene: it can hit a neighbouring cloche, a plate or the cloth, or escape into a painted room with a bright window and dark panelling. That contrast between bright and dark reflections is what reads as polish." },
    { question: "How does the lift move?", answer: "The height follows an underdamped spring, so the dome overshoots slightly and settles. The tilt is a second, looser spring that is pushed by the lift speed, which makes it trail behind like a wrist following an arm. A short dip before the rise gives the anticipation, and a dome coming down meets its plate with a small damped bounce." },
    { question: "How does the price get onto the plate?", answer: "A canvas is drawn once with the plan name, price and label for each plan, stacked as three squares and uploaded as a texture. The plate shader looks it up from the point's position on the plate well, so the lettering follows the plate in perspective and goes soft with the depth of field." },
    { question: "Are these prices real?", answer: "No. They are examples, and the piece says so in the badge at the top, next to the large price and on every plate. Replace them in `plans` before using the section on a live page." },
    { question: "What does a browser without WebGL 2 show?", answer: "The radio group, price, pitch, features and button are ordinary page elements and keep working. Behind them a still built from CSS gradients shows the cloth, three silver domes on plates and the chosen dome raised with its price showing." },
  ],
  related: [
    "glazed-stoneware-jar-pricing-in-webgl-where-the-chosen-jar-rocks-forward-on-a-pastel-shelf-and-fills-with-honey",
    "sunlit-cast-resin-cube-pricing-in-webgl-where-a-shaft-of-window-light-picks-the-plan-and-the-cubes-tumble-over-to-yearly",
    "three-glass-cake-domes-on-ceramic-stands-each-keeping-a-different-site-design-where-the-dome-lifts-off-the-one-you-choose",
  ],
  tags: ["pricing", "webgl", "3d", "plans", "silver", "reflection", "ray marching", "restaurant"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
