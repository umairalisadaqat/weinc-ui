const meta = {
  slug: "word-stamped-into-wet-concrete-that-cures-pale-takes-finger-marks-and-is-trowelled-smooth-for-a-new-word",
  category: "text-effects",
  name: "Word Stamped Into Wet Concrete That Cures Pale, Takes Finger Marks and Is Trowelled Smooth for a New Word",
  keyword: "debossed text effect canvas",
  title: "React Canvas Debossed Text Effect in Concrete | We.Inc",
  description: "Text effect with a word stamped into wet concrete: it cures pale, takes finger marks and can be trowelled smooth. Free React and HTML code.",
  intro: "A slab of fresh concrete inside four pine boards, seen from directly above, with one word pressed into it by hand stamps. The surface is a height map: float arcs, air holes, the sunken letters with the ridge of displaced mix round each one, and anything a visitor adds. It is lit from the top left and drawn twice, once dark and glossy as wet concrete and once pale and sandy as cured concrete. The pale picture closes in from the edges over about half a minute, the way a real pour dries. While the middle is still dark, dragging across the slab leaves a finger groove. Change the word, or press Pour again, and a steel float crosses the slab, wiping it flat, before wooden blocks press the new letters in one at a time. On a phone the slab is taller and a long word is stamped on two lines.",
  useWhen: [
    "A builder, landscaper or concrete contractor wants the company name set in the material it works with.",
    "A founding date, a place name or a single promise should feel permanent on an about page.",
    "A portfolio site wants a signature panel visitors can leave a mark in before it sets.",
    "A coming soon page needs a slow change that rewards a second look, with the surface visibly drier after a minute.",
  ],
  customize: [
    "`START_WORD` is the opening word. Heavy capitals stamp cleanly; thin strokes vanish once the lighting is applied.",
    "`CURE_START` and `CURE_SECONDS` set how dry the slab is on load and how long it takes to set. Use `CURE_START = 1` for a slab that is already hard.",
    "`WET` and `DRY` are the two concrete colours as red, green, blue triples. `[150, 92, 70]` for `DRY` gives terracotta screed.",
    "Letter depth is the `-13 * u` term in `level`, and the ridge round each letter is the `2.4 * u` term next to it.",
    "The finger width is `10 * u` in `drag`. Set it to `3 * u` for a stick or a nail.",
  ],
  accessibility: [
    "The word is an `h2` in the markup and follows the text field, so nothing a reader or a crawler needs is locked inside the canvases.",
    "A polite live region under the slab says whether the concrete is being worked, still wet or cured.",
    "Drawing with a finger is decoration only. The word field and the Pour again button do everything from the keyboard.",
    "With reduced motion the slab is shown cured, a new word appears at once with no float or stamps, and the moving sheen is removed.",
  ],
  faqs: [
    {
      question: "How are the letters made to look pressed in and not printed on?",
      answer: "The text is drawn to a hidden canvas and blurred a little, which gives a soft-edged mask. Inside the mask the surface height drops, and a wider blur adds a low ridge just outside it. Each pixel is then lit from its slope, so the wall away from the light goes dark and the wall facing it catches a highlight.",
    },
    {
      question: "Does it redraw the whole slab every frame?",
      answer: "No. The slab is shaded once. After that only small rectangles are redone: the strip behind the float, the box under a stamp, or the patch under a finger. Curing costs nothing per pixel because it is a CSS mask on the dry canvas.",
    },
    {
      question: "Why can I only draw for the first part of the cure?",
      answer: "Once the slab is about four fifths dry it stops taking marks, which is the point of the piece. Remove the `cure > 0.8` test in the `down` handler if you want it to stay soft.",
    },
    {
      question: "How sharp is it on high density screens?",
      answer: "The canvases are sized to the slab at up to twice the CSS width and capped at 1280 pixels across to keep the first draw quick. Raise the cap in `prepare` if you need more, at the cost of a slower first paint.",
    },
    {
      question: "Can the finger marks be saved?",
      answer: "They live in the `scr` array, one value per pixel. Nothing is stored between visits. To keep a drawing you would copy that array out when the pointer lifts and load it back before the first shade.",
    },
  ],
  related: ["shortbread-letters-cut-from-dough-that-rise-and-brown-on-a-baking-tray-and-lose-a-bite-when-tapped", "magnetic-fridge-letters-you-can-drag-across-enamel-that-slide-back-to-spell-the-word", "finger-written-words-in-window-condensation-that-drip-fog-over-and-wipe-clear"],
  tags: ["concrete", "deboss", "stamp", "height map", "canvas", "letters", "draw"],
  height: 680,
  interactive: true,
};

export default meta;
