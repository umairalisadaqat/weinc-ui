const meta = {
  slug: "magnetic-fridge-letters-you-can-drag-across-enamel-that-slide-back-to-spell-the-word",
  category: "text-effects",
  name: "Magnetic Fridge Letters You Can Drag Across Enamel That Slide Back to Spell the Word",
  keyword: "draggable letters react",
  title: "React Draggable Letters: Fridge Magnet Word | We.Inc",
  description: "Text effect with a word in plastic fridge magnets on an enamel door: drag a letter away and it skids, waits, then slides home. Free React and HTML code.",
  intro: "A word spelled in the coloured plastic alphabet magnets found on family fridges, stuck to a pale enamel door with the freezer gap above and a steel handle at the side. Every letter is moulded when the page loads: the glyph is fattened, given a rounded shoulder and a slight dome, lit from the top left so the bevel carries a hard gloss, and backed by a darker side wall so it has thickness. Pick a letter up and it lifts, throws a longer shadow and leans the way you pull it. Let go and it skids to a stop, sits for a moment, then springs back into the word. Left alone, one letter at a time gets nudged out of line. On a narrow phone a long word breaks into two rows so the magnets stay big enough to grab.",
  useWhen: [
    "A family, food or parenting brand wants its name as a toy on the first screen and has no photograph to lead with.",
    "A recipe site or meal planner needs a weekday or dish name that visitors can fidget with while they read.",
    "A nursery, tutor or children's club page should feel hand made without using a cartoon font.",
    "An empty state or a missing page needs one word and something to do with your hands.",
  ],
  customize: [
    "`START_WORD` is the word on load and `MAX_LETTERS` caps what the field accepts. Past eight letters the magnets get small on phones.",
    "`COLOURS` is the plastic palette, applied in order. Use one hex value for a single colour set, or two for alternating letters.",
    "`DOOR` is the enamel. It is also the ring offset colour on the focus styles, so change `ring-offset-[#edf0ea]` to match.",
    "`HOLD` is how many seconds a dropped letter rests before it goes home. Set it to 30 if you want visitors to rearrange the word and leave it.",
    "The spring that pulls a letter back is the pair `95` and `13` in the loop. Lower the second number to 7 for a looser, wobblier return.",
  ],
  accessibility: [
    "The word is a real `h2` that updates as you type, so screen readers and search read the text and never the drawings.",
    "Each magnet is a button with a label that names its letter and position. Arrow keys slide it in steps and Enter flicks it off line.",
    "With reduced motion nothing moves by itself, thrown letters do not skid, and a dropped letter returns in one step with no spring.",
  ],
  faqs: [
    {
      question: "Are the letters images?",
      answer: "No. Each one is drawn in the browser from the glyph of a system font. The outline is blurred into a height, that height is shaded once per pixel as glossy plastic, and the result is kept in a small canvas that is then only moved with a transform.",
    },
    {
      question: "Why do the magnets look rounded when my font is not?",
      answer: "Before shading, the glyph is stroked with a thick round-joined line as well as filled. That swells any heavy sans into the soft, moulded shape of a toy letter. The `face` string inside `mould` lists the fonts tried, starting with a rounded one.",
    },
    {
      question: "Can visitors rearrange the letters into another word and keep it?",
      answer: "As written every letter goes home after `HOLD` seconds. Raise that constant and the magnets stay where they are dropped until the Knock them off button is pressed or the word is retyped.",
    },
    {
      question: "Does dragging work on touch screens?",
      answer: "Yes. The magnets use pointer events with capture, and only the magnets block touch scrolling. A finger on the bare door still scrolls the page.",
    },
    {
      question: "What happens when the word changes?",
      answer: "The old set is removed, the new letters are moulded, and they arrive from above the door one after another and settle into place. Moulding takes a few milliseconds per letter and only happens then.",
    },
  ],
  related: ["silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio", "layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters"],
  tags: ["magnets", "fridge", "letters", "drag", "physics", "canvas", "plastic"],
  height: 680,
  interactive: true,
};

export default meta;
