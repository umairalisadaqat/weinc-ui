const meta = {
  slug: "bubble-wrap-sheet-over-a-photo-print-with-air-cells-that-magnify-the-picture-until-you-pop-them-flat",
  category: "feedback",
  name: "Bubble Wrap Sheet over a Photo Print with Air Cells That Magnify the Picture until You Pop Them Flat",
  keyword: "bubble wrap pop react component",
  title: "React Bubble Wrap Pop Component for Waiting | We.Inc",
  description: "Waiting state of bubble wrap over a photo print: each air cell bends the picture like a lens until you pop it. Free React and Tailwind code, plus HTML.",
  intro: "A photograph lies on a pale table under a sheet of bubble wrap, turned a few degrees off square. Each air cell is a round button that shows the part of the picture beneath it slightly enlarged, with a bright window reflection near the top left, a darker rim and a shadow thrown onto the film. Pressing one squashes it: the enlargement goes, the plastic settles into a creased disc and a thin white ring flicks outward. You can hold the pointer down and sweep across a row to burst several in one pass. Left alone, a patch is already flat when the page loads and a new neighbour goes every half second or so, which stops the moment a person joins in. A line of text counts how many are gone, and when none are left the sheet slides away and a full one drops in. On a phone the sheet has fewer columns of the same size cells, so each one is still a comfortable target for a thumb.",
  useWhen: [
    "An order is being processed, a file is exporting or a payment is clearing, and the wait is long enough that a spinner alone feels dead.",
    "A print shop, framer or gallery wants a packing themed holding screen between checkout and confirmation.",
    "An empty state or a maintenance page needs something harmless to do with the hands.",
    "A 404 page for a shop wants a small toy that suits the product without sending anyone further off course.",
  ],
  customize: [
    "The words and the picture are in the `wrap` object. `tone` is the flat colour drawn in every cell and under the film before the photograph has loaded, so pick one close to the image.",
    "`CELL`, `PITCH` and `ROW` set the size of a cell and the spacing along and between rows. Keep `CELL` at 40 or more if the sheet will be used on phones. `ROWS`, `MAX_COLS` and `MIN_COLS` set how many there are.",
    "`LENS` is the enlargement inside a full cell. 1 turns the effect off, and anything past about 1.35 starts to look like a fish eye.",
    "The idle hand pops one cell every 620 milliseconds, set in the `setInterval` call. How much is already flat on load is the 0.17 in `starter`.",
    "`POP_SOUND_ON` is false. Set it to true for a short click made in the browser with no audio file. The table colour is `bg-[#e7e2d9]`.",
  ],
  accessibility: [
    "Every cell is a real button with `aria-pressed` and a label giving its row, its place in the row and whether it is full or popped.",
    "The sheet is one tab stop. Arrow keys move between cells and Space or Enter pops the one in focus, which shows a dark ring with a white gap so it reads on any part of the photograph.",
    "The count is ordinary text beside the sheet and is also the group's label, so progress does not depend on seeing which discs are flat.",
    "With reduced motion nothing pops unprompted, the squash and the ring are skipped and a new sheet fades in without sliding. No sound plays unless you switch it on in the code.",
  ],
  faqs: [
    {
      question: "How does each cell magnify the photo without a canvas?",
      answer: "A full cell has the same photograph as its background, sized to the whole sheet multiplied by `LENS` and shifted so the point under the cell's centre stays at its centre. Because every cell uses the one address, the browser downloads and decodes the image once.",
    },
    {
      question: "Why are the cells buttons and not one drawing?",
      answer: "So that each one can be reached and pressed without a pointer. A drawing would need a second, hidden set of controls to do the same job. A full sheet is about a hundred small elements, which browsers handle easily, and only the cell you press changes.",
    },
    {
      question: "How does sweeping across the sheet work?",
      answer: "Pressing down on a cell sets a flag and releases the pointer capture the browser would otherwise keep on that button. While the flag is set, every cell the pointer enters pops itself. A listener on the window clears the flag when the press ends anywhere on the page.",
    },
    {
      question: "Can it report progress on a real task?",
      answer: "Yes. Remove the idle timer and call `pop` from your own code as work completes, for example one cell per uploaded file, using `walk` to choose the next neighbour. The count under the sheet will follow because it reads the same set.",
    },
    {
      question: "Does the idle popping keep running off screen?",
      answer: "No. An intersection observer marks the sheet as hidden when it leaves the viewport and the timer skips its turn, and it also skips while the tab is in the background.",
    },
  ],
  related: ["corrugated-cardboard-parcel-with-printed-paper-tape-that-peels-back-and-four-flaps-that-fold-open-over-a-folded-jumper", "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph"],
  tags: ["bubble wrap", "pop", "fidget", "waiting", "loader", "photo", "packaging"],
  height: 640,
  section: true,
  interactive: true,
};

export default meta;
