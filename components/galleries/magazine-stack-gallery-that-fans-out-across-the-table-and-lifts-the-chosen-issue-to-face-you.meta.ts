const meta = {
  slug: "magazine-stack-gallery-that-fans-out-across-the-table-and-lifts-the-chosen-issue-to-face-you",
  category: "galleries",
  name: "Magazine Stack Gallery That Fans out Across the Table and Lifts the Chosen Issue to Face You",
  keyword: "react magazine cover gallery",
  title: "React Magazine Cover Gallery That Fans Out | We.Inc",
  description: "Gallery of magazines on a dark table: the pile slides into a fan and the issue you press is lifted and turned to face you. Free React and HTML to copy.",
  intro: "Six perfect bound magazines lie on a dark table, seen from above and a little to one side. Each has a full bleed cover photograph, its own masthead lettering, two cover lines, a price box, a coloured glued spine and three edges of cut pages. Spread out, every issue rests on the one before it with its far edge on the table. Press a cover and that issue rises off the fan, straightens and tips up towards you while a band of light crosses its coated cover and its shadow on the table grows soft. Press the pile button and they slide back into a slightly untidy stack, the top ones arriving last. Dragging sideways scrubs between pile and fan. On phones the fan is tighter so the covers stay large.",
  useWhen: [
    "A publication, zine or newsletter wants its back issues shown as objects a reader can pick up, not as a grid of thumbnails.",
    "A studio has five or six case studies and each deserves a cover with a title and a line of copy.",
    "A lookbook or seasonal catalogue landing page needs one strong interactive piece near the top.",
    "A bookshop or newsstand site wants to feature this month's arrivals.",
  ],
  customize: [
    "Each cover is one entry in `issues`: `name`, `no`, `season`, `line` and `second` are the printed words, `photo` is the picture, `spine` is the binding colour and `tone` is what shows until the picture loads.",
    "`look` chooses the masthead lettering from the six treatments in `Masthead` (`block`, `italic`, `mono`, `serif`, `wide`, `stack`), and `ink` is its colour. Add a branch there for a new style.",
    "`W`, `H` and `T` are the width, height and thickness of an issue. `step` in `WIDE` and `SMALL` is how far apart the covers sit when fanned, and `sweep` is the angle between neighbours.",
    "`TIP` and `TURN` set the camera. `LIFT` is how high the chosen issue is held and `FACE` how squarely it faces you, from 0 (still flat) to 1.",
    "The table is `TABLE` plus the radial gradient layer directly under it. A pale table works too if you darken the shadow opacities in `Magazine`.",
  ],
  accessibility: [
    "Every cover is a button with `aria-pressed`, named with the title, issue number and main cover line, so the gallery can be worked entirely with Tab, Enter and Space.",
    "The Stack and Fan out button does what dragging does, and the caption beside it is a polite live region that names the issue being held.",
    "Each photograph has its own alt text. The price box, page edges, sheen and shadows are marked as decoration.",
    "With reduced motion the issues jump between positions without springs, the held copy does not hover and the self-playing sequence is skipped.",
  ],
  faqs: [
    {
      question: "How do the magazines overlap without cutting through each other?",
      answer: "When fanned, each issue except the first is tilted a few degrees about its own long axis, so the bound edge sits on the cover of the previous issue while the open edge touches the table. The angle is worked out from `T` and `step`, which means it stays correct if you change the thickness or the spacing.",
    },
    {
      question: "Why do the top issues arrive after the bottom ones?",
      answer: "Every issue follows its target on its own spring, and the springs get softer the higher the issue sits in the pile. All six are told to move at the same instant, but the looser ones take longer to get there and overshoot a little, which reads as paper sliding on paper.",
    },
    {
      question: "How is the chosen issue made to face the viewer?",
      answer: "The table is rotated by `TIP` and `TURN`. The held issue is given the opposite turn and most of the opposite tip in its own transform, so the two nearly cancel and the cover ends up almost square to the screen, leaning back by the small amount left over.",
    },
    {
      question: "Does dragging work on touch screens?",
      answer: "Yes. The stage listens for pointer events and uses `touch-pan-y`, so a sideways swipe fans or gathers the pile while a vertical swipe still scrolls the page. A drag shorter than eight pixels is treated as a press on the cover under the finger.",
    },
    {
      question: "Can I show more than six issues?",
      answer: "Add entries to `issues`. The fan is centred on however many there are. Past eight or so, lower `step` or the outer covers will leave the frame, and add more entries to `jitter` if you want every copy in the pile to sit at its own angle.",
    },
  ],
  related: ["vinyl-record-sleeve-gallery-where-the-disc-slides-out-and-spins-beside-its-cover", "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre"],
  tags: ["3d", "gallery", "magazine", "covers", "stack", "fan", "drag", "photo"],
  height: 759,
  section: true,
  interactive: true,
};

export default meta;
