const meta = {
  slug: "enamel-lever-billing-switch-in-webgl-on-sunlit-terrazzo-that-throws-over-centre-between-monthly-and-yearly",
  category: "toggles",
  name: "Enamel Lever Billing Switch in WebGL on Sunlit Terrazzo That Throws Over Centre Between Monthly and Yearly",
  keyword: "monthly yearly billing toggle react",
  title: "Monthly Yearly Billing Toggle, Enamel Lever | We.Inc",
  description: "Free React billing toggle: a red enamel lever on a cream plate, ray-marched in WebGL on sunlit terrazzo, that snaps over centre between monthly and yearly.",
  intro: "A billing period switch drawn as a piece of hardware. A cream enamel plate sits on a polished terrazzo floor in morning sun, with MONTHLY and YEARLY printed across its front edge, and a fat tomato red lever stands in a slot between them. The scene is ray-marched in a single fragment shader, so the window light throws a real shadow, the glossy plate mirrors the lever, and chips in the floor catch the sun. Flipping it is meant to feel heavy: the lever creeps a little while its spring loads, lets go, slams into the far stop with a small rebound, and the plate jolts on impact. The price beside it rolls to the new figure at the same moment. On phones the switch takes the top of the block and the price sits underneath it.",
  useWhen: [
    "A pricing page needs one memorable control at the top that changes every card below it between monthly and yearly figures.",
    "A product with a warm, crafted brand wants its billing choice to feel like a physical decision rather than a grey pill.",
    "A checkout step asks for the billing period once and you want the choice to be impossible to miss.",
    "A landing page for a single plan has room for a large interactive object next to the price.",
  ],
  customize: [
    "`plan` at the top holds the name, both prices, the period words and the note under each price. The figures shipped are placeholders, so replace them with your own.",
    "`LABELS` is the text printed on the plate. Keep each word short, since `paintPlate` sets them at 58 pixels on a 1024 pixel wide texture.",
    "The lever colour is `vec3(.80,.20,.12)` in the shader and the plate is `vec3(.94,.905,.83)`. Try `vec3(.10,.32,.62)` for a cobalt lever.",
    "`STOP` is how far the lever leans either side, in radians. The snap strength is the `46` in `step`, and the rebound is `0.3`.",
    "`LD` is the sun direction. Raise its middle value for a higher sun and shorter shadows, and edit `gobo` to move the window frame shadow on the floor.",
  ],
  accessibility: [
    "The drawing is decoration. The real control is a button with `role=\"switch\"` and `aria-checked`, laid exactly over the drawn switch by projecting it through the same camera.",
    "Space and Enter flip the lever, and the Left and Right arrow keys pick monthly or yearly directly. The focus ring follows the outline of the plate.",
    "The price and its period sit in a polite live region, so the new figure is read out after each change.",
    "With reduced motion the lever jumps to its stop, the price swaps without sliding and the self-running demo never starts. Without WebGL a drawn picture of the same switch is shown instead.",
  ],
  faqs: [
    {
      question: "How does the lever get its weight?",
      answer: "The motion is a small simulation, not a tween. For about a tenth of a second the lever creeps backwards as if the spring is loading, then a constant force throws it across. When it reaches the stop its speed is reversed and cut to a third, which gives one or two short knocks, and the hit also kicks a stiff spring that jolts the whole plate down a fraction.",
    },
    {
      question: "Can I drag the lever instead of clicking it?",
      answer: "Yes. Press on the switch and move sideways. The lever follows your finger, and if you let go past a short distance toward the other side it snaps over. A short move lets it fall back where it was. The button uses `touch-none` so dragging on a phone does not scroll the page.",
    },
    {
      question: "How is the printing put on the enamel?",
      answer: "A hidden 2D canvas draws the two words, the dots and the tick marks as white shapes on a clear background. That canvas is uploaded as a texture and the shader uses its alpha to mix navy ink into the plate colour wherever the top face is hit. It is redrawn on each change so the chosen word prints at full strength.",
    },
    {
      question: "Will it slow down my pricing page?",
      answer: "The canvas is capped at about 1.2 million pixels and one and a half device pixels per screen pixel, and the loop stops when the block is off screen or the tab is hidden. While still, it spends a couple dozen frames smoothing edges and blurring the far floor, then stops drawing. If frames run long during motion the resolution steps down.",
    },
    {
      question: "How do I connect it to my pricing cards?",
      answer: "The `yearly` state is a boolean. Lift it into the parent of your pricing grid with a prop and an onChange callback, then read it wherever you print a price.",
    },
  ],
  related: [
    "price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys",
    "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put",
    "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp",
  ],
  tags: ["billing toggle", "pricing", "webgl", "ray marching", "lever", "enamel", "terrazzo", "switch"],
  height: 640,
  interactive: true,
};

export default meta;
