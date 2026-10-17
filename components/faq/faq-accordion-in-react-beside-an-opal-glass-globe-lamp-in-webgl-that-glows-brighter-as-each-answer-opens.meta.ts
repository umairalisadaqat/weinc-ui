const meta = {
  slug: "faq-accordion-in-react-beside-an-opal-glass-globe-lamp-in-webgl-that-glows-brighter-as-each-answer-opens",
  category: "faq",
  name: "FAQ Accordion in React Beside an Opal Glass Globe Lamp in WebGL That Glows Brighter as Each Answer Opens",
  keyword: "faq accordion",
  title: "FAQ Accordion in React with a Glowing Glass Lamp | We.Inc",
  description: "Free React FAQ accordion with aria-expanded buttons, smooth height and one or many open, beside a WebGL opal glass lamp that brightens per answer.",
  intro: "A working FAQ accordion on a deep blue-grey panel, and beside it a photograph-like scene: an opal glass globe lamp on a brass foot, standing on a walnut table against a painted plaster wall, with late sun from a window on the left laying bar shadows across the wood. With every answer closed the bulb is off and the globe is just milky glass in daylight. Open one answer and the filament warms up to a low amber glow; each further answer turns it up, until with all five open the globe burns bright, throws a warm pool around its foot and lifts the wall behind it. The accordion itself is plain React: each question is a real button inside a heading with aria-expanded and aria-controls, answers slide open by animating grid rows from 0fr to 1fr so any length of text gets a smooth height, and a small switch picks between one answer at a time and several at once. The lamp is one fragment shader that averages jittered frames into a clean still and then stops drawing.",
  useWhen: [
    "A product page for a physical object where the questions sit next to a picture of the thing itself.",
    "You need an accessible accordion that can run as single-open or multi-open without a library.",
    "A support or shop page that is otherwise flat and wants one calm, crafted moment.",
    "You want a reference for driving a WebGL scene from ordinary React state.",
  ],
  customize: [
    "Edit the `faqs` array at the top: `q` is the question on the button and `a` the answer. Any number works; the lamp reaches full brightness after about five.",
    "`OPEN_AT_START` lists which answers are open on load. Use `[]` to start with the lamp off.",
    "`GLOW_FIRST` is the brightness with one answer open and `GLOW_STEP` what each extra answer adds. The spring in `springStep(s.glow, s.target, dt, 26, 10)` sets how slowly the bulb warms up.",
    "`WALL` sets the panel colour; change the plaster tint in `matPlaster(p, n, vec3(0.055, 0.095, 0.13))` to match it. The lamp colour is `LAMP` in the scene string.",
    "Move the sun with `KEY_DIR` and `WIN_OFF` in the rig settings and dim it with the number after `KEY_COL`.",
  ],
  accessibility: [
    "Every question is a native button inside an h3, with aria-expanded and aria-controls; each answer is a region labelled by its question. Closed answers are inert, so they are skipped by Tab and screen readers.",
    "Up and Down arrows move between questions, Home and End jump to the first and last, Enter and Space open and close. Focus shows as a cream ring.",
    "The single or multiple switch is a pair of buttons with aria-pressed, and a polite live line says how many answers are open.",
    "The lamp canvas is hidden from assistive tech. With reduced motion the answers open without sliding and the lamp changes brightness without fading. Without WebGL 2 a plain glowing disc stands in for it.",
  ],
  faqs: [
    { question: "How do I make only one answer open at a time?", answer: "Set the starting value of `many` to false, or let visitors choose with the switch above the list. In single mode, opening a question replaces whatever was open, and switching from several to one keeps only the first open answer." },
    { question: "How is the smooth height done without measuring?", answer: "Each answer sits in a CSS grid whose only row animates from 0fr to 1fr, with the content inside set to overflow hidden. The browser works out the real height, so long answers, wrapping on phones and font loading all just work." },
    { question: "Can I drop the lamp and keep only the accordion?", answer: "Yes. Delete the `Lamp` component, the kit section and the scene strings, and render the left column alone. The accordion uses nothing from the scene." },
    { question: "Does the lamp keep the GPU busy?", answer: "Only while the glow is changing. Once the brightness settles the picture converges in about a second and drawing stops. It also pauses when scrolled off screen or when the tab is hidden." },
  ],
  related: [
    "oak-card-index-box-faq-with-tabbed-question-cards-that-rise-out-and-stand-against-the-open-lid",
    "folded-paper-tag-faq-hung-on-brass-hooks-in-ray-marched-sunlight-where-each-tag-drops-open-to-show-its-printed-answer",
    "matchbook-faq-row-where-each-printed-cover-flips-up-off-its-comb-of-matches-to-show-the-answer-inside",
  ],
  tags: ["faq", "accordion", "webgl", "3d", "photoreal", "glass", "lamp", "react"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
