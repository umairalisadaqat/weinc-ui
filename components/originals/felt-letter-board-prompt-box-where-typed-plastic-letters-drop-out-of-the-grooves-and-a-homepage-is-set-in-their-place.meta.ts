const meta = {
  slug: "felt-letter-board-prompt-box-where-typed-plastic-letters-drop-out-of-the-grooves-and-a-homepage-is-set-in-their-place",
  category: "originals",
  name: "Felt Letter Board Prompt Box Where Typed Plastic Letters Drop Out of the Grooves and a Homepage Is Set in Their Place",
  keyword: "react letter board text input",
  title: "React Letter Board Text Input for Prompts | We.Inc",
  description: "Prompt box built as a felt letter board: each key pushes a plastic letter into the groovesand Enter sets a homepage. Free React and HTML code.",
  intro: "An oak framed letter board hanging on a plain wall, the kind a cafe uses for its menu. The black ribbed felt is the text field. Click it and every key pushes a white plastic capital into the grooves, a little crooked like the real thing, with a blue peg standing where the next letter will go. Delete a character and it drops out of the board. Press Enter and the whole sentence lets go at once and rattles down behind the frame, then a homepage is set in its place letter by letter: a small brand line and menu along the top, a three row headline in large capitals, a blue line of supporting copy, a photographic print tucked into the ribs with three short facts beside it, and a glossy blue pill for the button. The board leans a few degrees towards the pointer. Three sample sentences play while it is idle. It is drawn at a fixed size and scaled down as one object on phones.",
  useWhen: [
    "A homepage for a builder aimed at cafes, shops and studios, where the visitor's own trade already uses boards like this.",
    "A prompt field on a light, quiet page that needs to feel made by hand and not like a search bar.",
    "A menu, opening hours or notice board on a hospitality site: drop the input and keep the `Line` rows as a display.",
    "A conference or wedding page that asks guests for one line and wants the answer to look pinned up.",
  ],
  customize: [
    "Sample content is the `pages` array: `sentence` is what gets typed, `head` is the three headline rows of up to ten letters, and `brand`, `nav`, `sub`, `facts`, `cta` and `src` fill the remaining rows.",
    "`COLS`, `ROWS`, `CELL` and `PITCH` set the typing grid. Seventeen columns at 21 pixels fill the felt; for a longer sentence drop `CELL` to 18, the letter size from 24 to 21 and raise `COLS` to 20.",
    "Letter colour and thickness are the `WHITE` and `INKED` text shadows: a light rim above, a darker rim below and a soft drop shadow. Change the two rim colours to tint the plastic.",
    "The frame is four mitred strips with a turbulence grain. Swap their tan gradients for `#2a2622` to `#12100e` to get a black stained frame.",
    "`pageFrom` builds the board for a visitor's own sentence. Return your own `head`, `sub` and `facts` from it to show real output.",
  ],
  accessibility: [
    "A transparent, labelled `textarea` covers the felt, so typing, pasting, selection keys, dictation and phone keyboards behave normally while the plastic letters mirror its value.",
    "The blue peg follows the real caret position, including when arrow keys move it into the middle of the sentence, and a blue line inside the frame shows keyboard focus.",
    "The letters and the finished page are decorative copies hidden from assistive technology; the finished headline is read out once from a status line.",
    "With reduced motion nothing falls or springs: the board opens on a finished page, the tilt is switched off and the peg stops blinking.",
  ],
  faqs: [
    {
      question: "How do the letters know where to sit?",
      answer: "The `setType` function walks the sentence and gives each character a row and a column, moving a whole word to the next row when it would cross the right edge. Each letter is then placed at its column times `CELL` and its row times `PITCH`, with a small fixed rotation and offset taken from its index so the wobble never changes between renders.",
    },
    {
      question: "What happens when the board is full?",
      answer: "A change that would need a sixth row is ignored, so the letter simply does not arrive. There is also a `MAX` character limit on the field. Raise `ROWS` if you move the hint line at the bottom out of the way.",
    },
    {
      question: "Why do deleted letters fall instead of fading?",
      answer: "Each letter is a child of `AnimatePresence` with an exit that moves it past the bottom of the felt on an accelerating curve while it spins. The felt clips its contents, so the letter disappears behind the lower strip of the frame.",
    },
    {
      question: "Is the wood an image?",
      answer: "No. The grain is an inline SVG turbulence filter stretched hard along one axis, laid over a gradient. The top and bottom strips use a horizontal version and the sides a vertical one, and each strip is clipped to a trapezoid so the corners meet as mitres.",
    },
    {
      question: "Can I keep lower case letters?",
      answer: "The field stores exactly what was typed and only the display is upper case, so `text` still has the original capitals when you send it somewhere. To show lower case on the board, remove `toUpperCase` where `shown` is computed.",
    },
  ],
  related: ["machined-aluminium-prompt-block-with-a-slot-that-swallows-a-typed-card-and-hands-back-a-printed-homepage", "arched-brass-ticket-window-prompt-box-with-a-sliding-tray-that-carries-a-typed-slip-under-the-glass-and-returns-a-ticket", "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage"],
  tags: ["prompt box", "input", "letter board", "felt", "oak", "typography", "originals"],
  height: 770,
  section: true,
  interactive: true,
};

export default meta;
