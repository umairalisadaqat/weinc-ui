const meta = {
  slug: "slatted-blind-sunlight-sliding-across-plaster-wall-background",
  category: "backgrounds",
  name: "Slatted Blind Sunlight on a Plaster Wall",
  keyword: "css animated background",
  title: "Slatted Blind Sunlight CSS Animated Background | We.Inc",
  description: "Free animated background in pure CSS: warm light through window blinds drifts across a grainy plaster wall. React and plain HTML versions, no canvas.",
  intro: "Late afternoon sun falls through a window blind and lands on a warm plaster wall as a stack of soft golden bars. Over half a minute the patch drifts sideways and changes angle, the way real sunlight creeps across a room, while the slats themselves tilt very slightly. It suits hand-made goods, cafes, studios and any brand that wants its homepage to feel lived in. On phones the light still crosses behind the heading, which keeps its dark ink colour for contrast.",
  useWhen: ["A craft studio, bakery or small hotel wants a homepage that feels like a real room at golden hour rather than a flat colour field.", "You need gentle motion behind a large headline that never competes with it, since the light changes so slowly most visitors notice it only after a few seconds.", "Your page budget rules out video or a canvas loop, and a few transformed layers are all you can afford.", "A warm, neutral backdrop has to sit beside product photography without clashing with its colours."],
  customize: ["Change `--vbl-sun` to tint the light. A pale `rgba(255,240,215,.8)` reads as morning, while a deeper `rgba(255,170,100,.8)` reads as sunset.", "Raise `--vbl-speed` from `30s` to `50s` if you want the patch to move so slowly it feels almost still; lower values make the drift easy to spot.", "Set `--vbl-slat` to the spacing of the blind. `24px` gives narrow office blinds, `56px` gives wide wooden shutters.", "Swap `--vbl-wall` and the second colour in the root gradient for a cooler wall, for example `#dfe3e6` and `#c9cfd4`, then darken `--vbl-ink` to match."],
  accessibility: ["The light, grain and shade layers live in one wrapper marked `aria-hidden=\"true\"` with `pointer-events:none`, so the heading, paragraph and link are the only things assistive tools and clicks reach.", "Text uses a dark brown ink on a light wall and stays readable when the brightest slat passes behind it; check contrast again if you lighten `--vbl-ink` or brighten `--vbl-sun`.", "With reduced motion requested, the animations are removed and the light rests at a tilted angle across the right side of the wall, so the scene still looks finished."],
  faqs: [{"question": "How are the blind shadows drawn without an image?", "answer": "One element carries a repeating linear gradient that alternates warm light and transparent gaps. It is rotated and skewed so the bars fall at an angle, blended with `screen` so they brighten the wall, and faded at the edges with a radial mask so the patch has no hard border."}, {"question": "Does this slow down the page?", "answer": "The moving parts are a transform on the light patch, a transform on the slats inside it and an opacity change on the bounce glow. The blur and mask are drawn once and then moved as a whole, so each frame is mostly compositor work."}, {"question": "Can I make the sun move with the scroll position instead of on a timer?", "answer": "Yes. Remove the `vbl-slide` animation and set the patch transform from a scroll listener or a scroll-driven animation timeline. Keep the reduced motion rule so people who turn motion off still get a still wall."}, {"question": "Why does the light stop when I scroll the block away?", "answer": "A small observer adds a `data-paused` attribute when the section leaves the viewport, and the stylesheet pauses every animation inside it. Nothing runs in the background while visitors read further down the page."}, {"question": "Will it work in a dark theme?", "answer": "The effect relies on the `screen` blend brightening a light wall. On a dark wall, change the blend to `soft-light` or raise the opacity of the sun colour, and switch the text to a light ink."}],
  related: ["css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain", "sheer-linen-curtain-webgl-background-where-afternoon-sun-and-leaf-shadows-sway-across-a-plaster-wall"],
  tags: ["sunlight", "window blinds", "shadow", "warm", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  standalone: true,
  tech: "css",
  reducedMotion: "The sunlight bars rest in one tilted patch across the right of the wall, with grain and shading unchanged.",
  perf: "Three layers move by transform or opacity on the compositor; the only script is an observer that pauses it off screen.",
};

export default meta;
