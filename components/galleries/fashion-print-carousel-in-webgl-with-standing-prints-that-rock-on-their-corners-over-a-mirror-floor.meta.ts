const meta = {
  slug: "fashion-print-carousel-in-webgl-with-standing-prints-that-rock-on-their-corners-over-a-mirror-floor",
  category: "galleries",
  name: "Fashion Print Carousel in WebGL with Standing Prints That Rock on Their Corners over a Mirror Floor",
  keyword: "webgl 3d photo carousel react",
  title: "React WebGL 3D Photo Carousel on a Mirror Floor | We.Inc",
  description: "3D carousel in raw WebGL: tall fashion prints stand on a polished floor with reflections and soft shadows, and rock when moved. Free React and HTML code.",
  intro: "Seven tall photographic prints stand on their bottom edges along a brass rail set into a dark polished floor, in front of a charcoal wall with one pool of light. The whole set is drawn in raw WebGL 2 with a real camera: the floor mirrors each print with a blur that grows where the resin is smudged, a softbox throws soft shadows, colour from the photographs spills onto the ground, and a lens pass keeps the middle print sharp while the others fall out of focus. Drag, use the arrows or wait, and the row glides round with weight. Each print is a rigid slab, so a change of speed tips it onto one bottom corner and it rattles back to rest, corner to corner, faster and faster. On phones the camera pulls back so the middle print still fits, and without WebGL a layered image version takes over.",
  useWhen: [
    "A photographer, stylist or fashion label wants a portfolio opener where the pictures are treated as large physical prints in a studio.",
    "You have a short series of five to nine portrait images that share a colour family and deserve one screen each.",
    "The page is dark and you want real depth, with reflections and focus doing the work that borders and captions usually do.",
    "You need a 3D carousel that does not pull in three.js or any other rendering library.",
  ],
  customize: [
    "Swap the pictures in the `plates` array. `focus` is the crop centre from 0 to 1, `tone` is the colour shown while a photo loads, and `title` appears in the large serif line at the bottom left.",
    "Change `MASTHEAD` to set the italic wordmark in the top corner. It and the plate title use the `SERIF` font stack, and the small labels use `GROTESK`.",
    "`SPRING` and `DAMPING` set how the row travels: lower `DAMPING` for more overshoot. `ROCK_GAIN` sets how easily the prints tip, and `0.82` in `physics` is how much spin survives each time a corner lands.",
    "The set colours live in the shaders: the wall in `wallCol` (`vec3(0.026, 0.021, 0.022)`), the floor albedo in `FS_SET`, and the light position in `LPOS`. `uAperture` (`1.35`) controls how strong the background blur is.",
    "`RING` and `STEP` set the radius of the rail and the gap between prints. `HX` and `HY` are half the width and height of a print in metres.",
  ],
  accessibility: [
    "The stage is one focusable carousel group. Left and right arrow keys bring the neighbouring print forward, and the two round buttons do the same with spoken labels.",
    "The canvas is hidden from assistive technology. A polite live region carries the plate number, its title and the full description of the photograph, so each change is announced once.",
    "With reduced motion the camera stops drifting, the prints do not rock and a change of print is drawn as a single new frame. Dragging uses horizontal movement only, so vertical page scrolling still works on touch screens.",
  ],
  faqs: [
    { question: "How is the floor reflection drawn?", answer: "The floor is not a flipped copy of the scene. For every floor pixel the fragment shader sends eight rays off a slightly rough mirror and tests each one against the seven prints as flat rectangles, then against the wall. A hit reads the photograph at a blur level that depends on distance and roughness, which is why the reflection is crisp at the foot of a print and smears further away." },
    { question: "Why do the prints rock instead of leaning smoothly?", answer: "A rigid slab on a floor cannot bend, so when it is pushed sideways it pivots on one bottom corner. When it falls back, that corner lands, some energy is lost and it pivots onto the other corner. The `physics` function integrates exactly that, with the carriage acceleration as the push, which gives the quickening rattle you see as a print settles." },
    { question: "Does it need three.js?", answer: "No. It uses the browser's WebGL 2 API directly: three small shader programs, one array texture holding the photographs, one box mesh and a multisampled framebuffer. Everything is created and released inside a single `useEffect`." },
    { question: "How does it stay fast on a laptop?", answer: "Device pixel ratio is capped at 1.5 and the canvas at about 1.5 million pixels. The loop times its own frames and, if too many run long, lowers the render scale in steps. Drawing stops when the section scrolls out of view." },
    { question: "What happens when WebGL 2 is not available?", answer: "The component switches to a still version made from ordinary images with CSS perspective, a faded mirrored copy under each one and the same wordmark and captions. The buttons and arrow keys still change the middle print." },
    { question: "Can I use landscape photographs?", answer: "The prints are portrait slabs, so landscape images are cropped hard around their `focus` point. To change the shape, edit `HX`, `HY`, `TEX_W` and `TEX_H` together so the texture keeps the same proportions as the print." },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "wire-postcard-spinner-rack-photo-carousel-that-spins-with-inertia-and-shows-card-backs", "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre"],
  tags: ["carousel", "webgl", "3d", "reflection", "depth of field", "fashion", "physics"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
