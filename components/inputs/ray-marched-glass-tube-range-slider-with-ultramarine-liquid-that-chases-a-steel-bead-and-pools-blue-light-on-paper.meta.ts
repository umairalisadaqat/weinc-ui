const meta = {
  slug: "ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper",
  category: "inputs",
  name: "Ray-Marched Glass Tube Range Slider with Ultramarine Liquid That Chases a Steel Bead and Pools Blue Light on Paper",
  keyword: "webgl range slider react",
  title: "Glass Tube Range Slider in WebGL (React, Tailwind) | We.Inc",
  description: "Free React range slider drawn as a glass tube of blue liquid behind a steel bead, traced in a WebGL shader on lit paper, with a native range input underneath.",
  intro: "A range slider photographed rather than drawn. A thick glass tube lies between two brass blocks on a sheet of warm paper, lit from behind by a softbox. Inside it a polished steel bead marks the value and ultramarine liquid fills the bore up to the bead. Each pixel follows a ray through the glass wall, the liquid and out again, so the colour deepens where the path is long and the paper behind bends through the tube. The filled length acts as a rod lens and lays a line of blue light on the paper, the bead drops its shadow onto a printed scale, and a long lens leaves the far block soft. Drag the bead and the liquid runs after it with a rocking face. Above sit the value set very large and an ordinary range input that drives the same number. On phones the camera swings round to look down the tube and the type moves below it.",
  useWhen: [
    "A paint, ink, drinks or skincare page lets a visitor choose an amount and the liquid itself should be the control.",
    "One number on a configurator matters more than the rest and deserves a whole screen, such as a dose, a fill level or a budget.",
    "A light, editorial landing page needs a hero object that visitors can take hold of and that still reads as a form field.",
    "You want a portfolio piece showing refraction, absorption and soft shadow running live in a browser with no 3D library.",
  ],
  customize: [
    "`MAX`, `MAJOR` and `MINOR` set the range and the printed scale. With `MAX = 100`, `MAJOR = 25` and `MINOR = 5` it becomes a percentage, and `UNIT` changes the small blue label.",
    "`notes` pairs a threshold with the italic sentence shown once the value reaches it. Add or remove rows freely, keeping them in rising order.",
    "The liquid colour is `SIG` in the shader, the amount of red, green and blue absorbed per unit of depth. `vec3(0.25, 2.6, 5.0)` gives an amber spirit and `vec3(4.5, 0.4, 3.2)` a green cordial.",
    "`BRASS` is the metal of the end blocks. `vec3(0.91, 0.92, 0.93)` turns them to aluminium and `vec3(0.95, 0.64, 0.54)` to copper.",
    "How far the liquid lags is the `64` and `7.5` in the frame loop, its spring and its drag. Raise the spring to 200 and the column stays glued to the bead.",
    "The camera lives in `camera()`: `az` swings it round the tube, `el` raises it and the `2.84` in `foc` is the lens length.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The real control is a labelled `input type=\"range\"` with `aria-valuetext` that reads the amount in millilitres along with the sentence for that band.",
    "Arrow keys, Page Up, Page Down, Home and End work as they do on any native range input, and the bead follows each step.",
    "The focus ring on the range input is drawn in the same blue as the liquid. Keep it if you restyle the track.",
    "With reduced motion the softbox stays still, the demo never starts and the bead and liquid jump to the new value with no chase.",
  ],
  faqs: [
    {
      question: "How is the glass refracted without a 3D engine?",
      answer: "A cylinder and a sphere can be intersected with a ray using a quadratic, so the shader needs no stepping for them. It bends the ray with Snell's law at the outer wall, the bore, the curved face of the liquid and both walls on the way out, and reflects it instead whenever the angle is past critical. Only the brass blocks are marched as distance fields.",
    },
    {
      question: "Why does the liquid look darker in the middle and paler at its edges?",
      answer: "Light is absorbed along the distance it travels through the liquid, with red taken fastest and blue hardly at all. A ray through the centre of the bore crosses more liquid than one that clips the edge, so the middle falls to navy while thin parts stay bright.",
    },
    {
      question: "Is the blue line on the paper a real caustic?",
      answer: "It is computed, not traced. For each point on the paper the shader works out how far the ray toward the softbox passes from the tube's axis and whether that stretch is full. A full tube concentrates light toward its centre line and starves its flanks, an empty one only shades at the walls, and both soften with distance.",
    },
    {
      question: "How does dragging find the right value when the tube is seen at an angle?",
      answer: "The pointer position is turned back into a ray with the same camera the shader uses, and that ray is met with the horizontal plane through the tube's axis. Where it lands along the tube becomes the value, so the bead stays under the finger on desktop and in the steeper phone view.",
    },
    {
      question: "What does a browser without WebGL show?",
      answer: "A side view of the tube built from CSS gradients, with the blue fill and the bead positioned from the same state. The large number, the sentence and the range input never depended on the canvas.",
    },
    {
      question: "How do I use the number elsewhere on my page?",
      answer: "`value` is plain React state from 0 to `MAX`. Lift it to a parent with a prop and a callback, or give the range input a `name` so it posts with a form.",
    },
  ],
  related: ["ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo", "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale", "steel-tape-measure-range-slider-with-a-blade-that-sags-a-thumb-lock-and-spring-rewind"],
  tags: ["range slider", "webgl", "ray marching", "glass", "liquid", "refraction", "shader", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
