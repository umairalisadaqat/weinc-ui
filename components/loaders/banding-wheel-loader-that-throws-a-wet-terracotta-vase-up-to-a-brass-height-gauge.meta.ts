const meta = {
  slug: "banding-wheel-loader-that-throws-a-wet-terracotta-vase-up-to-a-brass-height-gauge",
  category: "loaders",
  name: "Banding Wheel Loader That Throws a Wet Terracotta Vase up to a Brass Height Gauge",
  keyword: "pottery wheel loading animation react",
  title: "React Loading Animation: Pottery Wheel on Canvas | We.Inc",
  description: "Loading animation on a canvas: wet terracotta turns on a wheel and rises into a vase as the percentage climbs. The React code and HTML are free to copy.",
  intro: "A progress loader in the shape of a pot being thrown. A thick puck of red clay sits on a turned aluminium wheel head. As the percentage rises the wall is pulled upward, thins, swells into a belly, closes into a neck and opens into a flared lip. A potter's height gauge stands beside it, and its brass pointer marks exactly where the lip arrives at one hundred percent, so the distance left to go is visible without reading the number. While the wheel turns the finger ridges climb the wall, streaks of slip ride round it and the piece runs slightly off centre; at the end the wheel coasts to a stop and the vase stands true. Moving the pointer across the drawing moves the lamp, and dragging sideways pushes the wheel. On phones the drawing is shown at about three quarters size with the number and status line beneath it.",
  useWhen: [
    "An export, render or image batch takes long enough that people want to watch something being made instead of a bar creeping right.",
    "A ceramics studio, craft marketplace or homeware shop needs a waiting state that belongs to its trade.",
    "A design tool wants the wait before a finished file to feel like the last stage of making it.",
    "A full page splash should hold one object in the middle and stay quiet around it.",
  ],
  customize: [
    "`CLAY` is the body colour as red, green and blue. Try `[142, 138, 130]` for grey stoneware or `[214, 196, 170]` for porcelain; the slip on the wheel and the well inside the lip follow it.",
    "The finished shape lives in the `vase` line of `profile`: `43 * bump(t, 0.34, 0.3)` is the belly, the `- 9 * bump(...)` term is the neck and `15 * smooth(0.86, 1, t)` is the flare. Set the flare to 0 for a bottle.",
    "`RISE_FROM` and `RISE_TO` are the heights of the clay at the start and the finish. The gauge pointer reads `RISE_TO`, so it moves with any change.",
    "`STAGE` and the three creams in the root `bg-[radial-gradient(...)]` class are the backdrop. Darken the floor shadow colour `rgba(72,48,26,...)` if you move to a cooler wall.",
    "Connect your own job by assigning its 0 to 1 value to `progress.current`; the demo clock block in `frame` then has to go, or it will overwrite you.",
  ],
  accessibility: [
    "The drawing sits in a `progressbar` whose `aria-valuenow` runs from 0 to 100, with an `aria-valuetext` that reads as a percentage thrown and then as the finished label.",
    "The line under the number is a `status` region. Its text changes only when the pot is finished or restarted, so nothing is announced on every frame.",
    "With reduced motion the wheel never turns: the finished vase is drawn once, touching the pointer, at 100 percent.",
    "Dragging the wheel and steering the lamp are extras for a mouse or finger. Throw again is a real button with a focus ring and is the only control that changes anything.",
  ],
  faqs: [
    {
      question: "How is the clay shaded without a 3D library?",
      answer: "The pot is a surface of revolution, so every horizontal slice is a strip of the same cylinder. A small off-screen image holds the lighting for each position round the pot and for each amount the wall leans in or out. The loop then stretches one row of that image across each slice. The image is rebuilt only when the lamp moves.",
    },
    {
      question: "Why do the ridges seem to climb the pot?",
      answer: "A potter's fingers leave one continuous spiral as they rise. Seen from the side a turning spiral looks like rings moving upward. The line `Math.sin(h * 0.82 - s.spin)` adds that ridge to the radius, and the slope of the ridge picks a lighter or darker row of shading.",
    },
    {
      question: "What happens to the pot when progress goes back to zero?",
      answer: "The drawn height follows the real value on a spring, so a reset makes the wall sink back into a puck over about half a second while the wheel picks up speed again. Nothing jumps.",
    },
    {
      question: "Can I remove the height gauge?",
      answer: "Yes. Delete the block that starts with the comment about the height gauge. The loader still works, but keep the visible percentage in that case, because the pointer is what shows how far there is to go.",
    },
    {
      question: "Is it heavy to run?",
      answer: "Each frame draws a few hundred one pixel slices from a 256 by 28 image plus the wheel. The loop stops when the tab is hidden or the loader is scrolled off screen, and the canvas resolution is capped at two and a half times its CSS size.",
    },
  ],
  related: [
    "steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded",
    "brass-spinning-top-loader-that-chalks-a-spiral-and-stands-upright-when-done",
    "mechanical-watch-movement-loader-with-swinging-balance-wheel-and-breathing-hairspring",
  ],
  tags: ["loader", "progress", "pottery", "clay", "canvas", "skeuomorphic", "percentage"],
  height: 830,
  interactive: true,
};

export default meta;
