const meta = {
  slug: "architects-plan-chest-where-add-a-page-slides-a-cream-card-sheet-out-of-a-slot-onto-a-sunlit-stack-with-a-blue-tab",
  category: "originals",
  name: "Architects Plan Chest Where Add a Page Slides a Cream Card Sheet out of a Slot onto a Sunlit Stack with a Blue Tab",
  keyword: "webgl add page button react animation",
  title: "Plan Chest Add a Page Control in WebGL | We.Inc",
  description: "Free React and WebGL add page control: an ebonised plan chest feeds a cream card sheet out of its slot and lays it on a sunlit stack with a blue index tab.",
  intro: "A control for adding pages to a site, drawn as one small scene on an oak desk in late sun. A low plan chest in ebonised wood has a long slot across its front, a brass pull and a label holder. On its lid lies a stack of thin cream card sheets, one per page, each a touch askew, each with a pencilled page layout on its face and an index tab standing off its right edge. The top sheet carries the blue tab. Press Add a page and a fresh sheet slides out of the slot, lifts, tips and turns in the air, then floats down onto the stack on its own cushion of air and takes the blue tab from the sheet below. Put one back reverses the trip. The big word on the left is always the newest page, with the full list underneath. On a phone the camera stands further back and the words sit above the chest.",
  useWhen: [
    "The empty state or toolbar of a page manager in a site editor, where adding a page should feel like taking a fresh sheet out of a drawer.",
    "A product tour slide that needs to show, without a paragraph, that a site is a set of pages you can keep adding to.",
    "A section on a landing page about growing a small business site from one page to several.",
    "A portfolio piece for a studio that wants a calm, tactile hero with one motion worth watching twice.",
  ],
  customize: [
    "`PAGES` is the list of page names in the order they come out of the chest; `START` is how many are already on the stack when it opens.",
    "`LAY` gives each sheet its small offset, its turn and where its tab sits down the edge. Make the turns zero for a perfectly squared stack.",
    "`pose` is the sheet's path: the first third is the slide out of the slot, the rest is the arc onto the stack. Raise the `0.62` for a higher lift or the `0.42` for a steeper tip.",
    "`pageSketch` in the `SCENE` shader draws the pencilled page on each sheet's face from rules, boxes and a picture frame, so you can sketch a different page there.",
    "`MOVE_TIME`, `FIRST_HOLD` and `HOLD` set how long a sheet takes and how long the self-playing demo waits between sheets.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Both actions are real buttons; Add a page names the page that will come out next and Put one back names the page it will return.",
    "The buttons are disabled while a sheet is in the air and when there is nothing left to add or remove, so a second press cannot tangle two sheets.",
    "The page list is an ordered list, and a polite live region reads how many pages are on the stack and which is newest after each change.",
    "With reduced motion the sheet appears on the stack at once, a single frame is drawn for each change, and without WebGL 2 a still built from plain elements still counts the sheets up and down.",
  ],
  faqs: [
    {
      question: "Is this a 3D library under the hood?",
      answer: "No. The chest, the sheets and the desk are signed distance shapes ray marched in a single fragment shader through the plain WebGL 2 API, with a second short pass for focus blur, a soft bloom and film grain. React and framer-motion are the only imports.",
    },
    {
      question: "How does a sheet only a few hundredths thick stay sharp?",
      answer: "The canvas is rendered at more pixels than the screen shows and then filtered down, the march stops at a tolerance that tightens near the camera, and the pencil lines widen with distance so they never break into dots.",
    },
    {
      question: "Can I hook Add a page up to my real page list?",
      answer: "Yes. Create the page in your own store inside the `add` handler, then call `api.current.add()` once it succeeds. The names shown come from `PAGES`, so feed your page titles in there.",
    },
    {
      question: "Why does each sheet sit slightly crooked?",
      answer: "Real card never stacks perfectly square, and the small offsets in `LAY` let the cut edges catch the sun at different angles, which is what makes the pile read as paper rather than a block.",
    },
    {
      question: "What does it cost to run?",
      answer: "The ray marcher works inside a tight box around the stack, the render size is capped and stepped down when frames run slow, and nothing is drawn while the section is off screen or the tab is hidden.",
    },
  ],
  related: [
    "paper-homepage-model-under-a-glass-bell-jar-on-a-sunlit-table-that-lifts-away-when-you-go-live-and-raises-a-blue-flag",
    "page-section-blocks-in-resin-ceramic-and-anodised-metal-that-lift-out-of-a-stack-to-reorder-a-live-page",
    "three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page",
  ],
  tags: ["webgl", "add page", "pages", "paper", "ray marching", "originals"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
