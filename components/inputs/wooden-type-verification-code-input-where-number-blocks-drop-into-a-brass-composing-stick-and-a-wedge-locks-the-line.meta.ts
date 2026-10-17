const meta = {
  slug: "wooden-type-verification-code-input-where-number-blocks-drop-into-a-brass-composing-stick-and-a-wedge-locks-the-line",
  category: "inputs",
  name: "Wooden Type Verification Code Input Where Number Blocks Drop into a Brass Composing Stick and a Wedge Locks the Line",
  keyword: "react otp input",
  title: "React OTP Input with Wooden Type in a Brass Stick | We.Inc",
  description: "Free React one-time code field in WebGL: each digit falls into a brass composing stick as a wooden type block, and a walnut wedge locks a correct line.",
  intro: "A six-digit verification field drawn as a printer's composing stick on an oiled oak desk. Every digit you type becomes a block of end-grain wood type with a raised, inked figure, which drops from above, lands corner first and settles beside its neighbours. When the sixth figure matches, a tapered walnut wedge slides in from the front, the line closes up tight and the camera gives a small knock as it seats. A wrong line rattles and lifts back out. The scene is ray-marched in WebGL with window light, soft shadows, brass reflections and a blur that softens the desk away from the stick. The field itself is one ordinary input laid over the stick, so typing, pasting, autofill from a text message and the phone keypad all work as usual. On phones the camera pulls back so the whole stick stays in frame.",
  useWhen: [
    "A sign-in or sign-up step asks for an emailed or texted code and you want that one moment to feel crafted instead of anxious.",
    "A print shop, stationery maker or type foundry wants a confirmation step that matches its trade.",
    "You need a single-field code entry that keeps phone autofill working, rather than six separate boxes that fight the clipboard.",
    "A portfolio or landing page needs one interactive object that rewards a visitor for trying it.",
  ],
  customize: [
    "Change `DEMO_CODE` and `LENGTH` at the top for a different code; in a real product replace the comparison in the effect that watches `code` with a call to your own server.",
    "Edit the `COPY` object for the eyebrow, heading, email line and the three status messages. `EMAIL` should be the address you really sent the code to.",
    "`DROP_FROM` and `GRAVITY` set how far and how fast each block falls; `DEMO_HOLD_MS` sets how long the locked line rests before the self-playing demo repeats.",
    "Brass colour is the `F0` mix in the brass branch of the scene shader, the oak is `alb` in the desk branch, and the window light is `SUN` and the `L` direction.",
    "The figures are drawn into an atlas in `buildAtlas`; swap the font string there for a slab or condensed face to change the style of the type.",
  ],
  accessibility: [
    "There is one real text input with a label, `inputMode=\"numeric\"` and `autocomplete=\"one-time-code\"`, described by the email line and the demo hint. The canvas is hidden from assistive technology because it only repeats the field's value.",
    "Results are announced through a polite status line, and focus shows as a ring around the stick plus a blinking marker over the next empty slot.",
    "With reduced motion every block appears in place at once, the wedge is simply in or out, and the self-playing demo does not run. Without WebGL a CSS version of the same line of type is shown.",
  ],
  faqs: [
    { question: "Why one input instead of six boxes?", answer: "Six separate boxes break paste, confuse screen readers and often stop phone autofill from filling the whole code. A single field with a six-character limit keeps all of that working, and the picture of six slots is drawn from its value." },
    { question: "Is the code checked on a server?", answer: "Not in this demo. It compares what you typed with `DEMO_CODE` on the page and sends nothing. In production, post the value to your own endpoint and call the engine's `lock` or `reject` from the response." },
    { question: "How is the raised figure on each block made?", answer: "The digits are drawn once into a canvas atlas with a sharp copy and a softened copy. The shader inks wherever the sharp copy is filled and reads the slope of the soft copy to tilt the surface, so the window light catches one shoulder of each figure." },
    { question: "Will it run on an ordinary laptop?", answer: "The scene is only marched inside a tight box around the stick, the desk is a flat plane found in one step, and the canvas is capped at about 1.35 million pixels with a pixel ratio of 1.5. It lowers its own resolution if frames run long and stops drawing off screen or in a hidden tab. The frame rate is written to the canvas as `data-fps`." },
    { question: "What does the demo do to the field?", answer: "On load the line is shown already set and locked, then it lifts out and is set again every few seconds. The first time you focus the field the demo stops and the field clears, so whatever you type is yours." },
  ],
  related: [
    "four-wheel-brass-combination-cable-lock-code-input-with-rings-that-click-round-and-a-cable-that-springs-free",
    "typesetters-forme-where-page-sections-are-locked-up-as-metal-type-in-a-steel-chase-and-pulled-as-a-blue-proof",
    "letterpress-card-testimonials-in-webgl-pinned-with-brass-pins-to-a-linen-board-where-the-chosen-card-unpins-and-lifts-into-focus",
  ],
  tags: ["otp", "verification code", "webgl", "letterpress", "wood type", "brass", "input", "physics"],
  height: 720,
  interactive: true,
};

export default meta;
