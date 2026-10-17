const meta = {
  slug: "ray-marched-potters-wheel-loader-that-pulls-up-a-wet-stoneware-bowl-in-a-sunlit-studio-and-stops-when-it-is-done",
  category: "loaders",
  name: "Ray-Marched Potter's Wheel Loader That Pulls Up a Wet Stoneware Bowl in a Sunlit Studio and Stops When It Is Done",
  keyword: "pottery wheel loader react",
  title: "Potter's Wheel Progress Loader (React, WebGL) | We.Inc",
  description: "Free React progress loader in one WebGL shader: a wet clay bowl rises on a spinning potter's wheel and the wheel coasts to a stop at 100%.",
  intro: "A progress screen that looks like a photograph taken in a pottery studio. A kick-style wheel with a pale splash pan stands on a concrete floor in low window light, and a ball of wet stoneware turns on its aluminium head. As the number climbs the ball is opened, then the wall is pulled up and eased outward until a wide bowl stands there with throwing rings on its sides and a rounded rim. The slip streaks and the clay smeared on the wheel head turn with it, blurred by the speed. At one hundred the wheel coasts, drags to a stop and rocks back a hair, the shine on the clay dulls a little as it stops being wetted, and the finished bowl rests for a few seconds before a fresh ball is centred. The figures, the step counter and the status line are ordinary text on the left; on a phone they sit under the wheel.",
  useWhen: [
    "A shop, portfolio or studio site is being generated and the wait should feel like something being made by hand.",
    "A long export or import needs a screen that people are happy to watch for half a minute.",
    "A craft, ceramics or homeware brand wants its loading state to share the warmth of its product photography.",
    "A task runs in named steps, and each step can be shown as a stage of throwing a pot.",
  ],
  customize: [
    "Each entry in `stages` pairs a line of status text (`note`) with the percent where that line hands over to the next (`until`).",
    "`demo` is the script the preview follows as pairs of percent and seconds. For a real job, remove the marked demo block inside the frame loop and feed your own progress into `s.goal`. The clay follows that number with a lag, so a jump still reads as a pull.",
    "`CLAY` is the body colour in linear RGB. `[0.62, 0.6, 0.56]` gives a grey porcelain, `[0.55, 0.22, 0.12]` a red earthenware.",
    "`shape()` turns progress into the bowl: `H` is the wall height, `rr` the rim radius and `w` the wall thickness. Raise the `0.43` and lower the `0.27` for a tall vase instead of a bowl.",
    "`HOLD` is how many seconds the finished bowl rests on the stopped wheel before the next ball.",
  ],
  accessibility: [
    "The canvas is decorative and hidden from screen readers. A real element with `role=\"progressbar\"` carries `aria-valuenow` and an `aria-valuetext` that reads the number and the current step together.",
    "The step line is a polite live region, so each new step is announced once while the number changes quietly.",
    "The single control is a native button with a visible focus ring. While the bowl is being thrown it reads \"Finish the bowl\"; once the wheel has stopped it reads \"Throw another bowl\".",
    "With reduced motion the studio renders once and stays still, the wheel never turns, and the button moves the number on in steps of twenty.",
  ],
  faqs: [
    {
      question: "How do I connect it to a real task?",
      answer: "Everything reads one value, `s.goal`, from 0 to 100. Remove the demo block at the top of the frame loop and set `s.goal` from your job status. When it reaches 100 and the clay has caught up, the wheel stops on its own and the bowl rests.",
    },
    {
      question: "Is the bowl a 3D model?",
      answer: "No mesh is loaded. The bowl is a solid of revolution described by a handful of numbers: its height, foot radius, rim radius and wall thickness. The shader finds its surface pixel by pixel, carves the inside out of it, adds a rounded rim and the small rings left by the fingers.",
    },
    {
      question: "How does the spinning look blurred?",
      answer: "Each frame is blended into the last few, and each one is drawn with the wheel at a slightly different angle. The streaks in the slip and the clay on the wheel head smear into arcs, the same way they would in a photograph with a slow shutter, and turn crisp once the wheel stops.",
    },
    {
      question: "Why does the clay look different once it is done?",
      answer: "While the wheel turns the clay is darker and glossy, the way stoneware looks under a wet sponge. When it stops the wetness value eases down, so the colour lightens and the highlights spread and soften.",
    },
    {
      question: "What does it cost to run?",
      answer: "It is one fragment shader that marches a small scene inside a bounding sphere, with the floor and wall solved as planes. The drawing buffer is capped at about a million pixels and a device pixel ratio of 1.25, drawing stops when it scrolls out of view or the tab is hidden, and resolution drops if frames run long.",
    },
    {
      question: "What appears without WebGL?",
      answer: "A still built from gradients and clipped shapes in the same layout, with the bowl drawn at the current height. The progress text and the button work the same either way.",
    },
  ],
  related: [
    "banding-wheel-loader-that-throws-a-wet-terracotta-vase-up-to-a-brass-height-gauge",
    "ray-marched-hourglass-loader-in-a-turned-ash-frame-on-a-sunlit-desk-that-pours-coral-sand-into-a-growing-cone-and-flips-over-when-full",
    "ray-traced-glass-pendant-loader-that-fills-with-glowing-liquid-and-focuses-a-point-of-light-under-a-wall-sized-percentage",
  ],
  tags: ["loader", "progress", "webgl", "ray marching", "pottery", "clay", "shader", "percentage"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
