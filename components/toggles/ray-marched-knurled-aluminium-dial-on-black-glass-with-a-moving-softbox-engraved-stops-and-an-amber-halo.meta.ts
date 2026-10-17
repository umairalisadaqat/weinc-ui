const meta = {
  slug: "ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo",
  category: "toggles",
  name: "Ray-Marched Knurled Aluminium Dial on Black Glass with a Moving Softbox, Engraved Stops and an Amber Halo",
  keyword: "webgl knob react",
  title: "React WebGL Knob: Ray-Marched Aluminium Dial | We.Inc",
  description: "Selector rendered as a knurled aluminium dial in a WebGL fragment shader, on black glass, with a real radio group underneath. Free React and HTML to copy.",
  intro: "A five-stop lamp selector photographed rather than drawn. One fragment shader ray-marches a machined dial through a telephoto camera set above and in front of it: a diamond-knurled grip, a lathe-faced top whose highlight opens into two fans, polished bevels, a black anodised plate with paint-filled numerals, and a sheet of black glass that mirrors all of it. Four softboxes light the set and the large one drifts, so the bevels keep catching it. Turning the dial pulls it through sprung detents, the amber ring under the knob burns brighter with each stop, and the numeral it points at lights up. Beside it the stop name is set very large, with a pill of five radio buttons that drive the same state. On phones the dial sits above the type and a horizontal swipe turns it while vertical swipes still scroll the page.",
  useWhen: [
    "A product page for audio, lighting or smart home hardware wants a first screen that a visitor can actually operate.",
    "A setting has a handful of named levels and deserves more ceremony than a segmented control, such as brightness scenes or fan speed.",
    "You need a showpiece for a portfolio or launch page that proves the rendering is live by letting people grab it.",
    "A dark landing page needs one hero object and a single large word, with nothing else competing.",
  ],
  customize: [
    "`stops` holds the positions. Each entry has a `label` for the big word, a `note` for the line under it and a `level` from 0 to 1 that sets how bright the ring burns.",
    "`SWEEP` is the travel in degrees between the first and last stop. The engraved ticks and numerals are redrawn from it, so 148 and 200 both work.",
    "`LAMP` is the linear colour of the ring, the pointer paint and the lit numeral. `[0.2, 0.75, 1]` gives an ice blue instrument.",
    "The metal is `ALU` near the top of the shader. Swap it for `vec3(0.95, 0.64, 0.54)` for copper or `vec3(1.0, 0.77, 0.34)` for brass.",
    "The detent feel is `stiff = 300` and `damp = 15.5` in the frame loop. Raise the damping to 34 and the knob stops dead with no wobble.",
    "Camera height is `el` and lens length is the `2.12` in `foc`. A lower `el` gives a more heroic, side-on product shot.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The control people operate is a `radiogroup` of five buttons, each with `role=\"radio\"`, `aria-checked` and a label that includes what the stop does.",
    "Only the chosen radio is in the tab order. Arrow keys step through the stops, Home and End jump to the ends, and the dial follows.",
    "The large word and its note sit in a polite live region, so a change made by dragging is announced too.",
    "With reduced motion the softbox stays put, the self-running demo never starts, and the dial jumps to its stop. The frame is still refined over a few passes and then the loop stops.",
  ],
  faqs: [
    {
      question: "How is the metal made to look real without a 3D library?",
      answer: "The dial is a signed-distance function, and each pixel marches a ray to it. Polished parts then fire a second ray, so the skirt really does mirror the glowing ring and the plate. The lathe-faced top takes thirteen samples of the lights spread along the direction across its scratches, which is what stretches a highlight into fans on real turned aluminium.",
    },
    {
      question: "Where do the depth of field and the smooth edges come from?",
      answer: "Every frame nudges the camera by less than a pixel and moves it to a new point on a small lens disc, then blends the result onto a half-float buffer. Over a handful of frames that averages into antialiased edges, out-of-focus dust on the far glass and a softened reflection, with no blur pass at all.",
    },
    {
      question: "Will it hold sixty frames a second on a laptop?",
      answer: "The buffer is capped at about one and a half million pixels and one and a half device pixels per CSS pixel. On an M-series laptop a 1280 by 760 frame costs a little over eight milliseconds. Rays that miss a cylinder around the dial skip the march entirely. If frames run long for most of a second the loop gives up a step of resolution, and it stops drawing when the section is off screen or the tab is hidden.",
    },
    {
      question: "What happens on a device with no WebGL?",
      answer: "The section shows a still built from CSS ellipses and gradients in the same pose, with the pointer and the ring following the chosen stop. The radio group, the large word and the keyboard handling do not depend on the canvas, so the control keeps working.",
    },
    {
      question: "How do I read the chosen stop in my own code?",
      answer: "The `mode` state is the index into `stops`. Lift it into a parent through a prop and a callback, or read `stops[mode].level` to drive a real light, a volume or a CSS variable elsewhere on the page.",
    },
    {
      question: "Are the engraved numerals part of the shader?",
      answer: "They are drawn once on a small 2D canvas as a plan of the plate, uploaded as a texture, and sampled where a ray lands on the top of the base. The neighbouring texels tilt the surface normal a little, so the edges of each cut catch light the way a paint-filled engraving does.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp", "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob"],
  tags: ["dial", "knob", "webgl", "ray marching", "shader", "metal", "selector", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
