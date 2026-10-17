const meta = {
  slug: "ray-marched-aluminium-publish-key-on-a-blue-lit-plinth-that-strikes-a-lightbox-model-of-the-page-from-draft-to-live",
  category: "originals",
  name: "Ray Marched Aluminium Publish Key on a Blue Lit Plinth That Strikes a Lightbox Model of the Page from Draft to Live",
  keyword: "webgl publish button react draft live toggle",
  title: "3D Publish Key That Lights a Page from Draft to Live | We.Inc",
  description: "Free React and WebGL publish toggle. One heavy aluminium key on a blue lit plinth sends light down a floor channel and strikes a lightbox page from draft to live.",
  intro: "A publish control drawn as a studio photograph that happens to be running. On the left of a dark polished floor stands a black anodised plinth with a brushed aluminium collar, held down by four socket screws, and in the collar sits one square key with a lathe-faced dish in its top and an arrow cut through it. Blue light leaks from the gap round the key and from under the plinth. A thin channel let into the floor runs from the plinth to a second, lower base that holds a small lightbox with a model of a homepage in it. While the page is a draft the lightbox is dark and shows a dashed pencil plan of blocks. Press the key and it drops onto its stop, a pulse runs down the channel, a blue line climbs the film replacing the plan with the printed page, and the lamps behind it catch, drop out and hold. The key stays latched part of the way down for as long as the page is live. The word beside the scene changes between Draft and Live, and a pill button repeats the action for keyboards. On a phone the key moves to the front, the lightbox stands behind it and the word sits at the top.",
  useWhen: [
    "The publish step of a site builder, a CMS or a form tool, where going public deserves more ceremony than a checkbox.",
    "A marketing section that explains the difference between a private draft and a public page without a diagram.",
    "A launch page for a product that has one decisive action and wants that action to be the whole picture.",
    "A settings screen mock-up for a talk or a case study, where the audience should see cause and effect travel from the control to the page.",
  ],
  customize: [
    "`SITE` holds everything printed on the lit page: brand, three menu items, two headline lines, the small print, the button label and the footer place name. `PHOTO.src` is the picture on the right of the page.",
    "`STATES` holds the two big words, the sentence under each and the label on the pill button.",
    "In the `SCENE` shader, `BLUE` is the accent in linear colour and `ALU` the reflectance of the key and collar. The two numbers in `capTop` are the height of the key above the collar and its travel.",
    "`LATCH` is how far down the key rests while the page is live, from 0 to 1. `HOLD_LIVE` and `HOLD_DRAFT` set how long the demo waits in each state.",
    "The `key`, `model`, `yaw`, `tgt`, `az`, `el` and `dist` values at the top of `draw` place the two objects and the camera, with a second set for phones.",
    "The flicker when the lamps catch is the short list of times and levels inside `strike`. Remove entries for a clean switch-on.",
  ],
  accessibility: [
    "The canvas and the pointer target over the key are hidden from assistive technology. The pill is a real `button` with `aria-pressed` and a label that says both the current state and what pressing will do.",
    "A polite live region announces the brand and whether it is live or a draft each time the state changes, at the moment the page lights and not when the key is first touched.",
    "With reduced motion nothing loops: one frame is rendered per state, the key and the page jump to their final positions and the big word cross fades.",
    "Without WebGL 2, or if the context is lost, a still built from elements shows the key, the plan and the printed page, and the pill button still switches between them.",
  ],
  faqs: [
    {
      question: "Is the key real geometry or a picture?",
      answer: "Geometry. The plinth, collar, key, base and lightbox are signed distance functions marched per pixel in one fragment shader. The key is a rounded square prism with a sphere subtracted from its top to make the dish, and it moves by changing one uniform, so its shadow, the gap of light round it and its image in the floor all follow.",
    },
    {
      question: "How does the page switch from the plan to the printed design?",
      answer: "Two textures are painted on offscreen canvases when the component mounts: a dashed plan and the finished page. The shader samples both on the face of the lightbox and shows the finished one below a line that rises from the bottom edge. The lamp level is a separate value, so the print is first seen dimly by room light and then lights from behind.",
    },
    {
      question: "Can I wire it to a real publish request?",
      answer: "Yes. `toggle` and `hold` inside the effect are the only places that change state, and `strike` runs when the key reaches its stop. Start your request there, and call the lines that begin the pulse only when the request resolves if you want the page to wait for the server.",
    },
    {
      question: "Why does the metal look brushed on the collar and turned on the key?",
      answer: "Both average seven mirror samples of the softboxes spread along one direction, which stretches the highlight the way fine scratches do. On the collar that direction runs front to back. In the dish of the key it points away from the centre, so the highlight opens into a fan as it does on a part faced on a lathe, and a thin bright lip marks where the cutter stopped.",
    },
    {
      question: "What does it cost to run?",
      answer: "At most about 1.9 million pixels pass through the marcher, and the internal resolution steps down toward `MIN_SCALE` if frames run long. Floor pixels pay for one extra short march for the mirror image. Rendering stops when the section leaves the viewport or the tab is hidden.",
    },
    {
      question: "Can the accent be another colour?",
      answer: "Change `BLUE` in the shader to your colour in linear values, the `BLUE` constant near the top of the file for the pill and the status dot, and the button fill inside `drawLive`. Every glow in the scene is derived from that one shader constant.",
    },
  ],
  related: ["typed-sentence-of-blue-light-on-a-dark-studio-floor-that-stands-up-as-a-ray-marched-homepage-with-floating-layers", "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube", "steel-roller-shutter-stencilled-draft-that-rattles-up-to-show-a-lit-shop-window-holding-the-live-site"],
  tags: ["webgl", "ray marching", "shader", "3d", "publish", "toggle", "draft", "live", "originals"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
