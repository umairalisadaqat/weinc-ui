const meta = {
  slug: "photoreal-html-css-button-set-of-glazed-ceramic-brushed-steel-walnut-and-frosted-glass-keys-on-travertine-in-window-light",
  category: "buttons",
  name: "Photoreal HTML CSS Button Set of Glazed Ceramic, Brushed Steel, Walnut and Frosted Glass Keys on Travertine in Window Light",
  keyword: "html css button",
  title: "Photoreal HTML CSS Button Set in Ceramic, Steel and Glass | We.Inc",
  description: "Free React button set rendered in WebGL: four pressable keys in glazed ceramic, brushed steel, walnut and frosted glass, sitting in a stone slab under window light.",
  intro: "Four square keys sit in wells cut into a slab of honed travertine, and a low sun through a mullioned window lays a pool of light across them. Publish is oxblood glazed ceramic with raised cream lettering, Save draft is brushed steel with the words engraved and filled black, Preview is oiled walnut with cream inlay, and Cancel is frosted glass with a sandblasted legend that glows where the sun passes through it and throws a pale green light onto the stone. The picture is one fragment shader that blends many jittered frames together, so edges, soft shadows, the blur of the far stone and the frost on the glass all settle into a clean still within about a second, and then drawing stops. Each key has a real button laid exactly over it: press with a finger, mouse, Space or Enter and the key travels down into its well and springs back. A line at the bottom announces which button was pressed. On a phone the keys rearrange into two rows of two and the camera moves in so the lettering stays readable.",
  useWhen: [
    "A product launch page needs a primary, secondary, tertiary and cancel action shown as one object worth stopping for.",
    "You are building a design system showcase and want each button weight carried by a material instead of a colour swatch.",
    "A landing page for a hardware, furniture or craft brand where flat pill buttons would feel out of place.",
    "You want a reference for laying real HTML controls over a WebGL scene without losing keyboard access.",
  ],
  customize: [
    "Rename the actions in the `keys` array at the top. The `label` is drawn into the key top by `legendArt` and is also the button's accessible name, so one edit changes both.",
    "Swap materials inside `shadeKey`: each branch calls one material such as `matCeramic(q, n, vec3(0.17, 0.02, 0.017))`. Change that colour for another glaze, or call `matPolished(q, n, BRASS)` to turn the steel key into polished brass.",
    "Move the sun with `KEY_DIR` and `WIN_OFF` in the rig settings string, and set its warmth and strength with `KEY_COL`. A smaller `WIN_HALF` makes a tighter pool of light; `BAR` sets the width of the window bar shadows.",
    "`TRAVEL` is how far a key goes down in centimetres and `REST_TOUCH` how much it dips while the pointer rests on it. The spring constants passed to `springStep` (1100 and 42) set how snappy the return feels.",
    "Set `DEMO` to `false` to stop the keys pressing themselves in turn before anyone touches the piece.",
  ],
  accessibility: [
    "Every key is a native `button` with its label as visually hidden text, positioned over the drawn key with the same camera maths the shader uses, so clicks, taps, Tab, Space and Enter all work and screen readers read the label.",
    "Focus shows as a cream ring around the key itself. The message under the slab is a polite live region that says which action was pressed.",
    "With reduced motion the demo does not run and keys snap down and up without travel. Without WebGL 2 the same four buttons appear as plain styled squares with visible text on a warm backdrop.",
  ],
  faqs: [
    { question: "Is this really HTML and CSS buttons, or only a picture?", answer: "Both. The look is a WebGL picture, but the controls are four ordinary HTML button elements placed over it. They take focus, fire click events and can be wired to any handler, exactly like a CSS-styled button. If WebGL is missing they become visible styled buttons on their own." },
    { question: "Why does the image look noisy for a moment after a press?", answer: "Each frame traces one random sample per pixel for the sun disc, the lens and the rough reflections. While a key moves the shader keeps only a frame or two of history, which shows as a light film grain. Once the key rests, frames are averaged until the picture is clean, and then the canvas stops drawing to save battery." },
    { question: "How is the frosted glass key drawn?", answer: "The shader picks a slightly different surface normal on every frame from a rough distribution, bends the line of sight through it into the block, finds where it leaves the bottom, and looks at the well and stone beneath. Averaging those frames gives the soft frosted look. A little light scattered inside the glass is added where the sun reaches it, and its lettering is simply a much rougher patch." },
    { question: "Can I change the button labels to longer words?", answer: "Yes. The lettering is drawn into a canvas texture at load, and any label wider than the key top is scaled down to fit. Two short words fit comfortably; past about twelve characters the type gets small on phones, so keep labels short as you would on any button." },
    { question: "Will it slow down my page?", answer: "The canvas is capped at about 2.2 million pixels and two times device pixel ratio, it pauses when scrolled off screen or when the tab is hidden, and it lowers its own resolution if frames run long while a key moves. At rest it does not draw at all." },
  ],
  related: [
    "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
    "ray-marched-anodised-aluminium-air-key-on-black-glass-with-real-travel-a-backlit-legend-and-a-light-ring-that-latches-on",
    "html-css-button-set-with-primary-secondary-outline-ghost-icon-loading-and-destructive-styles",
  ],
  tags: ["buttons", "webgl", "3d", "photoreal", "ceramic", "glass", "wood", "metal"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
