const meta = {
  slug: "ink-drop-progress-indicator-that-blooms-through-a-glass-of-water-one-drop-per-step",
  category: "feedback",
  name: "Ink Drop Progress Indicator That Blooms Through a Glass of Water, One Drop per Step",
  keyword: "react progress indicator animation",
  title: "React Progress Indicator: Ink Drops in Water | We.Inc",
  description: "Progress indicator on a canvas: a dropper lets ink fall into a glass of water, each drop blooms and the water darkens per step. Free React and HTML code.",
  intro: "Progress shown as something you have watched happen in a real glass. A tumbler of clear water stands on a pale grey stage with a glass dropper above it. Every fifth of the job, one drop of blue ink falls, lands with a ring on the surface, rolls into a mushroom and splits into thinner branches that trail to the floor of the glass. The older ink spreads and the water takes on colour, so the depth of blue is the reading and the number under the glass confirms it. At 100% the label changes, the water is swapped for clean and the demo begins again. Drag a pointer or a finger through the water to stir it, or press the glass to add a drop early. The whole drawing scales down as one picture on a phone.",
  useWhen: [
    "A multi-step job such as an upload, an import or a checkout has a handful of clear stages and each one deserves a small event.",
    "A print shop, stationery brand or studio site wants its wait screen to belong to the craft.",
    "An onboarding flow needs a calm indicator that people enjoy watching for ten seconds.",
    "A page for a science lesson or a product demo needs a self-running picture of diffusion without a video.",
  ],
  customize: [
    "`INK` is the dye. `#b3122d` gives a red that reads well in clear water and `#0d6b4f` a bottle green. The tint of the water, the foot of the glass and the light on the table all follow it.",
    "`STEPS` is how many drops make 100%. With 4 each drop is worth a quarter, with 10 the drops are smaller steps and arrive more often if you shorten `EVERY`.",
    "`VALUE` is `null` for the demo. Give it a number from 0 to 1 and the dropper releases drops until the count matches it.",
    "`TASK` and `DONE` are the two labels under the glass.",
    "Inside `land`, the `1900` is the strength of the sinking vortex. 2800 throws the ink to the floor quickly, 900 leaves it hanging near the surface.",
  ],
  accessibility: [
    "The text under the glass is a `progressbar` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, labelled with the task, and the canvas is hidden from screen readers.",
    "The glass is a button whose name changes from adding a drop to starting again, so the action is available from the keyboard with Enter or Space.",
    "Stirring is an extra for pointer users and carries no information. The percentage is always in text.",
    "With reduced motion nothing animates: the glass is drawn once with all the ink already settled and the label at 100%.",
  ],
  faqs: [
    {
      question: "How does the ink get its mushroom and branch shapes?",
      answer: "Each drop is 380 points plus one pair of opposite vortices that sinks and drags the points round itself, which is how a real drop forms a ring. After about two thirds of a second the pair breaks into two weaker pairs heading slightly apart, and those split again. Every point also sinks at its own slow rate, which pulls the cloud out into hanging threads.",
    },
    {
      question: "Is this a fluid simulation, and will it slow the page?",
      answer: "No grid is solved. At most 1,900 points are moved by a few dozen vortices and stamped as soft dots into a canvas smaller than the visible one, which is then scaled up. The loop pauses when the component leaves the screen or the tab is hidden.",
    },
    {
      question: "How do I drive it from a real upload?",
      answer: "Replace the `VALUE` constant with a prop holding your fraction. The component compares the number of drops that have landed with `VALUE * STEPS` and releases another whenever it is behind, and the printed percentage eases toward the same number.",
    },
    {
      question: "Why does the first frame already show ink in the water?",
      answer: "Before the first paint the simulation is run forward for two drops, so a visitor never looks at a plain glass while waiting for something to happen. Remove the two `warm` calls for the demo if you want it to open on clear water.",
    },
    {
      question: "Can the dropper be removed?",
      answer: "Yes. Delete the last block of `draw`, the one that begins with the dropper comment. Drops will then fall from above the picture. You can also lower `TOP` to make room for a taller glass.",
    },
  ],
  related: ["nitro-cold-brew-tumbler-loader-that-pours-cascades-and-settles-under-a-cream-head", "kitchen-order-rail-notifications-with-printed-paper-tickets-that-slide-under-a-steel-rail-swing-and-pull-off", "restaurant-pager-puck-alert-that-buzzes-across-a-black-table-with-chasing-red-lights-and-a-dot-matrix-message"],
  tags: ["progress", "ink", "water", "glass", "canvas", "fluid", "skeuomorphic"],
  height: 760,
  interactive: true,
};

export default meta;
