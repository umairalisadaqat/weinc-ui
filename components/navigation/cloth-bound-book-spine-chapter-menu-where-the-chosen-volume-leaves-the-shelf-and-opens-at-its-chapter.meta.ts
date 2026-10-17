const meta = {
  slug: "cloth-bound-book-spine-chapter-menu-where-the-chosen-volume-leaves-the-shelf-and-opens-at-its-chapter",
  category: "navigation",
  name: "Cloth Bound Book Spine Chapter Menu Where the Chosen Volume Leaves the Shelf and Opens at Its Chapter",
  keyword: "3d bookshelf navigation react",
  title: "React 3D Bookshelf Navigation by Chapter | We.Inc",
  description: "Chapter menu drawn as a shelf of cloth bound books: pick a spine and that volume is pulled out and opened. Copy the React and Tailwind code or HTML free.",
  intro: "Eight cloth bound volumes stand on an oak shelf against a pale wall, held up by a block of green marble. Each spine is a menu item with its title stamped down it in gold, copper, pearl or black. Choose one and the volume rocks forward at the head, comes clear of the row, travels along the shelf and is stood down at an angle so you can see the photograph pasted into its front board. The book next to the gap leans into it. Press the cover and it swings back on its hinge to show a coloured endpaper and the first leaf, which carries the chapter number, title, a line of summary and the link. On a narrow screen the chosen volume stands on a second shelf above the row.",
  useWhen: [
    "A long guide, course or annual report has six to ten chapters and you want the contents page to feel like picking a book up.",
    "A publisher, bookshop or library site needs a way into a series where each title has its own colour and cover image.",
    "A portfolio is organised as a handful of named projects and a plain row of tabs undersells them.",
    "A documentation home page wants one memorable object above the ordinary list of sections.",
  ],
  customize: [
    "Every volume is one entry in `volumes`: `title`, `no` and `line` are the words, `cloth` is the cover colour, `foil` picks `gold`, `copper`, `pearl` or `ink` from `FOIL`, and `end` colours the endpaper and headband.",
    "`t`, `h` and `d` are each book's thickness, height and cover width in pixels. Mixed values make the row look collected. Keep `d` under `LANE` so a book clears its neighbours before it moves sideways.",
    "`RY_OUT` and `RY_OPEN` are how far the standing volume is turned when shut and when open, and `COVER_OPEN` is the angle of the opened board.",
    "`WIDE` and `TALL` hold the two layouts. `closedX` and `openX` place the standing book, `shelfY` is the top of the plank, and `eye` is where the camera looks from.",
    "The wall is `WALL` and the plank colours are the `oak` and `figure` gradients near the bottom of the file. Swap them for a dark wall and walnut if your page is dark.",
  ],
  accessibility: [
    "The shelf is a `nav` and each spine is a button named with its chapter number and title. The one standing out of the row has `aria-current`.",
    "The front board is a second button with `aria-expanded`, and the link on the first leaf only joins the tab order while the cover is open, so nothing hidden can take focus.",
    "Previous and next buttons under the shelf do the same job as the spines, and the caption beside them is a polite live region that names the chapter now showing.",
    "With reduced motion nothing travels: the chosen volume is simply drawn standing open, and the self-playing tour never starts.",
  ],
  faqs: [
    {
      question: "How are the books built?",
      answer: "Each one is a small set of flat elements inside a `preserve-3d` parent: a spine, a back board, a page block seen from above with a striped headband, the first leaf, and a front board that turns about the spine edge. The front board has two faces with `backface-visibility: hidden`, cloth outside and endpaper inside, set three pixels apart so it has thickness.",
    },
    {
      question: "What stops two moving books passing through each other?",
      answer: "Timing. The volume going home starts at once and is back in its slot in under a second. The one coming out waits for the delay in `wait` before it tips, so by the time it reaches the lane in front of the shelf the other has left it.",
    },
    {
      question: "Why does the neighbouring book lean?",
      answer: "A row of books is only upright because each one is held by the next. When a volume leaves, the one on its right is given a small `rotateZ` about its bottom corner on a loose spring, so it falls into the gap and is pushed straight again when the volume returns.",
    },
    {
      question: "Is the gold lettering an image?",
      answer: "No, it is live text. A banded metallic gradient is clipped to the letters with `background-clip: text`, and a thin dark drop shadow underneath makes it read as pressed into the cloth. The cloth itself is two fine repeating gradients crossed at right angles with a grain layer multiplied over them.",
    },
    {
      question: "Can each chapter link to a real page?",
      answer: "Yes. The anchor on the first leaf has `href=\"#\"`. Add a `href` field to each entry in `volumes` and pass it through, or call your router from the spine button if you would rather navigate on the first click and skip the opening.",
    },
  ],
  related: ["enamel-platform-sign-breadcrumbs-hanging-from-rail-trolleys-that-roll-away-swinging-when-you-step-back-up-the-trail", "manila-file-folder-tabs-in-a-steel-desk-rack-that-tip-forward-like-records-in-a-crate-to-show-the-chosen-file", "pull-down-wall-chart-tabs-on-spring-rollers-that-snap-up-to-uncover-the-chart-hanging-behind"],
  tags: ["3d", "bookshelf", "books", "chapters", "menu", "navigation", "photo"],
  height: 728,
  section: true,
  interactive: true,
};

export default meta;
