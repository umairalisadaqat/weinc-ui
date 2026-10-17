const meta = {
  slug: "photoreal-pricing-table-with-monthly-yearly-switch-and-three-glass-blocks-of-different-heights-in-one-shaft-of-window-light",
  category: "pricing",
  name: "Photoreal Pricing Table with Monthly Yearly Switch and Three Glass Blocks of Different Heights in One Shaft of Window Light",
  keyword: "pricing table",
  title: "Pricing Table with Monthly Yearly Switch in Glass | We.Inc",
  description: "Free React pricing table: three plans with features and a button each, a monthly/yearly switch, and glass price blocks lit by one shaft of sun in WebGL.",
  intro: "A complete three-plan pricing table for a SaaS page, topped by a photograph-like scene. Three blocks of thick, slightly green glass stand on honed limestone in front of a cobalt limewashed wall, short, medium and tall, so the size of each plan reads before any number does. Each block has its plan name and price sandblasted into the front face. A narrow window behind and to the left lets in one shaft of low sun; it lands on the chosen plan, passes through the glass and throws bright bands of light onto the stone toward you. Choose another plan and the shaft slides along the row. Flip the billing switch and the frosted prices on every block fade over to the yearly figures. Under the scene sits the usable part: three plan cards with the price, what it is billed as, a one-line pitch, a feature list and a call-to-action link, all real HTML. The scene is one fragment shader that averages many jittered frames into a clean still and then stops drawing. Prices shown are examples.",
  useWhen: [
    "A SaaS or tool site needs a standard three-tier pricing table and wants the top of the section to stop people scrolling.",
    "Your plans differ mainly in volume, so blocks that grow with the tier say the same thing as the feature lists.",
    "You offer a yearly discount and want the switch to change every price on the page at once, both in the picture and in the cards.",
    "The page already has a strong colour and a premium feel, and flat cards on their own would look thin.",
  ],
  customize: [
    "Edit the `plans` array: `monthly` and `yearly` are both per-month rates, `features` fills each card, `cta` is the button text and `height` is the block height in centimetres. The lettering in the glass is redrawn from the same numbers by `legendArt`.",
    "The wall colour is the `vec3(0.03, 0.065, 0.33)` passed to `matPlaster` in `shadeOpaque`; match it with the section's `bg-[#0d1a4a]`. The stone tones are the two colours mixed by `cloud` just above.",
    "`GLASS_ABS` is how much the glass soaks up red, green and blue per centimetre: raise the first number for greener, heavier glass, or set all three near zero for water-clear crystal.",
    "`KEY` points toward the window and `KEY_COL` in the rig settings sets the sun's warmth and strength. `WIN_HALF` is the size of the opening, so a smaller first number makes a narrower shaft. `POOL_SPRING` and `POOL_DAMPING` set how the light travels between plans.",
    "Set `DEMO` to `false` to stop the section switching billing and plans by itself before anyone touches it.",
  ],
  accessibility: [
    "Plan choice is a fieldset of three native radio inputs inside the cards, so arrow keys move between plans and focus shows as a ring around the plan name. Clicking a glass block in the picture does the same thing but is hidden from the tab order and screen readers to avoid duplicates.",
    "Billing is a `button` with `role=\"switch\"` and `aria-checked`, labelled Bill yearly. A polite live region reads out the chosen plan, its price and how it is billed after each change.",
    "The canvas is hidden from assistive technology. With reduced motion the demo does not run and the light and lettering jump to their new state in one frame. Without WebGL 2 a plain still of the blocks is shown and every control keeps working.",
  ],
  faqs: [
    { question: "Is the pricing table usable without the 3D scene?", answer: "Yes. The cards, the radio inputs, the switch and the buttons are ordinary HTML under and over the canvas. You can delete the stage div and keep a working, styled pricing table with a monthly and yearly toggle." },
    { question: "How does the light pick out the chosen plan?", answer: "The window is a rectangle a long way behind the blocks. For every point the shader asks whether a line from that point toward the sun passes through the opening. Sliding the opening sideways moves the whole shaft, so the code works out, from the window's own axes, the offset that centres the opening on the chosen block and springs toward it." },
    { question: "Why are there bright stripes in the shadow of the glass?", answer: "Sun that reaches the stone behind a block has gone through it. The shader measures how much glass each ray crossed and how close it passed to an edge. Rays near an edge are bent away, which leaves a dark outline, and the light they lose gathers in a band just inside it. That pattern is what a real glass block throws in low sun." },
    { question: "How are the prices put inside the glass?", answer: "A canvas is filled with white text on black, one tile per plan for monthly and one for yearly, and uploaded as a texture. Where the text is white the front face is treated as a much rougher surface, so the light passing through scatters there and the letters read as sandblasted. The switch fades between the two tiles." },
    { question: "Does it keep the GPU busy?", answer: "Only while something moves. The canvas is capped at about 2.2 million pixels, frames are averaged until the picture is clean, about a second and a half, and then drawing stops. It also pauses when the section scrolls out of view or the tab is hidden." },
  ],
  related: [
    "sunlit-cast-resin-cube-pricing-in-webgl-where-a-shaft-of-window-light-picks-the-plan-and-the-cubes-tumble-over-to-yearly",
    "price-register-with-a-monthly-yearly-throw-lever-that-re-rolls-mechanical-price-drums-and-latching-plan-keys",
    "ticket-roll-dispenser-pricing-with-three-paper-rolls-and-a-plan-ticket-that-tears-off-and-lands-on-a-ledge",
  ],
  tags: ["pricing", "pricing table", "billing toggle", "webgl", "3d", "photoreal", "glass", "plans"],
  height: 1120,
  section: true,
  interactive: true,
};

export default meta;
