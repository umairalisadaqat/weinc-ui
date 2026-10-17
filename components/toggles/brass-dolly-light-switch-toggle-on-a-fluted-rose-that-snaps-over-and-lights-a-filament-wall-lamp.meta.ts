const meta = {
  slug: "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp",
  category: "toggles",
  name: "Brass Dolly Light Switch Toggle on a Fluted Rose That Snaps Over and Lights a Filament Wall Lamp",
  keyword: "react light switch toggle",
  title: "React Light Switch Toggle with a Wall Lamp | We.Inc",
  description: "Toggle drawn on a canvas as a brass dolly switch that snaps over, bounces on its stop and lights a filament bulb. Copy the React code or HTML version free.",
  intro: "An on and off toggle made as the round brass switch from an old hallway, with the lamp it controls fixed to the wall next to it. Press the dolly and it is thrown across by a hard spring, hits its stop and gives one small bounce. The contact closes as it passes the middle, so the filament in the clear globe starts to glow at that instant and takes a moment to reach full brightness. Light then does what light does: a warm pool spreads over the green boards, every rib of the fluted rose picks up a highlight on the side facing the bulb, and the shadows of the switch and its dolly swing round to point away from it. Switch off and the room falls back to dim daylight from the upper left. The scene is a 340 pixel square on a phone and a 640 pixel square from tablet width.",
  useWhen: [
    "A dark mode or lights-out setting deserves more theatre than a sliding pill.",
    "A lighting shop, electrician or interiors site wants a hero that visitors cannot resist clicking.",
    "A smart home screen needs one large on and off control for a single room.",
    "You want to reveal something on the page only when a visitor turns the light on.",
  ],
  customize: [
    "`LABEL` names what is switched. It is the accessible name of the control and the first half of the caption.",
    "`SNAP` and `BOUNCE` set the feel of the dolly. 1150 and 0.34 give a firm click with one rebound. Use 500 and 0 for a soft modern rocker.",
    "`WARM_UP` and `COOL_DOWN` are the filament speeds. Raise both to 40 for an instant LED, or drop `WARM_UP` to 3 for a slow carbon lamp.",
    "`FLUTES` is the number of ribs round the rose. 20 gives bold reeding, 48 a fine coin edge.",
    "The wall is `bg-[#12211b]` on the root, repeated in the `ring-offset` class of the button. The boards come from the repeating gradient beneath it, where 70px is the board width. Set `SELF_RUN` to false to stop the demo flicking itself.",
  ],
  accessibility: [
    "The control is a real `button` with `role=\"switch\"` and `aria-checked`, laid over the brass. Space and Enter both throw it.",
    "The caption under the scene is a polite live region that says the name of the lamp and whether it is on.",
    "The whole rose is the target, about 120 pixels across on a phone, so it is easy to hit with a thumb.",
    "Under reduced motion the dolly and the light change in one step, with no bounce and no self-running demo.",
  ],
  faqs: [
    {
      question: "What is a dolly switch?",
      answer: "It is the older style of light switch with a small rounded lever, the dolly, standing out of a domed cover. Inside, a spring holds the lever at one end or the other, which is why it cannot rest in the middle and why it makes a sharp click.",
    },
    {
      question: "How do the highlights know where the lamp is?",
      answer: "Every brass surface is shaded by a small function that takes the direction the surface faces and adds two lights: weak daylight from a fixed angle, and the bulb, scaled by how bright the filament currently is. The direction to the bulb is worked out from the coordinates of each part.",
    },
    {
      question: "Can I drag the dolly instead of clicking it?",
      answer: "Yes. Hold it and pull down or push up. It leans stiffly with your finger until it passes the centre, then the spring takes over and finishes the throw. A short tap flips it outright.",
    },
    {
      question: "Why is the wall glow a separate element and not on the canvas?",
      answer: "The pool of light needs to reach far beyond the drawing, right across a wide page. A single blurred circle in CSS does that for almost nothing, and the loop only writes its opacity. The canvas stays small and sharp.",
    },
    {
      question: "How do I use it as a real setting?",
      answer: "The `on` state is the value. Replace the `setOn` call inside `select` with your own handler, or lift the state to a parent, and pass your stored value in place of `START_ON`.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "posable-desk-lamp-on-a-jointed-arm-that-lights-a-still-life-and-throws-its-true-shadow-up-the-wall"],
  tags: ["light switch", "toggle", "brass", "lamp", "canvas", "skeuomorphic", "dark mode"],
  height: 720,
  interactive: true,
};

export default meta;
