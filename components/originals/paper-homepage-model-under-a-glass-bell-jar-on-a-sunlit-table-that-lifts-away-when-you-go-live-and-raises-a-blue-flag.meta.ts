const meta = {
  slug: "paper-homepage-model-under-a-glass-bell-jar-on-a-sunlit-table-that-lifts-away-when-you-go-live-and-raises-a-blue-flag",
  category: "originals",
  name: "Paper Homepage Model Under a Glass Bell Jar on a Sunlit Table That Lifts Away When You Go Live and Raises a Blue Flag",
  keyword: "webgl go live button react publish animation",
  title: "Bell Jar Go Live Button with a Paper Page Model | We.Inc",
  description: "Free React and WebGL go live control: a white card model of a homepage waits under a glass bell jar until a button lifts it off and a blue flag runs up.",
  intro: "A publish control shown as one small scene on a sunlit oak table. A turned walnut base carries a white card model of a homepage: a long strip for the menu, a block for the headline with pencilled rules, a tall block for the picture, a blue card button and three cards along the front. While the page is a draft a glass bell jar sits over it, the sun is behind a cloud and a tiny blue flag hangs limp at the foot of a brass pin. Press Go live and the jar rises straight off its seat, swings across and is set down on the table with a small knock, the sun comes out through the window bars, and the flag is run up the pin and starts to ripple in the breeze. Press again and the flag comes down before the glass goes back over. The big word on the left changes between Draft and Live. On a phone the jar is set down behind the model and the words sit above it.",
  useWhen: [
    "The publish step of a site builder or a page editor, where taking a page public should feel like unveiling something you made.",
    "An onboarding screen that explains the gap between a private draft and a public page with one picture instead of a paragraph.",
    "A launch announcement section where the single action people should take is the whole picture.",
    "A portfolio or case study that needs a calm, crafted hero with one clear moment worth replaying.",
  ],
  customize: [
    "`STATES` holds the two big words, the line under each and the label on the button.",
    "The blocks of the paper page are the `blk` calls inside `map` in the `SCENE` shader: each takes a centre, a half size and a height, so you can lay out a different page by editing those numbers.",
    "`gL` in the shader is the direction the sun comes from and `SUNC` its colour; `gSun` sets how strong it is under a cloud and in full sun.",
    "`LIFT_TIME` is how long the jar takes to travel. `HOLD_LIVE` and `HOLD_DRAFT` set how long the self-playing demo waits in each state.",
    "The `land`, `tgt`, `az`, `el` and `dist` values at the top of `draw` place where the jar is set down and where the camera stands, with a second set for phones.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The button is a real `button` with `aria-pressed` and a label that says the current state and what pressing it will do.",
    "A polite live region announces whether the page is live or a draft, at the moment the sun comes out rather than when the button is pressed.",
    "With reduced motion the jar, the sun and the flag jump straight to their final positions and only one frame is drawn for each state.",
    "Without WebGL 2 a still built from plain elements shows the model, the flag and the jar, and the button still switches between the two states.",
  ],
  faqs: [
    {
      question: "Does this need a 3D library?",
      answer: "No. The scene is ray marched in one fragment shader written against the plain WebGL 2 API inside a React effect, with a second small pass for focus blur, bloom and grain. There is nothing to install beyond React and framer-motion.",
    },
    {
      question: "How is the glass drawn without real refraction?",
      answer: "The jar is treated as a thin shell found with exact ray tests against a cylinder, a dome and a knob. Each surface adds a reflection of the room weighted by the Fresnel term, tints what is behind it more strongly near its edges, and bends the view ray slightly, which is enough to read as glass.",
    },
    {
      question: "Can I wire the button to my real publish call?",
      answer: "Yes. Call your publish request in the `press` handler before or after `api.current.toggle()`, and only toggle once the request succeeds if you want the jar to stay down on failure.",
    },
    {
      question: "Why does the flag hang still under the glass?",
      answer: "The `uWind` value drives both the angle of the flag and its ripple. Under the jar it is zero, so the flag hangs against the pin; once the jar is off it springs up to one and the flag stands out in the breeze.",
    },
    {
      question: "How heavy is it to run?",
      answer: "The render size is capped, the loop lowers its resolution when frames run slow, and drawing stops when the section scrolls out of view or the tab is hidden.",
    },
  ],
  related: [
    "ray-marched-aluminium-publish-key-on-a-blue-lit-plinth-that-strikes-a-lightbox-model-of-the-page-from-draft-to-live",
    "three-glass-cake-domes-on-ceramic-stands-each-keeping-a-different-site-design-where-the-dome-lifts-off-the-one-you-choose",
    "white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive",
  ],
  tags: ["webgl", "publish", "go live", "glass", "paper model", "ray marching", "originals"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
