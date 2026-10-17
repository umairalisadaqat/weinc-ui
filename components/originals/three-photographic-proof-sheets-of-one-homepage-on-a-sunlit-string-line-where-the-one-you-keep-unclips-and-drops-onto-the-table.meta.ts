const meta = {
  slug: "three-photographic-proof-sheets-of-one-homepage-on-a-sunlit-string-line-where-the-one-you-keep-unclips-and-drops-onto-the-table",
  category: "originals",
  name: "Three Photographic Proof Sheets of One Homepage on a Sunlit String Line Where the One You Keep Unclips and Drops Onto the Table",
  keyword: "react webgl design picker",
  tags: ["design picker", "webgl", "homepage styles", "we.inc original", "choose a design"],
  title: "WebGL Design Picker of Proofs on a String Line | We.Inc",
  description: "Free React design picker: three glossy proofs of one homepage hang on a sunlit line. Keep one and it unclips and drifts down onto the table.",
  intro:
    "A studio wall in late sun, a cotton line strung between two brass eyes, and three glossy photographic prints of the same surf school homepage hanging from steel bulldog clips. Each print shows a different style: a quiet serif layout on cream, heavy type on near-black, and clay colour blocks with pill buttons. Choose one and its clip lets go. The print tips forward, flutters as it falls, lands face up on the plywood table with a small kick of its leading edge and settles into focus, still wearing its clip, now painted blue to mark it as the keeper. The line springs up where the weight left it and the two prints still hanging swing on their clips. Everything is ray marched in one fragment shader with two samples per pixel, soft shadows, contact darkening and a sunlit window pattern, then a second pass adds edge smoothing and a gentle depth of field. On phones the frame turns portrait so all three prints stay large enough to read.",
  useWhen: [
    "An onboarding step where a customer picks between several generated looks for the same page and you want the choice to feel physical.",
    "A showcase that compares visual directions for one brand without pretending any of them is a finished site.",
    "A launch or studio page that needs one memorable interactive moment above the fold rather than a carousel.",
    "A presentation of three moodboard proofs where only one can go forward and the others stay in view.",
  ],
  customize: [
    "Change the `proofs` array for the style names and the short line read out with each one, and `BUSINESS` for the caption above the heading.",
    "The printed pages are drawn in `paintProof`: each branch of the `if` is one design on a 480 by 640 canvas, so you can paint your own layouts or draw a screenshot into it with `drawImage`.",
    "`REST` sets where each print lands on the table and how far it turns, and `FALL` and `RISE` set how long the drop and the rehang take in seconds.",
    "`DIP` is how far a hanging print pulls the line down, and the spring on `q.dip` in `step` decides how much the line bounces when a print lets go. Lower the `4` for a springier line.",
    "`START` is the proof lying on the table at load and `DEMO_EVERY` paces the idle demo, which stops for good after the first choice.",
  ],
  accessibility: [
    "The real control is a group of three pill buttons with `aria-pressed`, reachable by Tab and operated with Enter or Space, each showing a visible blue focus ring.",
    "A polite live region announces which style is kept, so a screen reader user hears the result of each choice without needing the picture.",
    "The canvas is `aria-hidden`; pressing a hanging print in it is only a pointer shortcut for the same buttons.",
    "With reduced motion the demo is off and the scene is drawn once per choice with the kept print already on the table, and without WebGL 2 a still version shows the real printed designs.",
  ],
  faqs: [
    {
      question: "Is this three.js?",
      answer: "No. It is one raw WebGL 2 fragment shader that ray marches the wall, table, line, clips and prints as signed distance shapes, plus a small post pass. There are no extra packages beyond React and framer-motion.",
    },
    {
      question: "How is the fall animated?",
      answer: "Each print has a single progress value. Its height follows a squared curve so it speeds up like something dropping, its tilt eases from hanging to flat with a decaying flutter on top, and a spring adds one small bounce of the leading edge on landing. The pose is pushed up if any corner or the clip would pass through the table.",
    },
    {
      question: "Why does the line move when a print drops?",
      answer: "Every hanging print adds a dip to the line under its clip. When one lets go its dip springs back towards zero with little damping, so the line bounces, and the two neighbours receive a sideways push that sets them swaying.",
    },
    {
      question: "Can I show real screenshots on the prints?",
      answer: "Yes. The prints are read from one canvas texture built by `makeAtlas`. Draw your images into each 480 by 640 cell, keeping a white border and the label strip at the foot so they still read as photographic prints.",
    },
    {
      question: "Will it slow the page down?",
      answer: "The shader runs at no more than about 1.3 million pixels, drops its resolution if the frame rate stays under 45, and stops entirely when the section scrolls out of view or the tab is hidden.",
    },
  ],
  related: [
    "three-ray-marched-board-models-of-one-homepage-in-window-light-where-the-design-you-pick-trades-places-with-the-one-in-front-on-a-base-that-lights-blue",
    "three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page",
    "folded-paper-tag-faq-hung-on-brass-hooks-in-ray-marched-sunlight-where-each-tag-drops-open-to-show-its-printed-answer",
  ],
  height: 900,
  section: true,
};

export default meta;
