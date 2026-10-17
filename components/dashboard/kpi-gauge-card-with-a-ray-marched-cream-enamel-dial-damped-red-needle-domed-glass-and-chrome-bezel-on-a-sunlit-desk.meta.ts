const meta = {
  slug: "kpi-gauge-card-with-a-ray-marched-cream-enamel-dial-damped-red-needle-domed-glass-and-chrome-bezel-on-a-sunlit-desk",
  category: "dashboard",
  name: "KPI Gauge Card with a Ray-Marched Cream Enamel Dial, Damped Red Needle, Domed Glass and Chrome Bezel on a Sunlit Desk",
  keyword: "react kpi gauge card",
  title: "React KPI Gauge Card: Enamel Dial in WebGL | We.Inc",
  description: "Free React KPI card beside a WebGL desk gauge: cream enamel dial, red needle that swings with real damping, domed glass, chrome bezel and window sunlight.",
  intro: "One number, read two ways. On the left a paper-coloured card prints the reading in very large type with its change against the previous period and a four-way period switch. On the right a desk instrument lies on an oiled oak top in a shaft of afternoon sun: a cream enamel dial printed in black with a red band below forty, a brass target mark, a thin red needle on a chrome arbor, a domed crystal that catches the window and a polished chrome bezel. Everything in the instrument is ray-marched in one fragment shader, including the glazing bar shadows that fall across the desk and the dial. Changing the period swings the needle on a damped spring, so it overshoots, rings back and settles, while the printed number eases in without ever passing its value. The readings are labelled as demo data. On phones the instrument sits above the card and the switch spans the full width.",
  useWhen: [
    "A product or operations dashboard has one headline figure that deserves a hero treatment instead of another flat stat tile.",
    "An annual report or investor page wants a single metric shown with some ceremony, such as retention or on-time delivery.",
    "A landing page for analytics or monitoring software needs a first screen that proves the numbers are live by moving when a period is chosen.",
    "You are building a warm, editorial interface and want a gauge that looks like a real object rather than an SVG arc.",
  ],
  customize: [
    "`periods` holds the demo readings. Each row has a `label` for the switch, a `value` from 0 to 100 on the printed scale, a `delta` in points and the period it is compared `against`.",
    "`METRIC`, `UNIT` and `TARGET` are printed both on the card and on the dial artwork, so changing them redraws the enamel lettering and moves the brass mark.",
    "`ZETA` is the needle damping ratio. 0.3 gives two visible rings before it settles, 0.7 gives one soft overshoot and 1 stops dead with none.",
    "`OMEGA` sets how quick the movement is. Try 4 for a heavy, slow ship's instrument or 11 for a nervous laboratory meter.",
    "The enamel colour is `cream` inside `getMat` in the shader and the sun colour is `SUN`. A cooler `vec3(0.75, 0.74, 0.70)` dial reads as white porcelain.",
    "The window shadow comes from `windowGobo`. The `vec2(2.25, 3.1)` is the pane size and the `0.07` is the bar thickness.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The period switch is a `radiogroup` of real buttons with `aria-checked`, and only the chosen one sits in the tab order.",
    "Arrow keys move between periods and wrap round, Home and End jump to the first and last, and the needle follows the keyboard just as it follows a click.",
    "A polite live region announces the metric, the period and the value in words whenever the period changes, since the animated digits alone would be read mid-count.",
    "With reduced motion the needle and the number jump straight to the new value, the self-running demo never starts and the camera stays still.",
    "Keep the card text on its pale background if you restyle it: the brown body copy passes contrast there but would not on the wood.",
  ],
  faqs: [
    {
      question: "How does the needle get that overshoot and settle?",
      answer: "It is integrated every frame as a damped spring with a natural frequency and a damping ratio, the same model that describes a moving-coil meter. The step is split into four sub-steps so it stays stable when a frame runs long. Lower the damping ratio for more ringing and raise it towards 1 for none.",
    },
    {
      question: "Why does the big number not overshoot with the needle?",
      answer: "A dial reading past the true value for a moment is charming; a printed figure doing the same looks like a bug. The digits follow their own critically damped curve towards the target, so they ease in and stop exactly on it while the needle is still swinging.",
    },
    {
      question: "How is the glass dome drawn?",
      answer: "The crystal is not part of the marched geometry. Each ray is tested against a large sphere whose cap sits above the dial, and where it hits, the shader adds the room seen in reflection weighted by Fresnel, dims what is behind it slightly and thickens the effect near the rim. That keeps it cheap and keeps the needle sharp underneath.",
    },
    {
      question: "Where do the stripes of light come from?",
      answer: "Every shadow test toward the sun also projects the point back to a window plane on the left and checks whether it lands on glass or on a glazing bar. The same window is what the chrome and the crystal reflect, so the light on the desk and the highlight on the dome always agree.",
    },
    {
      question: "What happens without WebGL?",
      answer: "The section shows an SVG instrument in the same pose with the needle at the chosen reading, and the card, switch and announcements keep working because none of them depend on the canvas.",
    },
    {
      question: "Will it hold its frame rate?",
      answer: "The render target is capped at about 1.4 million pixels and 1.5 device pixels per CSS pixel, rays that miss a cylinder around the instrument skip the march, and once the needle settles the loop refines the image for a few dozen frames and then stops. It also pauses off screen and in hidden tabs.",
    },
  ],
  related: [
    "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob",
    "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target",
    "ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo",
  ],
  tags: ["kpi", "gauge", "dashboard", "stat card", "webgl", "ray marching", "needle", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
