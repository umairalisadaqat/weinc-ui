const meta = {
  slug: "sunlit-cast-resin-cube-pricing-in-webgl-where-a-shaft-of-window-light-picks-the-plan-and-the-cubes-tumble-over-to-yearly",
  category: "pricing",
  name: "Sunlit Cast Resin Cube Pricing in WebGL Where a Shaft of Window Light Picks the Plan and the Cubes Tumble over to Yearly",
  keyword: "webgl 3d pricing section react",
  title: "WebGL 3D Pricing Section with Resin Cubes in Sunlight | We.Inc",
  description: "Free React pricing section in raw WebGL: three cast resin cubes on stone, a shaft of sun that moves to the chosen plan, and cubes that tip over for yearly prices.",
  intro: "Three cubes of cast resin stand in a row on pale polished terrazzo in front of a green limewashed wall: a small one in cobalt, a middle one in orange and a large one in raspberry. Each has rounded, polished edges, a bubble or two trapped in the pour, a row of window panes mirrored in its top, and its plan name and price cast in white resin just under the face. A narrow window somewhere above the frame lets in one shaft of low sun, and that shaft lands on the plan that is chosen. Dust drifts through the beam. The lit cube glows from inside, throws a long tinted shadow toward the viewer and lights the stone and its neighbours with its own colour, while the other two wait in open shade. Pick another plan and the light swings across to it and the cube rocks once on its edge. Flip the billing switch and all three tip over their front edges, smallest first, to bring the yearly price round from the top face. The scene is one fragment shader; the plan picker underneath it is a plain radio group and the billing control is a real switch. On a phone the camera backs away so the row fits and the feature list drops below the picture.",
  useWhen: [
    "A pricing page has three tiers and you want the sizes of the plans felt before a single feature is read.",
    "The product is simple enough that one price, one sentence and four bullet points per plan say everything.",
    "A launch page needs a section people will play with, and the plan picker still has to work from the keyboard.",
    "You want monthly and yearly billing shown as one object with two faces instead of two columns of numbers.",
  ],
  customize: [
    "Everything a visitor reads comes from `product` and `plans` at the top: `monthly` and `yearly` are both monthly rates, `pitch` is the serif line, `features` fills the list, and the lettering inside the cubes is redrawn from the same numbers by `artwork`.",
    "`size` is the edge of each cube in metres and `GAP` the floor between them; the row recentres itself. `resin` is how strongly that block soaks up red, green and blue, so `[7.5, 3.3, 0.4]` is the cobalt block, `[0.1, 2.9, 5.0]` the orange one, and `[2.6, 0.5, 0.9]` would give a sea green.",
    "`WEIGHT` is gravity on the cubes and `BOUNCE` how much speed survives a landing. `SHAFT_SPRING` and `SHAFT_DAMPING` set how the light travels; lower the damping and it sails past the cube before coming back.",
    "The wall colour is the `alb` vector in `shadeWall`, the terrazzo binder and its chip colours are in `floorAlb`, and the sun's colour and strength are `SUN` in the shader header. The page ink is `#f6eedd` and the section colour `#163a2d`.",
    "Set `DEMO` to `false` to stop the piece playing through the plans by itself before anyone has touched it.",
  ],
  accessibility: [
    "The plan picker is a `fieldset` of three native radio inputs under the cubes, so arrow keys move between plans and the chosen one is announced. Pressing a cube in the picture does the same as its radio.",
    "Billing is a `button` with `role=\"switch\"` and `aria-checked`. The large price, its billing note and the plan's sentence sit in a polite live region and are read out after each change.",
    "The canvas is hidden from assistive technology. With reduced motion the cubes do not tip or rock, the light does not travel and the camera holds still: each change is drawn as one finished frame.",
  ],
  faqs: [
    { question: "How is the glow inside the cubes worked out?", answer: "For every pixel on a cube the shader bends the line of sight into the block, takes four points along it and asks how much resin lies between each point and the sun, the sky and a white card behind the camera. Light is dimmed by an exponential of that distance, with a different rate for red, green and blue. Thin places near the top edges therefore come out pale and bright, and the heart of the block is deep and saturated, which is how a real cast block behaves." },
    { question: "Why is the shadow coloured instead of grey?", answer: "Sun that reaches the stone behind a cube has passed through it. The floor shader intersects six slightly different sun rays with each cube, measures the length of resin every ray crossed and tints the light by that length. Near a corner the path is short, so the pool is pale; under the middle it is long, so the colour is deep. Rays that graze an edge of the block are dimmed, which draws the dark outline a real block throws. Spreading the six rays over the width of the sun gives an edge that is crisp at the cube and soft further away." },
    { question: "What moves the cubes when billing changes?", answer: "Each cube is a rigid block pivoting on its front bottom edge, which makes it an upside-down pendulum with two resting places a quarter turn apart. Changing the billing period applies a steady push until the cube passes its balance point, then gravity finishes the fall and the landing loses most of its speed. Because the sum uses the real edge length, the small cube tips fastest and the large one lands last and shakes the camera hardest." },
    { question: "Where is the yearly price before the cubes tip over?", answer: "It is cast under the top face, lying flat and readable from the front, and because it sits below the surface it slides against the reflections as the camera drifts. Tipping a cube forward brings that face round to the front, and the monthly price that was at the back comes up on top. So the price you are not paying is always visible on the cube, foreshortened, and tipping back restores the first arrangement." },
    { question: "Will it hold a steady frame rate on a laptop?", answer: "The cubes are found with an exact box test and then a few short steps for the rounded edges, and shadows and the look inside the blocks use closed-form box distances, so there is no long ray march anywhere. The picture is capped at about 2.1 million pixels, drawing stops when the section is off screen, and if frames start running long the resolution steps down by itself." },
    { question: "What happens without WebGL 2?", answer: "The radio group, the switch, the large price and the feature list are ordinary elements and keep working. Behind them a still scene made from gradients shows the wall, the stone, a wedge of light under the chosen plan and three flat-shaded cubes with their prices." },
  ],
  related: ["price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys", "brass-balance-scale-price-builder-with-feature-weights-and-coins-that-drop-until-the-beam-levels", "ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper"],
  tags: ["pricing", "webgl", "3d", "plans", "billing toggle", "physics", "translucent", "shadow"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
