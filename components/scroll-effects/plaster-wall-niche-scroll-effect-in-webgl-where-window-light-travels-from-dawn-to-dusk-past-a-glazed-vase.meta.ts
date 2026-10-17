const meta = {
  slug: "plaster-wall-niche-scroll-effect-in-webgl-where-window-light-travels-from-dawn-to-dusk-past-a-glazed-vase",
  category: "scroll-effects",
  name: "Plaster Wall Niche Scroll Effect in WebGL Where Window Light Travels from Dawn to Dusk Past a Glazed Vase",
  keyword: "react scroll light animation webgl",
  title: "React Dawn to Dusk Scroll Light Effect in WebGL | We.Inc",
  description: "Free React scroll effect: window light crosses a plaster wall and an arched niche with a glazed vase, warming from dawn to dusk as three lines fade in.",
  intro: "A lime-plaster wall with an arched niche, a glazed vase standing in it and a stone floor below, lit by the sun through a two-pane window somewhere behind you. Scrolling is the clock. As the section rises into view the light is low and rose-coloured and the window patch sits high on the right; by the middle it is white and steep, pooling under the vase; as the section leaves it has gone amber and stretched out to the left. The vase's shadow swings with it, and leaves outside the window keep the patch gently moving. Three short lines of real text arrive one by one at morning, noon and evening, and a small clock beside them reads the hour. Everything in the room is one ray-marched fragment shader with soft shadows, ambient occlusion, a glossy glaze that reflects the window, and a shallow focus on the vase. On a phone the niche sits above the text and the three hour buttons stay a full thumb high.",
  useWhen: [
    "A ceramics, interiors or furniture studio wants its about section to feel like standing in the room.",
    "A hotel, guest house or retreat needs one quiet moment that shows how a space feels across a whole day.",
    "A long-form story is split into morning, midday and evening and each part deserves its own line.",
    "A product launch wants a calm scroll scene in place of a looping video, with text that stays readable and searchable.",
  ],
  customize: [
    "Change the `hours` array for the three lines, labels and times. Each `at` value is the share of the scroll (0 dawn, 1 dusk) where that line arrives.",
    "`SUNS` and `SKIES` set the light colour through the day, five steps each from dawn to dusk. Push the last `SUNS` entry toward `[1.0, 0.3, 0.1]` for a redder sunset.",
    "`sunDir` decides the sun's path. Raise the `0.5` in `ly` for a steeper noon, or the `0.3` on `lx` so the window patch travels further sideways.",
    "The vase outline lives in the shader's `vaseR` function, and its glaze colours are `body` and `bare` in `shade`. Swap the dark green for `vec3(0.45, 0.08, 0.05)` to get an oxblood glaze.",
    "The window shape is the `window` function: `1.25` and `1.7` are its half width and height, and the leaf dapple strength is the `0.55` in `dap`.",
  ],
  accessibility: [
    "The canvas is hidden from screen readers. The three lines are real list items in a polite live region, and lines not yet reached are hidden from assistive technology until they appear.",
    "The hour buttons use `aria-pressed`, take one tab stop and move with the arrow keys, Home and End, so the whole day can be visited without scrolling.",
    "With reduced motion the room is rendered once at noon and refined to a still image; scrolling and the buttons jump straight to each hour.",
    "The text column sits on the light plaster with dark ink, so keep it there if you move it, rather than over the brightest part of the sun patch.",
  ],
  faqs: [
    {
      question: "How does the scroll turn into a time of day?",
      answer: "A passive scroll listener measures where the stage sits in the window and turns that into one number from 0 to 1. That number sets the sun direction, its colour and the sky fill, and it is eased toward its target every frame so a fast flick still reads as a sunrise rather than a jump.",
    },
    {
      question: "Why does the patch of light have the shape of a window?",
      answer: "For every point on the wall the shader follows a ray toward the sun until it reaches a plane behind the camera, then checks whether it lands inside the panes or on the frame, mullion and glazing bars. The edges soften with distance, the way real sunlight blurs further from the opening.",
    },
    {
      question: "What does it show before anyone scrolls?",
      answer: "It loads at noon and holds there for a few seconds, then a slow demo walks the light out to dawn, across to dusk and back. The demo stops the first time the page scrolls or an hour button is pressed.",
    },
    {
      question: "Will it slow a laptop down?",
      answer: "The canvas is capped at about 1.1 million pixels and stops rendering when it is off screen or the tab is hidden. If frames run slow it lowers its own resolution, and the current frame rate is written to a `data-fps` attribute on the stage.",
    },
    {
      question: "What happens without WebGL?",
      answer: "A gradient drawing of the wall, the arched niche and the vase at noon takes its place, and the lines, clock and hour buttons keep working.",
    },
  ],
  related: [
    "sheer-linen-curtain-webgl-background-where-afternoon-sun-and-leaf-shadows-sway-across-a-plaster-wall",
    "hanging-garment-bag-scroll-reveal-with-a-brass-zip-that-parts-waxed-canvas-over-a-photograph",
  ],
  tags: ["scroll", "light", "webgl", "ray marching", "plaster", "ceramics", "time of day"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
