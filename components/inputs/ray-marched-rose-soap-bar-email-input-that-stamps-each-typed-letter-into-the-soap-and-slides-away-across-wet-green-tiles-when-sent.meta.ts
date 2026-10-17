const meta = {
  slug: "ray-marched-rose-soap-bar-email-input-that-stamps-each-typed-letter-into-the-soap-and-slides-away-across-wet-green-tiles-when-sent",
  category: "inputs",
  name: "Ray-Marched Rose Soap Bar Email Input That Stamps Each Typed Letter into the Soap and Slides Away Across Wet Green Tiles When Sent",
  keyword: "3d email input react webgl",
  title: "3D Soap Bar Email Input in WebGL (React, Tailwind) | We.Inc",
  description: "Free React email field whose typed letters are pressed into a bar of rose soap, traced in a WebGL shader on green tiles. Send it and the bar slides away.",
  intro: "An email sign-up where the address is an object. A fragment shader photographs a freshly rinsed bar of coral soap lying on hand-made green tiles beneath a window, and whatever sits in the text field is pressed into the top of the bar in condensed capitals: the name on one line, the @ and the domain on the next. Each keystroke sinks one letter with a small overshoot and a raised lip of displaced soap, and backspace lets the last one close over. Sun comes over the sill behind, so the far edges of the bar glow where it is thin and the letters hold red light in their shadows. A patchy film of water on the top mirrors the casement and its glazing bars, a few beads have not run off, and puddles on the floor do the same with a bright curled edge. Pressing return draws the bar back a little, then flicks it away, leaving a film of water with soap bubbles along its edges that thins as it dries, while a blank bar glides in from the near corner and settles. The headline, the labelled field and the button are ordinary HTML over the picture. On phones the camera pulls back and climbs so the whole bar fits the width, and the type and the field sit underneath it.",
  useWhen: [
    "A skincare, bath or homeware shop wants its newsletter sign-up to be the most memorable thing on the page.",
    "A waiting list has a single field and you would like filling it in to feel like making something.",
    "A footer or closing section on a dark green or jewel-toned site needs one strong picture and one action.",
    "You are showing clients that a short fragment shader can carry live text, not only a fixed model.",
  ],
  customize: [
    "`START` is the address stamped into the bar on load and `DEMO` lists the ones the idle loop types. Set `DEMO` to an empty array and the first bar stays where it is until someone types.",
    "`SOAP` is the surface colour of the bar and `SIG` is how fast red, green and blue die out inside it. `SOAP = vec3(0.92, 0.86, 0.7)` with `SIG = vec3(0.8, 1.4, 3.6)` gives an olive oil bar, and `vec3(0.55, 0.62, 0.9)` with `vec3(4.2, 2.6, 0.7)` a lavender one.",
    "`GLAZE` is the tile colour. The wall, the reflections and the light bounced onto the underside of the bar are all derived from it, so one value retiles the room.",
    "`STAMP_SIZE` is the letter height in the 1024 pixel stamp and `STAMP_SQUEEZE` is how condensed the capitals are. Lines that run past `STAMP_WIDTH` are shrunk to fit, and `MAX_CHARS` caps the field.",
    "Depth of the impression is `DEPTH` in the shader, the lip beside it is `LIP`, and the overshoot comes from the `700` and `23` in the frame loop. Raise the 23 to 55 for a slow, dead press.",
    "`copy` holds both headlines and the three status sentences. The departure speed is `s.vx = 15` and the spin is `s.vyaw = 1.5`. For a dry scene, return `-1.0` from `water()` and pass a chance of `0.0` to both `beads()` calls.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology and takes no keyboard focus. Clicking it only moves focus to the real `input type=\"email\"`, which has a visible `label` and a described-by link to the status line.",
    "The status line is a polite live region. It reports the reason when an address is refused and confirms what happened after sending, so nothing is conveyed by the animation alone.",
    "Return in the field and the Send it off button both submit the same `form`. The form has `noValidate` so the message comes from the component, and focus goes back to the field after a refusal.",
    "With reduced motion the idle demo never runs, the sun stops drifting, letters appear at full depth at once and sending simply clears the bar. Text over the picture is cream on deep green, well above 4.5 to 1.",
  ],
  faqs: [
    {
      question: "How does typed text end up as geometry inside a shader?",
      answer: "The text is drawn to an offscreen 2D canvas with the same layout rules a signwriter would use, then an exact distance transform turns the black and white picture into a field that knows how far every pixel is from the nearest letter edge. That field is uploaded as a texture. The ray marcher subtracts a smooth function of it from the top of the bar, so the letters have sloped walls, flat floors and a soft rim without any mesh.",
    },
    {
      question: "How can one letter move while the others stay still?",
      answer: "The green channel of the stamp texture records which character owns each patch of the bar. A second texture, thirty-two pixels wide, holds the current depth of every character and is rewritten each frame from a small spring per letter. The shader multiplies the impression by the depth it looks up, so pressing or healing one letter costs one byte.",
    },
    {
      question: "What makes it read as soap and not pink plastic?",
      answer: "Three things are added to ordinary shading. Light is wrapped past the shadow line and turned redder there. For every point the shader measures how much soap lies between it and the sun and lets that much light through, which is why the far rim glows. And the reflection of the window is kept broad and dull on the dry skin, tighter on the floors of the letters where the die has polished the surface, and mirror sharp where water lies on it.",
    },
    {
      question: "How are the puddles and water beads drawn?",
      answer: "Neither is geometry. A noise field decides where water lies on the floor, with a ring added round the foot of the bar and a strip behind a bar that has just left. Inside it the tile normal is replaced by a flat one, so the reflection turns crisp, and the slope of the field tilts the normal at the rim to catch the sun. Beads are placed one to a grid cell at random and bend the normal like a small dome, dark toward the sun and bright on the far side.",
    },
    {
      question: "Does the form send the address anywhere?",
      answer: "No. `submit` calls `preventDefault`, checks the shape of the address, plays the departure and empties the field. To make it real, post `v` to your own endpoint in that function before `setValue(\"\")`, and show your server's answer in `setNote`.",
    },
    {
      question: "What happens on a machine without WebGL?",
      answer: "The `Still` component lays a tiled floor on a tilted CSS plane inside a pool of light, stacks thirty-four hard shadows to give a coral bar its thickness and presses the current value into it in capitals with two text shadows. It has no water and no motion. The field, the button and the status line work exactly the same, since they never depended on the canvas.",
    },
  ],
  related: ["ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper", "ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table", "paper-coffee-cup-name-field-where-a-marker-writes-what-you-type-round-the-cup"],
  tags: ["email input", "text field", "newsletter", "webgl", "ray marching", "shader", "subsurface scattering", "water", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
