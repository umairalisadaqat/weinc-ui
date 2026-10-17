const meta = {
  slug: "open-gate-manual-gear-lever-selector-with-a-chrome-h-pattern-plate-and-a-ball-knob-you-drag-through-the-slots",
  category: "toggles",
  name: "Open-Gate Manual Gear Lever Selector with a Chrome H-Pattern Plate and a Ball Knob You Drag Through the Slots",
  keyword: "gear shifter selector react",
  title: "React Gear Shifter Selector with an H Gate | We.Inc",
  description: "Selector drawn as an open-gate gear lever: drag the ball knob through an H pattern set in stitched leather to pick an option. Free React and HTML code.",
  intro: "An eight-way selector shaped like the exposed gear gate of an old sports car. A polished steel plate sits in a pad of tan leather with a saddle-stitched seam, and a slotted H pattern is cut through it: reverse on a dog-leg at the top left, six forward gears in three slots, neutral in the cross channel. The lever cannot cut corners. Drag the ball knob and it only goes where the steel lets it, so moving from second to third means up to the channel, across, and up again. Let go halfway down a slot and it falls into that gear; let go in the channel and it centres itself in neutral. The numeral of the engaged gear lights from behind, and a line under the pad names the choice. On a phone the pad is 340 pixels wide and the knob is still a comfortable thumb target.",
  useWhen: [
    "A car hire, driving school or track day site wants one playful control near the top of the page that visitors cannot resist trying.",
    "A settings screen has a handful of ordered levels, such as playback speed or difficulty, and a row of plain radio buttons would feel flat.",
    "A game menu needs a mode picker that looks like part of the cockpit instead of a list.",
    "A product story about engineering or craft needs a tactile object to sit beside a short paragraph.",
  ],
  customize: [
    "`gears` is the option list. Each entry has an `id` that is engraved on the plate, a `name` and `note` for the caption, a `col` for its slot and a `row` of -1 or 1 for the top or bottom of that slot. Remove the reverse entry and the dog-leg disappears with it.",
    "`COLS` sets where the slots sit across the plate and `THROW` how long they are. Three values in `COLS` give a four-speed gate.",
    "`LEATHER` is three colours for the hide, from highlight to shade. `[\"#3a3b3f\", \"#232427\", \"#101113\"]` turns it into black leather, and the knob picks up the new colour in its reflection.",
    "`LAMP` colours the lit numeral and the keyboard focus ring. Try `#e8f0ff` for a cold white instrument light.",
    "Lever weight lives in the frame loop: the `9` in `Math.exp(-dt * 9)` is how eagerly it finishes a shift, and `420` with `24` are the stiffness and damping of the knob lagging behind the shaft.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. Underneath is a `radiogroup` called Gear with one `role=\"radio\"` button per option, each named in full, such as Third or Reverse.",
    "One radio is in the tab order at a time. Arrow keys step through the options and wrap, Home and End jump to reverse and sixth, and the lever makes the same journey through the gate that a drag would.",
    "A focus ring is drawn on the plate at the end of the focused slot, so sighted keyboard users can see where they are.",
    "Reduced motion skips the travel and the self-running demo: the lever is simply shown in the chosen gear.",
  ],
  faqs: [
    {
      question: "How does the lever stay inside the slots while I drag it?",
      answer: "The pointer position is first snapped to the nearest spot on the gate, which is one horizontal line plus a vertical line per gear. The lever then walks towards that spot along the gate instead of straight at it: down to the channel if it has to change slots, across, then up or down. That is why a fast diagonal drag still draws a clean H.",
    },
    {
      question: "Why is there a neutral option?",
      answer: "It gives the control an honest resting place and a way to choose nothing. If your setting must always have a value, delete the neutral entry from `gears` and change the release rule so the lever returns to the last engaged gear.",
    },
    {
      question: "Can I use it for something other than gears?",
      answer: "Yes. The engraved `id` can be any one or two characters, so S, M, L and XL on two slots works, as do numbers for quality levels. Keep labels short because they are cut into the plate at a fixed size.",
    },
    {
      question: "How do I get the selected value out?",
      answer: "The `gear` state holds the index of the engaged entry in `gears`. Pass a callback into the component and call it where `setGear` is called, or read `gears[gear].id` in the parent once you lift the state.",
    },
    {
      question: "Is the leather an image?",
      answer: "No. The grain is a few thousand small arcs drawn once with a seeded random generator, and each stitch is three short strokes: a shadow, the thread and a highlight. The whole pad is cached on a second canvas, so each frame only redraws the lever, its shadow and the lit numeral.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "thumbwheel-number-picker-with-rolling-digit-drums-and-knurled-wheels"],
  tags: ["gear lever", "shifter", "selector", "radio group", "canvas", "leather", "chrome", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
