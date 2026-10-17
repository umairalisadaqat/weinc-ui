const meta = {
  "slug": "perspective-floor-grid-with-travelling-horizon-glow",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "name": "Perspective Floor Grid with Horizon Glow",
  "keyword": "animated background css",
  "title": "Animated Perspective Grid Background in CSS | We.Inc",
  "description": "Free animated background in pure CSS: a perspective floor grid rolls toward you while a warm glow slides along the horizon. React and plain HTML versions.",
  "intro": "A dusk-coloured floor grid tilted in 3D with CSS perspective, rolling slowly toward the viewer while a warm pool of light slides from side to side across the floor. A soft sun sits on the horizon and the far lines fade into haze, so the headline above has a calm dark sky to sit on. Everything is CSS: one rotated plane, one moving line layer and one gliding glow. On phones the horizon sits lower.",
  "useWhen": [
    "A music, events or night venue site wants a sense of travel and depth behind its first headline.",
    "You need a hero backdrop with clear motion that still leaves the top half dark and quiet for text.",
    "A launch page should feel cinematic without shipping a video file or a 3D library."
  ],
  "customize": [
    "Change `--pfg-cell` to resize the grid squares; smaller values such as 32px read as a finer, more distant floor.",
    "Set `--pfg-speed` higher, for example 6s, to slow the roll, or lower it for a faster drive toward the viewer.",
    "Swap `--pfg-line` and `--pfg-glow` for a cool palette, such as `rgba(140,200,255,.4)` and `rgba(90,160,255,.8)`, to turn dusk into a blue night.",
    "Move the horizon by editing `top:62%` on `.pfg-stage` and the matching `top` on `.pfg-sun` together."
  ],
  "accessibility": [
    "The whole scene sits in one `aria-hidden` layer with `pointer-events:none`, so the heading, copy and button stay first in reading order and fully clickable.",
    "With reduced motion requested, the grid stops rolling and the glow rests left of centre, leaving a finished still picture rather than an empty block.",
    "Headline and copy sit over the darkest part of the sky; if you lighten the gradient, check the contrast of the paragraph again."
  ],
  "faqs": [
    {
      "question": "How is the 3D floor made without WebGL?",
      "answer": "A wide element is rotated about 76 degrees on its X axis inside a parent that sets `perspective`. Its background is two linear gradients that draw the grid lines, so the browser handles the foreshortening for free."
    },
    {
      "question": "Why does the grid loop without a visible jump?",
      "answer": "The line layer moves down by exactly one cell with `translateY(var(--pfg-cell))` and then restarts. Because the pattern repeats every cell, the first and last frames look identical."
    },
    {
      "question": "What does the @property rule do here?",
      "answer": "It registers `--pfg-heat` as a number so the horizon sun can fade its brightness smoothly. Browsers without @property support simply keep the starting value, and the sun still shows."
    },
    {
      "question": "Is it heavy on phones?",
      "answer": "Two layers move with transform and the sun changes opacity, so the work stays on the compositor. The rotated plane is large, which uses some GPU memory, but there is no script running per frame."
    },
    {
      "question": "Can I put content below the horizon?",
      "answer": "Yes, but the moving lines behind it will compete with small text. Keep body copy above the horizon, or add a dark rounded panel behind anything placed on the floor."
    }
  ],
  "related": [
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
    "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light"
  ],
  "tags": [
    "perspective grid",
    "css 3d",
    "horizon",
    "retro",
    "hero background"
  ],
  "height": 640,
  "reducedMotion": "The grid holds still with the glow resting just left of centre and the horizon sun at full warmth.",
  "perf": "Two transformed layers and one opacity fade on the compositor; no JavaScript beyond an off-screen pause."
};

export default meta;
