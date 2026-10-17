const meta = {
  slug: "porcelain-wall-light-switch-settings-list-with-three-bakelite-dollies-that-snap-over-and-throw-lamp-light-up-a-sunlit-wall",
  category: "toggles",
  name: "Porcelain Wall Light Switch Settings List with Three Bakelite Dollies That Snap Over and Throw Lamp Light Up a Sunlit Wall",
  keyword: "react settings toggle list webgl",
  title: "Porcelain Wall Switch Settings Toggles (React, WebGL) | We.Inc",
  description: "Free React settings list of three switches, drawn as porcelain wall switches in WebGL. Each dolly snaps over and a lamp's cone of light climbs the wall.",
  intro: "A settings list where every row has a real switch on the wall behind it. A fragment shader ray-marches a painted sage board screwed to a limewashed wall, carrying three glazed porcelain bases with dark bakelite dollies and signwritten names under each. Late sun comes through a window on the left, so the glazing bars, a curtain edge and the long shadows of the dollies lie across the plaster. Below the frame stand three lampshades. Flip a switch and its dolly is thrown over centre by its spring, knocks against the porcelain and kicks back, and a moment later that lamp warms up through orange and lays a cone of light up the wall, with the board's own shadow cut out of it. On the left sit a large serif heading, a line that says how many lamps are lit, and a list of three labelled switch buttons that drive the same state. On phones the wall sits on top and the list follows, and a tap on any dolly in the picture works too.",
  useWhen: [
    "A smart home or lighting app wants its settings screen to feel like the house rather than a form.",
    "You need a short group of on and off preferences and want the group itself to be the striking thing on the page.",
    "A warm, sunlit page needs a 3D piece that is not chrome on black.",
    "A team wants a working example of several independent controls driving one ray-marched scene without a 3D library.",
  ],
  customize: [
    "Edit the `switches` array to rename the rows. `label` and `note` appear in the list, `mark` is painted on the board under that dolly, and `start` sets whether it opens lit.",
    "`PLATE`, `WALL` and `BAKELITE` are the paint, the limewash and the dolly colour in linear RGB. Try `[0.36, 0.08, 0.05]` for an oxblood board, and match the section class `bg-[#e6d3bd]` to the wall by eye.",
    "`LAMP_SPREAD` is the cosine of each lampshade's cone. Raise it toward `0.9` for tall narrow beams, lower it to `0.75` for wide pools that merge.",
    "`THROW` is how far each dolly leans. The end stop, the point where the contacts close and the click target all follow it.",
    "The snap lives in the frame loop: `300` is the spring, `11` the damping and `-0.32` the kick back off the porcelain. Set the kick to 0 for a switch that lands dead.",
  ],
  accessibility: [
    "Each row is a `button` with `role=\"switch\"`, `aria-checked` and its visible name, so Tab reaches all three and Space or Enter flips one. The drawn wall is hidden from assistive technology.",
    "A polite live region states how many lamps are lit, so a press on the picture is announced as well as a press in the list.",
    "State never rests on colour alone: each row prints On or Off, its thumb moves, and the dolly in the scene points up or down.",
    "With reduced motion the curtain stops drifting, no demo runs and each dolly jumps to its position with its lamp already at full strength. The frame refines over a few passes and then drawing stops.",
  ],
  faqs: [
    {
      question: "Where do the cones of light on the wall come from?",
      answer: "Each switch owns a point light standing below the frame and a little out from the wall. A point on the wall receives it only inside an upward cone, with a soft rim where a lampshade's edge would be, and the light falls off with distance. A shadow ray toward the lamp lets the board, the bases and the dollies cut their own silhouettes out of the pool.",
    },
    {
      question: "Why does the dolly bounce when it lands?",
      answer: "Every dolly is a small spring system stepped four times per frame. When its angle reaches the stop it is clamped and its speed is reversed at about a third, so it knocks back and settles. Part of that impact goes into a tiny camera jolt, which is what makes the switch read as heavy.",
    },
    {
      question: "How is the window light made?",
      answer: "The sun is a directional light from the upper left. Before it lights a point, the point is projected onto a plane across the sun and tested against a window shape with two glazing bars and a soft curtain edge, so the pattern lands on the wall, the board and the porcelain at the right slant. A soft shadow march gives the dollies their long shadows.",
    },
    {
      question: "Does it keep animating when nobody is using it?",
      answer: "It opens with all three lamps lit and holds that view, then works the switches one at a time until a visitor presses one. The window light drifts very slightly the whole time. Drawing stops when the section leaves the screen or the tab is hidden, and a still frame keeps refining when nothing moves.",
    },
    {
      question: "What appears without WebGL?",
      answer: "A still built from CSS: a sage board with three white bases, dark dollies pointing the right way and a warm glow above each lit one. The list of switches, the heading and the announcement do not need the canvas at all.",
    },
    {
      question: "How do I wire the rows to real settings?",
      answer: "The `on` state is an array of three booleans. Lift it into a parent and call your own save function inside `toggle`. If a value changes elsewhere, call `api.current.set(index, value, false)` so the dolly follows it without stopping the demo.",
    },
  ],
  related: [
    "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp",
    "ray-marched-tangerine-resin-rocker-switch-with-a-lamp-inside-that-glows-through-the-plastic-and-spills-across-a-lilac-table",
    "guarded-toggle-switch-row-with-red-flip-up-safety-covers-you-lift-before-each-switch-will-arm",
  ],
  tags: ["toggle", "switch", "settings", "webgl", "ray marching", "shader", "light switch", "skeuomorphic"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
