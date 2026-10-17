const meta = {
  slug: "ray-marched-anodised-aluminium-air-key-on-black-glass-with-real-travel-a-backlit-legend-and-a-light-ring-that-latches-on",
  category: "animated-buttons",
  name: "Ray-Marched Anodised Aluminium Air Key on Black Glass with Real Travel, a Backlit Legend and a Light Ring That Latches On",
  keyword: "3d button react webgl",
  title: "Ray-Marched 3D Latching Key Button (React, WebGL) | We.Inc",
  description: "Free React toggle button rendered as a thick red-orange anodised key in a WebGL shader: it travels, knocks at the bottom, latches low and lights its legend and ring.",
  intro: "One button, photographed in three-quarter view. A fragment shader ray-marches a thick key of red-orange anodised aluminium with a fingertip dish and a bright-cut edge, seated in a brushed silver housing with four socket screws on a sheet of black glass. The words ON AIR are cut through the top as an opal insert, an opal ring surrounds the key, and a hairline of the same acrylic runs round the foot of the housing. Pressing drives a sprung plunger: the key sinks a quarter of its height, knocks against its stop hard enough to nudge the camera, rocks toward the finger, then comes back up and latches a little lower while the light strikes outward: legend first, ring next, foot line last. Press again and it pops to full height while the light fades like a filament. The state is printed very large beside it. Over the picture sits an ordinary `button` with `aria-pressed`, placed on the key by projecting it through the same camera. On phones the key takes the top of the block and the type sits below.",
  useWhen: [
    "A page has exactly one action that matters, such as going live, arming a deploy or starting a recording, and it should feel like throwing a real switch.",
    "A podcast, radio or streaming product wants its first screen to be the on-air control itself.",
    "A hardware or audio brand needs a hero that shows machined parts and lets the visitor press one.",
    "You want a toggle whose two states are impossible to confuse from across a room.",
  ],
  customize: [
    "`LEGEND` is the text cut into the key, one array entry per line. Two short lines of up to three letters fill the dish; a single word of four letters also fits.",
    "`DYE` is the anodising colour of the key in linear RGB. `[0.03, 0.2, 0.9]` gives cobalt, `[0.02, 0.02, 0.025]` a black key that only shows its legend.",
    "`LAMP` colours the legend, the ring and the foot line together. Try `[0.25, 1, 0.45]` for a green ready light.",
    "`TRAVEL` and `LATCH` set how deep the key goes and how low it rests while on. With `LATCH = 0` it becomes a momentary-feeling key that still toggles.",
    "`states` holds the big word and the serif line for each state, and `PLATE` the two small engravings on the housing rim.",
    "The spring is `stiff` and `damp` in the frame loop. Raising the released `damp` from 15 to 40 removes the bounce on the way up.",
  ],
  accessibility: [
    "The canvas is decorative and hidden. The thing a person operates is a native `button` with `aria-pressed` and the label On air, laid over the key.",
    "Space and Enter both work, and holding either keeps the key at the bottom of its travel until release, with key repeat ignored so it cannot flutter.",
    "The large word and its sentence are a polite live region, so the new state is spoken after each press.",
    "With reduced motion the key and lamp jump between states, the softbox stops drifting and the self-running demo does not start.",
  ],
  faqs: [
    {
      question: "How does the key sit exactly under the real button?",
      answer: "The camera used by the shader is also built in JavaScript. On every resize the eight corners of the key are projected through it, and the bounding box of those points is written to the button as left, top, width and height. The focus ring is an SVG outline of the key's top face projected the same way, and it rides down with the key as it travels.",
    },
    {
      question: "What makes the press feel heavy instead of like a CSS transform?",
      answer: "The key position is a mass on a spring integrated four times a frame, with two hard stops. Hitting the bottom stop reverses a fraction of the speed and feeds the rest into a second, tiny spring on the camera, which reads as a knock through the desk. On release the damping is low, so the key overshoots its rest height once before settling.",
    },
    {
      question: "Is the orange surface a texture?",
      answer: "No. Anodised aluminium is modelled as a metal whose reflection is tinted by the dye, with a satin finish. Each pixel fires one reflected ray through a random cone, and frames are averaged on a half-float buffer, so the blurred picture of the softboxes and of the glowing ring builds up over a few frames.",
    },
    {
      question: "Why does the lit ring show on the sides of the key and the housing lip?",
      answer: "Polished parts trace a real second ray, so the bright-cut edges mirror the ring. Satin parts add a small analytic light placed along the ring, which is what warms the lower flanks of the key when the lamp is on.",
    },
    {
      question: "Can I use it as a one-shot button and not a toggle?",
      answer: "Yes. Call your handler in `onClick`, drop `aria-pressed`, and set the lamp from your own pending state by passing it where `on` is used. The travel and knock are driven by pointer and key events and do not depend on the toggle.",
    },
    {
      question: "What is shown when WebGL is missing?",
      answer: "A still made of stacked CSS slices in a tilted plane: the housing, the ring and the key, with the legend and glow following the state and the key sitting lower while held. The button, the big word and the keyboard handling are plain React and keep working.",
    },
  ],
  related: [
    "ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo",
    "ray-traced-glass-cabochon-button-over-a-fashion-print-that-splits-colour-throws-caustics-and-drops-when-pressed",
    "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
  ],
  tags: ["button", "toggle", "webgl", "ray marching", "shader", "aluminium", "3d", "latching", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
