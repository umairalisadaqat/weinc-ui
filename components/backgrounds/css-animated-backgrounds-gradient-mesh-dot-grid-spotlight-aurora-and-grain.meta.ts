const meta = {
  slug: "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
  category: "backgrounds",
  name: "CSS Animated Background Set: Gradient Mesh, Dot Grid Spotlight, Aurora and Grain",
  keyword: "css animated background",
  title: "CSS Animated Background: 4 Light Hero Backdrops | We.Inc",
  description: "Free animated background set in pure CSS: drifting gradient mesh, dot grid spotlight, aurora bands and film grain. React and Tailwind, no canvas.",
  intro: "Four animated backgrounds built with nothing but CSS, each shown behind a small hero so you can judge it with real text on top. The gradient mesh drifts three soft colour pools across warm paper. The dot grid lights up only the dots a teal spotlight passes over. The aurora layers three tilted bands that sway and stretch over a dark sky. The grain piece moves a pool of daylight under a jittering noise texture. Every moving layer animates transform alone, so nothing repaints while it runs, and there is no canvas, WebGL or script loop. A pause button above the grid stops all four, and visitors who ask their system for reduced motion get still backgrounds. On phones the cards stack into one column.",
  useWhen: [
    "A landing page hero feels flat on a plain colour but a video or 3D scene would be far too heavy.",
    "You want motion behind a sign-up or waitlist block that still scores well on page speed checks.",
    "A dark developer tool page needs texture behind its headline, which the dot grid spotlight gives without competing with code samples.",
    "An editorial blog or newsletter wants a printed, paper feel, which the grain backdrop provides.",
  ],
  customize: [
    "Speed lives in each animate class: change `cab-drift-a_18s` to `30s` for a calmer mesh, or shorten `cab-spot_16s` to make the spotlight roam faster.",
    "Colours are the rgba values inside each `radial-gradient`. For a green mesh, swap the orange `rgba(251,146,60,.55)` for `rgba(74,222,128,.5)`.",
    "Dot spacing is the `22px` in both the base layer's background size and the `.cab-dots-holes` mask size. Keep the two equal or the lit dots will miss the grey ones.",
    "Grain strength is `opacity-[.35]` on the noise layer. Drop it to `.2` for a hint of texture, and change `baseFrequency='.9'` in `NOISE` for coarser or finer grain.",
    "To use one background alone, copy the `css` string and the one function you want (for example `AuroraBg`) and render it as the first child of any `relative overflow-hidden` block.",
  ],
  accessibility: [
    "Every background layer has `aria-hidden`, so screen readers move straight to the heading, copy and link in each hero.",
    "The Pause motion button uses `aria-pressed` and freezes every animation through `animation-play-state`, which meets the rule that moving content can be stopped.",
    "A `prefers-reduced-motion` query removes the animations entirely. Keep it if you rename the classes.",
    "Text sits on the calmest part of each card and is checked against the brightest moment of each effect. Re-check contrast if you raise the colour strengths.",
  ],
  faqs: [
    {
      question: "How do I make an animated background with only CSS?",
      answer: "Place absolutely positioned layers behind your content, give each a soft radial gradient, and move them with a keyframe animation that changes `transform`. Because translate and scale do not trigger layout or paint, the browser can run them on the GPU even on modest phones.",
    },
    {
      question: "Why not animate background-position or a blur filter?",
      answer: "Changing background-position, gradient stops or a blur forces the browser to repaint the area every frame. These pieces fade gradients out to transparent instead of blurring them, then slide whole layers, which costs almost nothing per frame.",
    },
    {
      question: "How does the spotlight light only the dots?",
      answer: "A glowing teal circle moves underneath a dark sheet. That sheet carries a CSS mask with a small transparent hole on every grid point, so the glow only shows through the holes, and the dots look as if they switch on as the light passes.",
    },
    {
      question: "Will this slow my page down?",
      answer: "Each card runs three or fewer transform animations and the grain noise is one small inline SVG tile. There is no JavaScript running per frame. For many backgrounds on one long page, you can pause the ones off screen by toggling `animation-play-state`.",
    },
    {
      question: "Does it work in plain HTML without React?",
      answer: "Yes. The effects are CSS classes and inline gradients. Copy the keyframes and the layer markup, change `className` to `class`, and the only React part you lose is the pause button, which is a one-line attribute toggle in plain script.",
    },
  ],
  related: [
    "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light",
    "wet-asphalt-at-night-webgl-background-with-puddles-that-mirror-coloured-shop-signs-and-rain-rings",
    "marbled-paper-webgl-background-with-floating-inks-combed-into-feathers-on-a-wet-size-bath",
  ],
  tags: ["animated background", "css", "gradient mesh", "dot grid", "aurora", "noise", "grain", "hero"],
  height: 820,
  section: true,
  interactive: true,
};

export default meta;
