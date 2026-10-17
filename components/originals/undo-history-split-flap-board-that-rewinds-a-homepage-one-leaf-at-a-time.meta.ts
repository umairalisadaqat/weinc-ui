const meta = {
  slug: "undo-history-split-flap-board-that-rewinds-a-homepage-one-leaf-at-a-time",
  category: "originals",
  name: "Undo History Split-Flap Board That Rewinds a Homepage One Leaf at a Time",
  keyword: "undo redo animation react",
  title: "React Undo Redo Animation on a Split-Flap Board | We.Inc",
  description: "Undo and redo demo where each saved version of a homepage is a leaf on a split-flap board that rewinds one leaf at a time. Free React and HTML to copy.",
  intro: "Version history built as the kind of board that used to announce train departures, except that each leaf carries half of a homepage. A black case stands at an angle on a blue floor. In its window a surf school's page is cut across the middle by a spindle: the upper half is one card, the lower half another, and behind them wait the cards for every earlier edit. Press Undo and the spindle is driven backwards. The lower card is carried up and over the pins, its back shows the upper half of the previous version, and the page underneath is revealed already changed back. Keep pressing and the leaves flutter upward one after another, the knurled knob on the side turning with them and the row of blue lamps on the lip going out from the right. Redo lets a leaf go, and it falls under its own weight and knocks the case. The sentence that made each version is printed under the board. On a phone the case shrinks to the width of the screen and the two buttons stay full size.",
  useWhen: [
    "A site builder or editor wants to show that every change is kept and any of them can be taken back.",
    "A changelog or release page walks through a short run of versions of one screen.",
    "A before-and-after comparison has more than two states and a slider would not explain the order.",
    "A landing page for backups or history needs a centrepiece with some weight to it.",
  ],
  customize: [
    "`edits` is the history, oldest first. `Face` draws the page after `i` of them, so add a sentence and then a condition such as `i >= 5` for what it changes.",
    "`site` holds the name, menu, both headlines, the button label and the two photographs.",
    "Undo speed is `s.rate`: 4.6 leaves a second for a press and 1.55 for the idle demo. Redo speed comes from the `26` in the fall, which is the pull on a loose leaf.",
    "The floor is `bg-[#4F98FB]` plus the radial gradient under it, and the focus ring offset uses the same colour. Change all three together.",
    "The case angle is `rotateX(6deg) rotateY(-15deg)` in the frame loop. Set the second number to 0 for a flat, front-on board.",
  ],
  accessibility: [
    "The board itself is hidden from assistive technology. Undo and Redo are real buttons, disabled at the first and last version.",
    "The line under the case is a live region that reads the position and the sentence, for example edit 3 of 4, Give it a dark header.",
    "Nothing depends on pointer movement: the tilt that follows the cursor is decoration and the buttons work from the keyboard.",
    "With reduced motion there is no flutter, no sway and no demo. A press changes the board straight to the neighbouring version.",
  ],
  faqs: [
    {
      question: "How does one leaf show two different pages?",
      answer: "The moving leaf has two faces with `backface-visibility: hidden`. Its front is the upper half of the older page. Its back is the lower half of the newer page, drawn upside down so that it reads correctly once the leaf has swung through 180 degrees about the spindle.",
    },
    {
      question: "How are several undos chained without a glitch between leaves?",
      answer: "The whole board is driven by one number, `pos`, that can sit between versions. Its whole part picks which two pages are in play and its fraction is the angle of the leaf. When it crosses a whole number the frame loop swaps which copies are visible in the same frame it resets the angle, so the picture does not change at the handover.",
    },
    {
      question: "Why is every version rendered up front?",
      answer: "Each version appears four times: both fixed windows and both faces of the leaf. They are all in the page from the start and only their `visibility` changes, which keeps React out of the animation and means a photo never loads in mid flip.",
    },
    {
      question: "Can I connect it to a real undo stack?",
      answer: "Call `api.current.step(-1)` and `api.current.step(1)` from your own undo and redo handlers, or set the target directly for a jump. Replace `Face` with whatever draws a snapshot of your document.",
    },
    {
      question: "What are the thin strips above and below the window?",
      answer: "The edges of the leaves that are not showing. The ones above are edits you have undone and could redo. The ones below are the versions under the current one. Their count changes as you step.",
    },
  ],
  related: ["click-to-edit-page-with-inlaid-pieces-you-lift-out-of-lit-sockets-and-turn-over-in-the-air", "edit-sentence-that-gathers-into-a-bead-of-wet-paint-and-falls-onto-a-lacquered-page-model"],
  tags: ["undo", "redo", "version history", "split flap", "3d", "rewind", "mechanism"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
