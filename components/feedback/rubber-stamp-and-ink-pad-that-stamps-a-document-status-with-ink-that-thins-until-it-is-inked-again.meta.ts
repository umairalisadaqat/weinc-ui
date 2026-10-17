const meta = {
  slug: "rubber-stamp-and-ink-pad-that-stamps-a-document-status-with-ink-that-thins-until-it-is-inked-again",
  category: "feedback",
  name: "Rubber Stamp and Ink Pad That Stamps a Document Status with Ink That Thins Until It Is Inked Again",
  keyword: "rubber stamp effect react",
  title: "React Rubber Stamp Effect for Document Status | We.Inc",
  description: "Status stamp with an ink pad: a wooden stamp thumps PAID onto a delivery note in ink that thins until it is inked again. Free React code and HTML to copy.",
  intro: "A delivery note, an open tin of red ink and a beech stamp with a black lacquered handle, laid out on a blue-grey desk and seen from above and to one side. Choose a word and press Stamp, or click the paper where you want it. The stamp lifts, swings over, drops, gives slightly on the handle and leaves a framed impression with the date under the word. No two impressions match. Each one is drawn on a small canvas and then starved of ink by a blotchy noise field and by which way the hand leaned, so one corner prints solid and another breaks up. The rubber also carries less ink every time: the second and third impressions are visibly thinner, and before the fourth the stamp crosses to the tin and presses into the felt. On a phone the whole desk is scaled to fit the screen and the three controls wrap beneath it.",
  useWhen: [
    "An invoice, order or approval screen wants its final state shown as an act, not a coloured pill, at the moment the user confirms.",
    "A print shop, studio or courier site needs a hero object that says paperwork handled with care.",
    "A signing or review flow ends on a single page and deserves a satisfying last step before the redirect.",
    "A case study wants a small toy that shows three or four document states without a table.",
  ],
  customize: [
    "`statuses` holds the dies. Each `word` is cut into the impression and printed on the label on the front of the mount. Words up to about ten letters are squeezed to fit the frame.",
    "`INK` is the pad colour as red, green and blue numbers and drives the felt, the label and every impression. `[28, 62, 150]` gives office blue.",
    "`FADE` is the share of ink left after each press. At 0.62 the stamp goes back to the tin after three impressions. Use 0.8 for a wetter pad and five or six.",
    "`DOCKET` is everything printed on the sheet: title, number, date and the four lines. The date is also the small line inside the stamp frame.",
    "`TIP` and `TURN` are the camera angles in degrees. They are read back from the page when a click is turned into a place on the desk, so no other number needs changing.",
  ],
  accessibility: [
    "The stamp, tin and impressions are decoration. The working controls are a `radiogroup` for the word, a Stamp button and a New sheet button, all reachable with Tab.",
    "Every impression is announced through a polite live region with what the document was marked as and how many marks the sheet now carries.",
    "The stamp follows a mouse over the paper but never a finger, so touch scrolling is not hijacked. A tap on the sheet stamps at that spot.",
    "With reduced motion nothing travels: the impression appears where it was asked for, the pad refills silently and the unattended demo is off.",
  ],
  faqs: [
    {
      question: "How is the uneven ink made?",
      answer: "The frame, word and date are drawn solid on an offscreen canvas. Then every pixel is given a coverage value from two layers of smooth noise, a tilt across the die in a random direction and the ink left on the rubber. Low coverage fades the pixel, and a coarse grid knocks out specks where the paper fibres would stay dry.",
    },
    {
      question: "Can I trigger a stamp from my own code, for example after a payment succeeds?",
      answer: "Yes. The effect exposes `press` and `fresh` on the `api` ref, which is what the two buttons call. Set `statusRef.current` to the index of the word first, or call the same `choose` function the radio buttons use.",
    },
    {
      question: "How does a click on a tilted sheet land in the right place?",
      answer: "Three empty markers sit on the desk at known positions. Their on-screen positions are read when the pointer moves, which gives the two desk axes as they appear on screen at the current size. Inverting that small matrix turns the pointer into desk coordinates.",
    },
    {
      question: "Why is the handle a flat picture when the mount is a real box?",
      answer: "A turned handle looks the same from every side, so one drawing that always faces the camera is indistinguishable from a solid one at this angle. The mount is three real faces, which is why its label and end grain foreshorten correctly.",
    },
    {
      question: "How many impressions can one sheet hold?",
      answer: "Seven. After that the oldest is removed as each new one lands, which keeps the page light. New sheet slides the top page away and clears them all.",
    },
  ],
  related: ["wax-seal-button-that-a-brass-stamp-presses-into-molten-wax-on-an-envelope", "embossing-label-maker-with-a-letter-wheel-that-punches-status-badges-into-glossy-tape", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["stamp", "status", "ink", "3d", "canvas", "document", "skeuomorphic"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
