const meta = {
  slug: "glazed-stoneware-jar-pricing-in-webgl-where-the-chosen-jar-rocks-forward-on-a-pastel-shelf-and-fills-with-honey",
  category: "pricing",
  name: "Glazed Stoneware Jar Pricing in WebGL Where the Chosen Jar Rocks Forward on a Pastel Shelf and Fills with Honey",
  keyword: "webgl pricing section with 3d jars",
  title: "WebGL Pricing Section with Glazed Jars on a Shelf | We.Inc",
  description: "Free React pricing section in raw WebGL: three glazed stoneware jars on a mint shelf in window light; the chosen jar rocks forward and fills with honey.",
  intro: "Three wheel-thrown stoneware jars stand in a row on a painted mint shelf against a pink plaster wall: a short one in speckled oatmeal glaze, a middle one in apricot and a tall one in cobalt. Each jar carries its plan name and an example monthly price painted on the belly in white slip. Afternoon sun comes in through a casement window to the left, so the glazing bars and the leaves of a sill plant lie across the wall, and each jar throws a long soft shadow to the right. The glaze has a bare clay foot with a wavy drip line, darker pools where it ran thick, iron specks from the clay and a clear coat that mirrors the window. Pick a plan and its jar rocks forward on the front of its foot, rocks once onto its back edge and settles, while a thin thread of honey pours in from above and the level rises. The honey lags as the jar moves and slops back. The whole scene is a single ray-marched fragment shader with soft shadows, ambient occlusion and a short depth of field; the plan picker under the jars is a native radio group. On phones the camera backs away so all three jars fit, and the feature list and button drop below the picture.",
  useWhen: [
    "A food, kitchen or shop product wants its pricing to feel made by hand rather than printed in a grid.",
    "There are exactly three plans and the step up in size from one to the next is the point you want people to feel.",
    "You want a pricing block with one memorable moment that still works fully from the keyboard and a screen reader.",
    "A demo or launch page needs placeholder prices that are visibly marked as examples until the real ones are agreed.",
  ],
  customize: [
    "Names, prices, sentences and features live in `plans` at the top. The painted lettering on the jars is drawn from the same values by `artwork`, so changing `price` updates the jar and the large number together.",
    "`radius` and `height` set each jar in metres and `GAP` the shelf between them; the row recentres itself. `glaze` is the base colour in linear RGB, so `[0.32, 0.52, 0.42]` gives a celadon green.",
    "`ROCK` is how far the chosen jar tips forward in radians and `BOUNCE` how lively the landing is. `FILL_SECONDS` sets how long the honey takes to rise.",
    "The wall and shelf colours are in `wallAlb` and `shelfAlb` in the shader; the section background behind the canvas is the `WALL` constant, and the type colour is `INK`.",
    "Set `DEMO` to `false` if the jars should wait for a visitor instead of taking turns on their own.",
  ],
  accessibility: [
    "The plans are three native radio inputs in a `fieldset` with a hidden legend, positioned under their jars, so Tab reaches the group and the arrow keys change plan. Clicking a jar in the picture does the same thing.",
    "The large price, its note and the plan sentence sit in a polite live region that switches on after the first interaction, so the self-playing demo does not talk over a page.",
    "The canvas is hidden from assistive technology. With reduced motion the jars do not rock, no honey pours and the camera stays still; each change is drawn as one finished frame.",
  ],
  faqs: [
    { question: "How are the jars modelled without a 3D library?", answer: "Each jar is a profile curve spun around its axis: a belly, a shoulder, a wide neck and a rolled lip, measured as a distance from any point in space. The inside is the same curve pulled in by the wall thickness, subtracted from the outside, so the opening is real and you can look down into the honey. The shader steps along each pixel's ray using those distances until it touches a surface." },
    { question: "Why does the jar rock back instead of falling over?", answer: "When a jar tips onto the front of its foot, its centre of mass is still behind that edge, so gravity pulls it upright again. The code treats it as an upside-down pendulum on that edge, gives it just enough speed to reach the `ROCK` angle, and keeps a share of the speed on landing so it rocks once onto the back edge before it stops." },
    { question: "How does the honey stay level when the jar moves?", answer: "The honey is the inside of the jar cut by a flat plane that is set in world space, not in the jar's own frame, so it stays horizontal while the jar tips. A small spring is driven by the jar's angular acceleration and tilts that plane a little, which is the slop you see after each landing." },
    { question: "Where do the shadows from the window come from?", answer: "The sun has a fixed direction from the upper left. For any lit point the shader projects it along that direction onto a plane and checks it against two casement leaves with glazing bars and a noise pattern for the sill plant. A short soft-shadow march toward the sun against the jars gives the long shadows on the wall and the darker contact under each foot." },
    { question: "Are the prices real?", answer: "No. The demo prices are examples, and the piece says so in a badge at the top, beside the large price and on each jar. Put your own values in `plans` before using it on a live page." },
    { question: "What does a browser without WebGL 2 see?", answer: "The radio group, the price, the sentence, the feature list and the button are ordinary page elements and keep working. Behind them a still made from CSS gradients shows the wall, the mint shelf and three rounded jars with their names and prices." },
  ],
  related: [
    "sunlit-cast-resin-cube-pricing-in-webgl-where-a-shaft-of-window-light-picks-the-plan-and-the-cubes-tumble-over-to-yearly",
    "brass-balance-scale-price-builder-with-feature-weights-and-coins-that-drop-until-the-beam-levels",
    "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge",
  ],
  tags: ["pricing", "webgl", "3d", "plans", "ceramic", "physics", "ray marching", "shadow"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
