const meta = {
  slug: "raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow",
  category: "backgrounds",
  name: "Raked Zen Sand Garden WebGL Background with Basalt Stones and a Slow Turning Sun Shadow",
  keyword: "zen garden background animation",
  title: "React Zen Garden Background Animation in WebGL | We.Inc",
  description: "Zen garden background: a WebGL shader rakes pale sand around dark basalt stones and a low sun swings their shadows slowly round. Free React and HTML code.",
  intro: "A dry garden seen from directly above: pale sand combed into even lines, three dark stones, and five rings raked around each stone where the straight lines stop. A low sun rakes across it, so every ridge has a lit side and a shaded side, the stones throw long shadows over the furrows, and single grains glitter. The sun is not fixed. It swings round and sinks over about half a minute and comes back, which makes the shadows turn and stretch like a sundial. In the top corner the soft shade of an overhanging branch shifts as if in a light wind. Point at the block and the sun moves to stand where the pointer is. Apart from one small caption the block is empty. On phones the stones keep their place as a share of the block, so all three stay in frame.",
  useWhen: [
    "A wellness, meditation, tea, ceramics or architecture page wants a pale, quiet surface with real texture.",
    "You need a light background, where most shader backgrounds are dark.",
    "A page about time, patience or craft could use a visual that changes slowly enough to be noticed only on a second look.",
    "You want the pointer to move the light source instead of dragging shapes about.",
  ],
  customize: [
    "`garden.stones` lists the stones. `x` and `y` run from -0.5 to 0.5 across the block, `size` is the radius in rake lines, `stretch` lengthens it, `turn` rotates it and `height` sets how long a shadow it throws.",
    "`garden.grooves` is the number of rake lines across the short side, and `garden.rings` how many circle each stone. Try `22` and `3` for a coarse bamboo rake.",
    "`garden.relief` is the depth of the furrows. Small values look freshly smoothed; large ones give hard stripes of shadow.",
    "`garden.sand`, `garden.skylight` and `garden.stone` are the three colours. A grey `sand` of `[0.78, 0.78, 0.76]` gives crushed granite; `skylight` tints everything the sun does not reach.",
    "`garden.canopy` is the darkness of the branch shadow. Set it to `0` for open sky.",
  ],
  accessibility: [
    "The drawing is decoration only: the canvas and its CSS stand-in carry `aria-hidden` and let clicks pass through.",
    "Sand is light and stones are dark, so text placed straight on the garden can lose contrast as you scroll or resize. The caption solves it with a dark pill; keep that pattern.",
    "With reduced motion the sun stays where it starts and the branch shadow holds still.",
  ],
  faqs: [
    { question: "How are the rake lines drawn around the stones?", answer: "For every pixel the shader finds the distance to the edge of the nearest stone. Within five lines of a stone that distance is used to place the ridges, which makes rings that follow the stone's own outline. Further out, the ridges follow a nearly straight coordinate with a slight hand-made wobble. The switch between the two is abrupt on purpose, as it is in a real garden." },
    { question: "Are the shadows real or painted on?", answer: "They are worked out. From each pixel the shader takes eighteen steps toward the sun and checks the height of the garden at every step. If a stone or the next ridge of sand stands above that line, the pixel is in shade, and how narrowly the line clears decides how soft the edge is. That is why the shadows lengthen when the sun drops." },
    { question: "What makes the sand look grainy instead of smooth?", answer: "Each pixel tilts its surface by a small random amount before lighting, so neighbouring grains catch the sun differently. A few pixels are darkened as flecks and a few facing the sun are brightened as glitter." },
    { question: "Can I add more stones?", answer: "Add entries to `garden.stones`. The shader loops over however many there are. Each stone adds a little work to all nineteen height lookups per pixel, so past six or seven lower `garden.quality` or `garden.maxPixels`." },
    { question: "What appears without WebGL?", answer: "A CSS garden made from a repeating gradient for the straight lines and repeating radial gradients for the rings, with two shaded stones. It is always underneath, so there is no flash of empty space while the shader starts." },
  ],
  related: ["swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light", "wet-asphalt-at-night-webgl-background-with-puddles-that-mirror-coloured-shop-signs-and-rain-rings", "arched-stained-glass-window-webgl-background-that-pours-coloured-light-across-a-stone-floor-as-the-sun-moves"],
  tags: ["webgl", "shader", "zen garden", "sand", "shadows", "light background", "pointer light"],
  height: 760,
  section: true,
};

export default meta;
