const meta = {
  slug: "ray-marched-oak-groove-stepper-with-a-steel-ball-that-rolls-to-turned-brass-posts-in-raking-window-light",
  category: "timelines",
  name: "Ray-Marched Oak Groove Stepper with a Steel Ball That Rolls to Turned Brass Posts in Raking Window Light",
  keyword: "react stepper component webgl",
  title: "Oak Groove Stepper with a Rolling Steel Ball (React, WebGL) | We.Inc",
  description: "Free React stepper: a steel ball rolls along a groove in an oak block to brass posts, ray-marched in WebGL in low window light.",
  intro: "A process timeline you can almost pick up. A long block of pale ash sits on a chalk floor with a groove milled down its length, and a turned brass post stands beside the groove for every step. Low sun comes through a window behind the set, so the posts lay long striped shadows across the wood and the glazing bars print soft lines on the floor. Choose a step and a polished steel ball rolls to that post: it builds speed, runs a little past, rolls back and settles, and the post rises a few millimetres in its sleeve to show it has been reached. The step name and its sentence change above. Everything is ray-marched in one fragment shader with soft shadows, ambient occlusion, a real mirror trace in the ball and a long lens whose focus follows it. On a phone the camera swings round to look down the block and the text sits underneath.",
  useWhen: [
    "A workshop, studio or maker explains a commission in four to six stages and wants the page to feel as crafted as the work.",
    "An onboarding or delivery page needs one calm, physical object that shows where a customer is in a process.",
    "A portfolio wants to show ray-marched light, shadow and reflection running live in a browser with no 3D library.",
    "A product page tells the story of how something is made, one stage at a time, and should reward a click.",
  ],
  customize: [
    "Edit the `steps` array to change the stages: `name` is the short label over each post, `when` the timing line, `title` the large heading and `body` the sentence. The posts are spread evenly, so three to six steps all fit.",
    "`START` is the step it opens on, and `WORKSHOP` and `JOB` fill the small line at the top.",
    "The wood colour lives in `oakAlb` in the shader: `vec3(0.84, 0.66, 0.45)` is the pale board and `vec3(0.64, 0.44, 0.26)` the darker late-wood stripe. Try `vec3(0.45, 0.3, 0.2)` and `vec3(0.28, 0.17, 0.1)` for walnut.",
    "`BRASS` sets the metal of the posts and the inlaid lines. `vec3(0.92, 0.93, 0.94)` turns them to nickel and `vec3(0.95, 0.62, 0.5)` to copper.",
    "How the ball moves is in the frame loop: `30` is the pull toward the post, `5.2` the drag and `26` the most it can accelerate. Raise the drag to 9 for a ball that stops without rolling back.",
  ],
  accessibility: [
    "Each post's label is a real button inside an ordered list, and the current step carries `aria-current=\"step\"`. The canvas is hidden from assistive technology.",
    "Only the current step is in the tab order. Arrow keys, Home and End move between steps and take focus with them, so the whole timeline is one stop when tabbing through a page.",
    "The heading and sentence sit in a polite live region, so a screen reader hears the new step after a choice.",
    "With reduced motion the window light holds still, the demo never starts and the ball jumps straight to the chosen post.",
  ],
  faqs: [
    {
      question: "How is the scene drawn without a 3D engine?",
      answer: "A single full-screen triangle runs a fragment shader. The oak block, its groove and the turned posts are signed distance functions that each ray marches through, the ball is a sphere hit exactly, and the floor is a plane. Shadows are found by marching a second ray toward the sun and keeping how close it came to anything.",
    },
    {
      question: "Why does the ball overshoot and roll back?",
      answer: "It is pulled toward the chosen post by a spring with light damping, and the push is capped so it has to build speed over a long run. That stored speed carries it past the post before the spring wins, which is the small roll back and settle you see.",
    },
    {
      question: "Where does the depth of field come from?",
      answer: "Every frame is one exposure added to a floating point plate. Each exposure moves the camera to a slightly different point on a small lens while keeping the focal plane on the ball, so everything nearer or farther blurs as more frames add up. While the ball is moving the plate is refreshed faster to keep it sharp.",
    },
    {
      question: "How do the labels stay over the posts?",
      answer: "The same camera maths the shader uses projects the top of each post onto the screen, and each button is moved there with a transform. When the pointer nudges the camera or the page resizes, the labels follow.",
    },
    {
      question: "What does it cost to run?",
      answer: "The canvas is capped at about 1.3 million traced pixels and stops drawing when it scrolls out of view or the tab is hidden. If frames run long for a while it lowers its own resolution. Once still it keeps adding exposures for a moment to clean up the picture, then rests.",
    },
    {
      question: "What does a browser without WebGL see?",
      answer: "A front view of the block, posts and ball made with CSS gradients, with the labels laid out in a row. The ball slides to the chosen post and the text and buttons work exactly as before.",
    },
  ],
  related: [
    "knitted-scarf-project-timeline-that-knits-one-wool-stripe-per-step-as-each-ball-of-yarn-runs-out",
    "roller-conveyor-order-tracker-with-a-taped-parcel-that-rides-steel-rollers-past-four-enamel-station-signs-with-lamps",
    "ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper",
  ],
  tags: ["stepper", "timeline", "webgl", "ray marching", "wood", "brass", "physics", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
