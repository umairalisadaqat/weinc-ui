const meta = {
  slug: "wind-map-flow-field-background-with-fine-streaks-spiralling-into-a-low",
  category: "backgrounds",
  name: "Wind Map Flow Field",
  keyword: "animated wind map background",
  title: "Wind Map Flow Field Background in Canvas | We.Inc",
  description: "Free animated wind map background: fine streaks ride a flow field and spiral into a low-pressure system. React and plain HTML versions, canvas 2D, no libraries.",
  intro: "Thousands of hairline streaks ride a slow wind field across a dark chart, then wind into a low-pressure system on the right, the way a live forecast map looks. Faster air glows warm and calm air stays steel blue, so the speed of the wind is readable at a glance. The copy sits on the left over a dark fade. On phones the low moves into the lower part of the block, below the button, so the headline keeps a calm patch of chart behind it.",
  useWhen: [
    "A forecasting, sailing or flight school page wants a hero that hints at its subject without a stock photo.",
    "A dark data or logistics product needs movement that reads as measured flow rather than decoration.",
    "A landing page has to stay light: the effect runs on one canvas with no libraries and stops when scrolled away.",
  ],
  customize: [
    "Raise `SETTINGS.density` from 520 to 900 for a sparser, quieter chart, or drop it to 380 for a dense storm.",
    "Change `SETTINGS.gust` to a pale green such as `rgba(190, 240, 200, 0.9)` to colour the fastest air differently from the calm blue.",
    "Move the low by editing the `0.72` and `0.5` in `windAngle`, which are its position across and down the block.",
    "Set `SETTINGS.trail` to 0.04 for long sweeping streaks or 0.12 for short dashes.",
  ],
  accessibility: [
    "The canvas is marked `aria-hidden` and ignores the pointer, so screen readers and clicks go straight to the heading, copy and link.",
    "A dark gradient sits under the copy so the white heading keeps strong contrast even over the brightest streaks near the low.",
    "Visitors who ask for reduced motion get one settled frame of streaks and no animation loop at all.",
  ],
  faqs: [
    {
      question: "How does a flow field background work?",
      answer: "Every point on the canvas has a direction worked out from a few overlapping sine waves. Each frame, every particle takes one small step in the direction under it and draws that step as a short line, while older lines fade a little. Together the strokes trace the shape of the field.",
    },
    {
      question: "How is the spiralling low made?",
      answer: "Near one centre point the direction is replaced, step by step, with a direction that circles the centre and leans slightly inward. The two directions are blended as vectors rather than angles, which avoids a visible seam where the angle wraps from one side to the other.",
    },
    {
      question: "Why do the streaks fade instead of the canvas clearing each frame?",
      answer: "The script erases a small share of what is already drawn on every frame, so each stroke lingers for a moment and joins with the strokes before it into a streak. Clearing fully would leave only scattered dots.",
    },
    {
      question: "Is it heavy to run?",
      answer: "It moves about one particle for every 520 square pixels and draws them in three batched strokes, which keeps each frame short on ordinary laptops and phones. Scroll the weather map away or switch tabs and its frame loop goes quiet.",
    },
    {
      question: "Can I use it without React?",
      answer: "Yes. The plain HTML version holds the same markup, styles and script in one snippet. Paste it where the hero should go and it sizes itself to the block, so you can change its height in the stylesheet.",
    },
  ],
  related: [
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
    "wet-asphalt-at-night-webgl-background-with-puddles-that-mirror-coloured-shop-signs-and-rain-rings",
  ],
  tags: ["flow field", "wind", "canvas", "weather map", "dark"],
  height: 640,
  section: true,
  collection: "animated-background",
  standalone: true,
  tech: "canvas",
  reducedMotion: "The chart shows one settled frame of streaks already drawn along the wind, and nothing moves.",
  perf: "About one particle per 520 square pixels, drawn as short line segments in three batched strokes per frame on canvas 2D.",
};

export default meta;
