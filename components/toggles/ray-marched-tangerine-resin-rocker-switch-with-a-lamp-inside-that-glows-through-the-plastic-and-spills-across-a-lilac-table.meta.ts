const meta = {
  slug: "ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table",
  category: "toggles",
  name: "Ray-Marched Tangerine Resin Rocker Switch with a Lamp Inside That Glows Through the Plastic and Spills Across a Lilac Table",
  keyword: "3d toggle switch react webgl",
  title: "3D Resin Rocker Toggle Switch (React, WebGL) | We.Inc",
  description: "Free React on/off toggle drawn as a translucent orange rocker in a WebGL shader. A lamp inside lights the resin and the table, with a real switch button beneath.",
  intro: "An on/off switch you would want to press twice. A fragment shader ray-marches a chunky rocker moulded in cloudy tangerine resin, seated in a white porcelain housing with a brass screw and pressed maker's marks, on a lilac painted table crossed by window light, and photographs it through a long lens from above its near corner. Light is followed into the plastic: each ray bends at the skin, loses blue and green to the dye as it travels, and picks up whatever the resin scatters toward the eye, so thin edges read pale apricot and the thick middle goes deep. Switch it on and a small lamp under the pivot strikes, stutters once and settles. Its glow fills the block, leaks through the gap around the rocker, tints the porcelain and lays a pink pool on the table while the daylight eases down to dusk. The word beside it is set very large in a serif, with a labelled switch button that drives the same state. On phones the object sits above the type and a tap anywhere on it works the rocker.",
  useWhen: [
    "A smart home, lighting or hardware landing page wants its first screen to be one thing a visitor can operate rather than read about.",
    "A single important setting, such as going live, do not disturb or a maintenance mode, should feel like a decision and not a checkbox.",
    "You are building a bright, colourful page and every 3D showpiece you have found is chrome on black.",
    "A studio wants to show that it can write a renderer in a fragment shader without shipping a 3D library.",
  ],
  customize: [
    "`RESIN` is how much red, green and blue one unit of plastic absorbs. `[2.6, 0.5, 0.12]` gives a sea-glass blue and `[0.2, 2.4, 0.5]` a raspberry pink.",
    "`TABLE` is the paint colour of the surface in linear RGB. The room walls borrow it, so the reflections follow. Match the section background `bg-[#aeb2e8]` to it by eye.",
    "`DUSK` is how far the daylight drops while the lamp is lit. Set it to 0 and the room stays as bright as it was. `MARKS` is the lettering pressed into the plate.",
    "`LAMP` is the colour of the lamp inside. Keep it warmer than the resin for a filament look, or set it to `[0.7, 0.9, 1]` under blue resin.",
    "`TILT` is the angle the rocker leans in radians. The end stop, the contact point and the legends all follow it.",
    "`copy` holds the big word and the sentence for each position, and `LABEL` names the real switch.",
    "The snap is `stiff = 420`, `damp = 13` and the `-0.3` bounce at the end stop. Use `damp = 60` and a bounce of 0 for a soft-touch switch that lands without a kick.",
  ],
  accessibility: [
    "The canvas and its click target are hidden from assistive technology. The control is a `button` with `role=\"switch\"`, `aria-checked` and a visible text label, and Space or Enter flips it.",
    "The large word and its sentence live in a polite live region, so pressing the drawn rocker is announced as well.",
    "State is never carried by colour alone: the word changes, the thumb of the small switch moves, and the rocker itself leans the other way.",
    "With reduced motion the softbox stops drifting, the self-running demo never starts and the rocker jumps to its position with the lamp already settled. A few passes clean up the frame and then drawing stops.",
  ],
  faqs: [
    {
      question: "How does the plastic look translucent instead of just orange?",
      answer: "The ray does not stop at the surface. It is refracted into the block and stepped through it up to forty-four times. At every step the shader adds the light the cloudy resin would scatter back, which is studio light fading with depth below the skin plus lamplight falling off from the capsule, and multiplies what is behind by an absorption that is weak for red and strong for blue. Whatever the ray finally reaches, the white tray under the rocker or the porcelain on the far side, is seen through all of that.",
    },
    {
      question: "Where does the peach light on the table come from?",
      answer: "Two emitters ride inside the rocker, one in each half, and their strength follows the lamp. Every point on the housing and the table adds their contribution with distance falloff and the angle to the surface. The walls of the well take the lamp directly, which is why the seam around the rocker turns from a dark gap to a bright line.",
    },
    {
      question: "Why does the shadow under the rocker look orange?",
      answer: "The softbox shadow is computed twice, once against the porcelain and once against the resin alone. Porcelain blocks the light. Resin only filters it, so where the rocker stands between the softbox and a surface the light arrives tinted, as it does under a real piece of coloured acrylic.",
    },
    {
      question: "Does it keep running when nobody is touching it?",
      answer: "Until the first press it works itself: it opens lit, holds, then switches off and on at an unhurried pace while the main softbox drifts so the highlight on the top face keeps moving. After a visitor presses it, only they change it. Drawing pauses when the section scrolls out of view or the tab is hidden.",
    },
    {
      question: "What do people see without WebGL?",
      answer: "A still of the same switch stacked from rounded CSS boxes in a three-quarter pose, with a patch of window light behind it, the rocker leaning the right way and a glow under it when lit. The switch button, the big word and the announcement do not depend on the canvas.",
    },
    {
      question: "How do I connect it to a real setting?",
      answer: "The `on` state is a boolean. Lift it into a parent and pass a callback, or call your own function inside `toggle`. If the setting can also change from elsewhere, call `api.current.set(value, false)` so the rocker follows without stopping the idle demo.",
    },
  ],
  related: ["ray-marched-knurled-aluminium-dial-on-black-glass-with-a-moving-softbox-engraved-stops-and-an-amber-halo", "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp", "chrome-stomp-footswitch-toggle-with-jewel-lamp-on-a-powder-coated-pedal"],
  tags: ["toggle", "switch", "rocker", "webgl", "ray marching", "shader", "translucent", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
