const meta = {
  slug: "oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer",
  category: "backgrounds",
  name: "Oxblood Silk Satin WebGL Background with Folds Lit by a Lamp That Follows the Pointer",
  keyword: "silk shader background react",
  title: "React Silk Shader Background Lit by the Pointer | We.Inc",
  description: "Silk background in raw WebGL: a shader drapes oxblood satin into slow folds and lights it with a lamp the pointer carries. Free React and HTML to copy.",
  intro: "A length of dark red satin, dropped on a table and filling the whole block. The folds run up one diagonal, pinch together, fork and creep sideways over about a minute. A single lamp hangs just above the cloth, and because it is close, the long pale highlights slide along the ridges as it moves while the far side of every fold falls into soft shadow. Seen edge on, the weave turns pink, the way shot silk does. Move the pointer and the lamp goes with it; leave it alone and the lamp traces a slow figure of eight. There is no headline or button in the block, only a small caption pill in the corner, so you can lay your own content over it. On a phone the same cloth is drawn taller than wide with the fold count unchanged.",
  useWhen: [
    "A fashion, fragrance, jewellery or hotel page wants a backdrop that reads as an actual fabric instead of a colour gradient.",
    "You need a dark, rich surface behind one line of large type or a single product cut-out.",
    "A launch or invitation page should feel expensive without loading a photograph or a video.",
    "You want a pointer-reactive background where the reaction is light moving, not shapes chasing the cursor.",
  ],
  customize: [
    "The three colours in `silk` set the dye: `deep` is the cloth at the bottom of a fold, `body` the cloth facing the lamp and `sheen` the tint of the highlight. For emerald try `[0.0, 0.05, 0.04]`, `[0.02, 0.36, 0.25]` and `[0.6, 1.0, 0.82]`.",
    "`silk.folds` is how many folds cross the view. `1.6` gives a few broad swells, `4` a tightly gathered curtain.",
    "`silk.depth` is how tall the folds stand. Raising it lengthens the shadows and narrows the highlights; `silk.lampHeight` does the opposite as it rises.",
    "`silk.gloss` scales the highlight. At `0.3` the cloth reads as brushed cotton, at `1.4` as wet-look satin.",
    "The thread direction is `vec3(-0.57, 0.82, 0.0)` in the shader. Swap the two numbers to make the bright bands run across the folds at a different slant.",
  ],
  accessibility: [
    "The canvas and the CSS cloth below it are hidden from assistive technology, and neither takes pointer events, so links you place on top stay clickable.",
    "The caption sits on its own near-black pill, so its contrast does not depend on which part of a fold is behind it. Do the same for any text you add: the highlights are close to white pink.",
    "With reduced motion switched on, one frame is drawn and held and the lamp ignores the pointer.",
  ],
  faqs: [
    { question: "What makes this look like satin and not plastic?", answer: "Satin is woven with long floats of thread running one way, so it reflects light in a streak across the threads instead of a round spot. The shader measures the angle between the thread direction and the direction halfway between the lamp and the viewer, which stretches the highlight into bands that follow each ridge. A second, very tight highlight adds the white core, and a pale tint is added wherever the cloth is seen edge on." },
    { question: "How are the folds made without a 3D mesh?", answer: "Every pixel asks one function for the height of the cloth at that spot. The function adds a few sine waves along a diagonal and bends their input with slow noise, so the ridges wander and split. The slope of that height gives the direction the cloth is facing, which is all the lighting needs." },
    { question: "Where do the shadows come from?", answer: "From each pixel the shader takes nine steps toward the lamp and checks whether the cloth rises above that line. The closer a ridge comes to blocking it, the darker the pixel, which gives a soft edge without any blur pass." },
    { question: "What shows if WebGL is not available?", answer: "A still version built from two rotated CSS gradients in the same reds and pinks. It is rendered first in every browser, and the canvas fades in over it once a frame has been painted." },
    { question: "How heavy is it on a laptop or phone?", answer: "It is one draw call with about a dozen height lookups per pixel. The canvas is limited to `silk.maxPixels`, about 1.1 million, whatever the screen size, and the loop stops while the block is scrolled out of view or the tab is in the background. Drop `silk.quality` to `0.6` if you stack it under heavy content." },
  ],
  related: ["polished-terrazzo-floor-webgl-background-with-marble-chips-and-brass-strips-that-catch-a-moving-lamp", "raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow", "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light"],
  tags: ["webgl", "shader", "silk", "satin", "fabric", "background", "pointer light"],
  height: 760,
  section: true,
};

export default meta;
