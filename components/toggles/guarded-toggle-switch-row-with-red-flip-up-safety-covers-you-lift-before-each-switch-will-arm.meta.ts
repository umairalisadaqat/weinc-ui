const meta = {
  slug: "guarded-toggle-switch-row-with-red-flip-up-safety-covers-you-lift-before-each-switch-will-arm",
  category: "toggles",
  name: "Guarded Toggle Switch Row with Red Flip-Up Safety Covers You Lift Before Each Switch Will Arm",
  keyword: "safety toggle switch react",
  title: "React Safety Toggle Switches with Flip-Up Covers | We.Inc",
  description: "Toggle row styled as a cockpit panel: each switch sits under a red hinged cover you must lift first, so nothing arms by accident. Free React and HTML code.",
  intro: "Four bat-handle switches on a grey sprayed panel, each one under a red pressed-metal cover of the kind fitted over controls that must never be knocked by a sleeve. The cover is the confirmation step. One press swings it up on its hinge, where it bounces against the stop; a second press snaps the lever up and lights the legend above it; a third drops the lever and lets the cover slam shut. Leave a cover up without using the switch and its spring closes it again after a few seconds. The cover is drawn as a real channel turning in perspective, so you see its painted face when shut and look up into its shaded underside when open, with a shadow that slides across the panel as it moves. On phones the row becomes two rows of two.",
  useWhen: [
    "A settings page has a few actions that should take two deliberate steps, such as maintenance mode, wiping a cache or pausing billing.",
    "An admin screen for machines, drones or home automation wants controls that carry the same caution as the hardware.",
    "A launch or go-live checklist needs each item armed in turn before a final button unlocks.",
    "A game or simulator cockpit needs a believable overhead panel without loading a 3D engine.",
  ],
  customize: [
    "`switches` is the row. Each entry has the `label` painted under the switch, a `note` read out when it goes on, a `lamp` colour for its legend light and `on` for its starting position. Three or five entries re-space themselves.",
    "`GUARD` is the cover paint as three colours from lit to shade. `[\"#ffd84a\", \"#e0a800\", \"#6b4a00\"]` gives the yellow covers used on test equipment.",
    "`PANEL` is the three greys of the sprayed plate, top to bottom. Darken all three towards `#1c1d20` for a black panel and keep the white legends.",
    "`RELAX` is how long, in milliseconds, a lifted cover waits before closing itself. Set it very high if you would prefer covers to stay where they are put.",
    "`OPEN` is the angle the cover reaches. The bounce at each stop comes from `0.38` and `0.3` in the frame loop; lower them for a heavier, deader hinge.",
  ],
  accessibility: [
    "Each drawn switch has a real `button` with `role=\"switch\"` over it, named after its label, with `aria-checked` following the lever and not the cover.",
    "A hidden description explains the three presses, and a polite live region confirms every step in words: cover lifted, on, or off and shut.",
    "Space and Enter take the next step and Escape shuts the cover from any state, so a keyboard user can always back out without switching anything on.",
    "Under reduced motion the cover and lever are drawn straight in their new positions and the self-playing sequence does not run.",
  ],
  faqs: [
    {
      question: "Why make people press twice to turn something on?",
      answer: "For the same reason the hardware exists. A plain switch is fine for dark mode, but for an action that is costly to undo, a cheap first step that changes nothing gives people a moment to notice they are on the wrong control. It is quicker than a confirmation dialog and does not take over the screen.",
    },
    {
      question: "How is the cover drawn in 3D without a 3D library?",
      answer: "The cover is eight corner points of a channel. Each frame they are rotated about the hinge line by the current angle, then divided by their distance from an eye point 560 pixels in front of the panel. The plate and two side walls are filled as plain polygons, drawn in a different order depending on whether you are looking at the outside or the inside.",
    },
    {
      question: "Can I close the cover while the switch is on?",
      answer: "No, and that is deliberate. On the real part the cover is shaped so that shutting it pushes the lever to off. Here a third press, a click on the raised cover or the Escape key all switch off and shut the cover as one action.",
    },
    {
      question: "How do I react when a switch changes?",
      answer: "Every change goes through the `act` function, which updates the `state` array of `{ up, on }` objects. Call your own handler at the end of `act` with the index and the new `on` value, or lift `state` into the parent.",
    },
    {
      question: "Does the click target match what I see?",
      answer: "Each button covers the whole unit, from the legend light down to the label, so it is well over 44 pixels in both directions on a phone. With a mouse, a click on the upper part of a raised cover is treated as pushing it down, which is what a hand would do.",
    },
  ],
  related: ["open-gate-manual-gear-lever-selector-with-a-chrome-h-pattern-plate-and-a-ball-knob-you-drag-through-the-slots", "hotel-keycard-door-lock-switch-with-a-card-that-dips-into-the-reader-a-lamp-that-turns-green-and-a-lever-that-drops", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["toggle", "switch", "safety cover", "guard", "cockpit", "canvas", "confirm", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
