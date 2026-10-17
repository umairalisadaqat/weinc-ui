const meta = {
  slug: "posable-desk-lamp-on-a-jointed-arm-that-lights-a-still-life-and-throws-its-true-shadow-up-the-wall",
  category: "cursors",
  name: "Posable Desk Lamp on a Jointed Arm That Lights a Still Life and Throws Its True Shadow up the Wall",
  keyword: "webgl desk lamp pointer light react",
  title: "React WebGL Desk Lamp That Follows the Pointer | We.Inc",
  description: "WebGL scene: an enamel desk lamp on a jointed arm follows the pointer and lights a still life with soft, true shadows. Copy the React code or HTML free.",
  intro: "A dark desk against a green wall, a red enamel task lamp, and a small still life: a stoneware vase with three dried seed heads, a plum and an apricot. The lamp is the only real light in the room. Move the pointer and the head of the lamp travels to it, with the elbow of the arm bending the way a two-part arm must, and the shade turning to keep the vase in its beam. Because the scene is traced per pixel from distances to each shape, the shadows are the true ones: the stems draw thin lines up the wall that fan out as the lamp drops, the fruit shadows stretch across the wood, and each edge goes softer the further it falls from the thing casting it. A switch in the corner turns the bulb off and leaves the room in blue evening light. On a phone the camera pulls back so the whole lamp stays in frame, a tap places the head, and a sideways drag carries it.",
  useWhen: [
    "A studio, furniture or lighting brand wants an opening screen that is an object to play with instead of a headline over a stock photo.",
    "A product page needs to show how one light source changes the look of a form, and a short video would not let the visitor steer.",
    "A portfolio or agency site wants a single quiet interactive piece between two dense sections of case studies.",
    "A 404 or coming-soon page should hold attention for a few seconds with something that rewards moving the mouse.",
  ],
  customize: [
    "`lamp.enamel` is the paint on the shade and the foot, as linear red, green and blue from 0 to 1. `[0.82, 0.62, 0.08]` gives a mustard lamp, `[0.03, 0.03, 0.035]` a black one.",
    "`lamp.wall` is the wall paint. The light that comes back off the wall onto the vase is tinted with the same value, so a change there carries through the scene.",
    "`lamp.spread` sets the width of the beam. At 0.56 the pool covers the whole still life. At 0.8 it shrinks to a spot and the wall mostly falls dark.",
    "`lamp.lower` and `lamp.upper` are the two arm lengths. Keep their sum above 1.6 or the head cannot reach over the vase.",
    "The still life is the `stillLife` function in the shader. Each shape is one line: move the plum by editing `vec3(0.35, 0.088, 0.2)`, or delete a stem by removing its `capsule` call.",
  ],
  accessibility: [
    "Two range inputs, hidden from sight but present for the keyboard and for screen readers, move the head left to right and low to high. A white outline is drawn round the scene while either has focus.",
    "The bulb control is a real button with `role=\"switch\"` and `aria-checked`, and its label changes between Lamp on and Lamp off.",
    "With reduced motion the lamp does not sway by itself and the spring is skipped: the head moves straight to where it is put and stays there.",
    "The canvas is marked `aria-hidden`. If the scene carries meaning on your page, describe it in nearby text.",
  ],
  faqs: [
    {
      question: "How are the shadows calculated?",
      answer: "Every shape in the scene is written as a distance function. For each pixel the shader walks from the visible surface towards the bulb and records how closely that path passes any shape. A near miss darkens the pixel a little and a hit darkens it fully, which gives sharp shadows near the object and soft ones far from it without any shadow map.",
    },
    {
      question: "Why does the arm bend the right way when I move the head?",
      answer: "The `pose` function solves a two-bone arm with the law of cosines. Given where the head should be, it finds the one elbow position that keeps both arm lengths fixed and the elbow above the line from foot to head. The target is clamped so the arm never has to stretch past its length.",
    },
    {
      question: "Is this heavy on a phone?",
      answer: "It is a ray-marched scene, so it costs more than a flat canvas. The pixel count is capped by `lamp.maxPixels` and scaled by `lamp.quality`, and the frame loop stops when the block is off screen or the tab is hidden. Lower `quality` to 0.7 if you need to support older handsets.",
    },
    {
      question: "Can I put my own product on the desk?",
      answer: "Only if you can describe it with simple solids. Spheres, capsules, cylinders, cones and turned profiles like the vase are each a line or two in `stillLife`. A scanned 3D model cannot be loaded into this shader.",
    },
    {
      question: "What appears if WebGL is unavailable?",
      answer: "Two plain layers sit under the canvas: a soft pool of green light on a dark wall and a strip of brown for the desk. The canvas fades in over them only after its first frame is drawn, so nobody sees an empty box.",
    },
  ],
  related: ["raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow", "blind-embossed-paragraph-that-inks-in-under-a-passing-lamp"],
  tags: ["lamp", "webgl", "shadow", "ray marching", "pointer", "still life", "lighting"],
  height: 680,
  section: true,
  interactive: true,
};

export default meta;
