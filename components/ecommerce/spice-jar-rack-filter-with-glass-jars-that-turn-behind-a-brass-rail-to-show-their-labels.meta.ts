const meta = {
  slug: "spice-jar-rack-filter-with-glass-jars-that-turn-behind-a-brass-rail-to-show-their-labels",
  category: "ecommerce",
  name: "Spice Jar Rack Filter with Glass Jars That Turn Behind a Brass Rail to Show Their Labels",
  keyword: "react filter chips component",
  title: "React Filter Chips as Glass Spice Jars | We.Inc",
  description: "Filter where each chip is a glass spice jar on a shelf: press a jar and it turns behind a brass rail so its label faces you. Free React and HTML to copy.",
  intro: "Six glass jars stand on an oak shelf behind a brass gallery rail, and each one is a filter chip. A jar that is switched off has its label turned to the wall, so all you see is paprika, peppercorns or salt crystals through the glass. Press it and the jar turns half a circle on a spring until the paper label faces the room, bending round the glass and darkening towards the edges the way a real wrapped label does. The ridges on the steel lid travel with it and a coloured dot stamped on the lid shows which side the label is on. Moving a pointer across a jar nudges it a few degrees. A caption under the shelf lists what is switched on and offers one button to turn every jar back. On screens narrower than 700 pixels the six jars split across two shelves of three.",
  useWhen: [
    "A recipe site or spice shop filters a product grid by ingredient and plain pills would waste the subject matter.",
    "A meal kit or grocery page asks what is already in the cupboard before it suggests a dish.",
    "A food blog wants a small set of tag filters that also works as the illustration at the top of the page.",
    "You have six or fewer options that are physical things with a colour and a texture of their own.",
  ],
  customize: [
    "`spices` is the list. Each entry has the spoken `name`, the short `label` printed on the paper, a `note` line, a `color` and a `kind` of `powder`, `balls`, `flakes` or `crystals`.",
    "`START` holds the indexes of the jars that face forward on load. Use `[]` to open with every label hidden.",
    "`TILT` is how far the viewer looks down on the shelf. `0.1` flattens the lids to thin slivers, `0.24` shows more of the tops.",
    "`FILL` is the empty glass above the spice in pixels. Raise it to 70 for jars that are running low.",
    "The two numbers in `70 * (...) - 10.5 * s.v[i]` are spring stiffness and damping. A damping of 16 removes the small overshoot when a jar stops.",
  ],
  accessibility: [
    "Every jar is covered by a real `button` with `aria-pressed` and the spice name as its label, inside a group named \"Filter by spice\".",
    "The caption is a polite live region, so the list of chosen spices is read out after each change.",
    "Nothing depends on hover: the pointer nudge is decoration and the label is fully shown by pressing or by Enter and Space.",
    "With reduced motion the jars jump straight to their final side and the self-running demonstration never starts.",
  ],
  faqs: [
    {
      question: "How does the label bend round the jar?",
      answer: "Each jar has a flat picture of its whole surface, as if the glass were slit and unrolled. Every frame the visible half is redrawn as thin vertical strips. A strip near the middle takes a wide slice of that picture and a strip near the side takes a narrow one, which is what squeezes the lettering as it goes round.",
    },
    {
      question: "How do I read which jars are selected?",
      answer: "The `picked` state is an array of true and false in the same order as `spices`. Filter your products with it directly, or lift it into a parent component and pass a change handler down in place of the local `toggle`.",
    },
    {
      question: "Can I use more than six jars?",
      answer: "Add entries to `spices` and extend the index lists in `layoutFor`, which place each jar by its number. Past eight the shelf gets crowded at desktop width, so add a second row in the wide layout the way the narrow one already does.",
    },
    {
      question: "Why does a jar always turn the same way?",
      answer: "Each press adds half a turn to the target angle and never subtracts. A lid that screws on has a direction, and a jar that reversed on alternate presses looked like a toggle graphic and not like an object being handled.",
    },
    {
      question: "Is it expensive to draw?",
      answer: "The wall, shelf, rail and glass shine are painted once into off-screen layers. Only the strips of the six jars are redrawn, and the loop stops completely once every spring has settled, so an untouched rack costs nothing.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "steel-safe-promo-code-reveal-with-a-combination-dial-you-turn-and-a-thick-door-that-swings-open", "thread-spool-rack-colour-filter-with-cross-wound-cotton-reels-that-pay-out-thread-and-drop-a-swinging-button"],
  tags: ["filter", "chips", "jar", "glass", "canvas", "kitchen", "skeuomorphic"],
  height: 680,
  interactive: true,
};

export default meta;
