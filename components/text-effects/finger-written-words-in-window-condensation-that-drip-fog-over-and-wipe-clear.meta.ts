const meta = {
  slug: "finger-written-words-in-window-condensation-that-drip-fog-over-and-wipe-clear",
  category: "text-effects",
  name: "Finger-Written Words in Window Condensation That Drip, Fog Over and Wipe Clear",
  keyword: "foggy window text effect react",
  title: "React Foggy Window Text Effect on Canvas | We.Inc",
  description: "Canvas text effect: a line is written by fingertip on a misted window, drops run from the letters and dragging wipes the glass. Free React and HTML code.",
  intro: "A greenhouse window with the glass steamed up. A short line is written into the mist one letter at a time, and through the strokes you see the plants behind in full sharpness while the rest of the pane stays a pale green blur. A few seconds later water gathers under the letters and runs down in crooked lines, stopping and starting the way real drops do. Then the mist grows back over the writing and the next line begins. Drag a pointer or a finger across the pane and you clear a wide stripe that slowly narrows and closes. The pane is wide on desktop and turns into a tall four by five window on phones, where each word of the line gets its own row so the letters stay large.",
  useWhen: [
    "A cafe, florist, spa or bakery site wants its opening line to feel like it was left on the shop window that morning.",
    "A winter campaign or seasonal landing page needs one quiet centrepiece instead of a headline, paragraph and two buttons.",
    "A photographer or venue has one strong picture and wants visitors to uncover it by hand.",
    "A coming soon page should give people something to play with while there is nothing else to click.",
  ],
  customize: [
    "`phrases` is the list of lines. Two or three words each is the limit before the letters get small on a phone.",
    "`photo.src` is the view behind the glass. Pick a picture with strong colour, because the mist is made from a heavily blurred copy of it.",
    "`MIST` is the tint of the condensation as three RGB numbers. `236, 232, 224` gives warm kitchen steam and `214, 228, 240` a frosty morning.",
    "`WIPE_HOLD` and `WIPE_CLOSE` set how many seconds a wiped stripe stays open and how long it takes to mist over again.",
    "The stroke thickness is `size * 0.07` in `buildWord`. Raise it toward 0.1 for a fat thumb, but watch that letters such as a and e keep their holes.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The current line is a real `h2` that screen readers and search engines read, and it is a polite live region so each new line is announced.",
    "The photograph keeps its own `alt` text, since it is the content the writing reveals.",
    "With reduced motion the line is shown fully written, nothing drips or fades, and the button swaps to the next line at once. Wiping still works.",
    "The pane allows vertical touch scrolling, so a phone visitor can still scroll past it. Sideways drags do the wiping.",
  ],
  faqs: [
    {
      question: "How is the misted glass made without a blur filter?",
      answer: "The photograph is drawn onto a canvas only 40 pixels wide and then stretched back to full size in two steps, which smears it the way thick condensation does. A pale tint goes over that, heavier toward the corners, and thousands of one pixel specks give it the grain of tiny beads. It is built once per resize, not per frame.",
    },
    {
      question: "Why does the writing look hand drawn when it uses a system font?",
      answer: "The letters come from the lightest weight of the system sans serif, stroked with a thick round line, so every stroke ends up the width of a fingertip whatever the font's own contrast. Each letter is also tilted and nudged off the baseline by a small repeatable amount.",
    },
    {
      question: "Where do the drips start from?",
      answer: "After the line is drawn the component reads the pixels of the letter layer and finds the lowest wet point under a handful of random columns. Each of those becomes a drop with its own size, speed and length, so drips always hang from real strokes and never from empty glass.",
    },
    {
      question: "Can I keep one line on the glass and stop the loop?",
      answer: "Yes. Put a single entry in `phrases` and raise the `7.2` in `holdUntil` to a very large number. The line is written once, drips once and then stays, while wiping keeps working.",
    },
    {
      question: "Is the text still visible to search engines if it lives on a canvas?",
      answer: "The drawn letters are not, which is why the same words are rendered as a visually hidden heading inside the pane. Keep that heading when you edit the markup, and keep `phrases` as the single source for both.",
    },
  ],
  related: ["blind-embossed-paragraph-that-inks-in-under-a-passing-lamp", "layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters", "magnetic-fridge-letters-you-can-drag-across-enamel-that-slide-back-to-spell-the-word"],
  tags: ["condensation", "fog", "window", "canvas", "handwriting", "wipe", "drips"],
  height: 760,
  interactive: true,
};

export default meta;
