const meta = {
  slug: "yellow-umbrella-toggle-switch-that-springs-open-on-its-ribs-and-sheds-rain-off-the-canopy",
  category: "toggles",
  name: "Yellow Umbrella Toggle Switch That Springs Open on Its Ribs and Sheds Rain off the Canopy",
  keyword: "react umbrella toggle animation",
  title: "React Umbrella Toggle Animation with Rain | We.Inc",
  description: "Toggle drawn on a canvas as a yellow umbrella: ribs push the cloth open, rain bounces off the canopy and drips from the rib tips. Free React and HTML code.",
  intro: "An on and off switch that is a whole umbrella standing in the rain. Press it and the brass runner slides up the steel shaft, eight stretchers push eight ribs outward and the yellow cloth snaps taut with a small overshoot. Press again and the ribs fold down while the loose cloth wraps round the shaft. The umbrella is a real three dimensional model seen from a little below, so you look up at the lining, the ribs and the stretchers through the open hem. Rain is worked out against the outline of the cloth: drops that hit it break into beads, the water runs to the nearest rib tip and falls from there as heavier drips, and the ground under an open canopy stays free of rings. Moving the pointer left or right changes the wind, which slants the rain and leans the umbrella into it. On a phone the drawing scales down to the width of the screen and the whole umbrella is the tap target.",
  useWhen: [
    "A settings screen has one protective option, such as quiet hours, do not disturb, away mode or a spam shield, and it deserves a picture of what it does.",
    "A weather, travel or outdoor brand wants a hero object that visitors can open and close while the page loads around it.",
    "An insurance or cover product needs a plain metaphor for being covered that does not rely on a shield icon.",
    "A maintenance or pause page wants one calm thing to watch and one thing to press.",
  ],
  customize: [
    "`CANOPY` and `LINING` are the red, green and blue values of the cloth outside and underneath. `[196, 44, 40]` with `[120, 30, 26]` gives a red umbrella.",
    "`RIBS` sets how many panels the canopy has. Ten or twelve makes a rounder, more formal umbrella and needs no other change.",
    "`RAIN` is the number of drops in the air. Lower it to 80 for drizzle, raise it to 260 for a downpour.",
    "Set `DEMO` to `false` to stop the umbrella furling and reopening by itself before anyone has touched it.",
    "The snap is the `165` (pull) and `14.5` (drag while opening) in the `step` function. Raise the second number to 24 and the cloth opens without the overshoot.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The control is one `button` with `role=\"switch\"`, `aria-checked` and the name held in `setting.name`.",
    "Space and Enter both flip it, and a yellow focus ring is drawn round the umbrella when it is reached by keyboard.",
    "The state is repeated as text under the drawing, so nobody has to judge open or furled from the picture alone.",
    "With reduced motion the rain is drawn once as a still frame and the umbrella changes straight from furled to open with no spring and no automatic demo.",
  ],
  faqs: [
    {
      question: "How does the rain know where the umbrella is?",
      answer: "Every frame the cloth is built as nearly six hundred small flat panels and projected to the screen. While that happens, the highest point of the cloth is recorded for every second pixel column. A drop that crosses that line is removed and replaced by two beads thrown off along the slope of the cloth at that spot.",
    },
    {
      question: "Why does the cloth fold instead of shrinking when it closes?",
      answer: "Each panel has a fixed width, taken from the fully open umbrella. As the ribs come together the gap between them gets narrower than the cloth, and the spare width is pushed outward and sideways along the middle of the panel. That is what gives the furled state its pleats.",
    },
    {
      question: "Can I use it as a controlled switch in a form?",
      answer: "Yes. The `on` state is an ordinary boolean. Lift it to a parent, pass it down with a change handler, and set `live.current.on` whenever the prop changes so the drawing follows.",
    },
    {
      question: "Is this WebGL?",
      answer: "No. It is a 2D canvas. The three dimensional part is a few lines of trigonometry that place each rib, tilt the view by eleven degrees and sort the panels from back to front before they are filled.",
    },
    {
      question: "Does it keep running when it is off screen?",
      answer: "The animation loop stops when the canvas leaves the viewport or the tab is hidden, and starts again when it comes back. Nothing is drawn in between.",
    },
  ],
  related: ["brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["umbrella", "toggle", "switch", "rain", "canvas", "weather", "3d"],
  height: 740,
  interactive: true,
};

export default meta;
