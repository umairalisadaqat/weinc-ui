const meta = {
  slug: "woven-ribbon-tab-bar-with-a-thread-marker-that-unpicks-and-restitches-itself",
  category: "navigation",
  name: "Woven Ribbon Tab Bar with a Thread Marker That Unpicks and Restitches Itself",
  keyword: "stitched tab bar react",
  title: "React Stitched Tab Bar on Woven Ribbon | We.Inc",
  description: "Tab bar on a strip of herringbone tape: a needle sews a box of red stitches round the current tab and unpicks it when you move. Free React and HTML code.",
  intro: "A tab bar that looks like a length of cotton twill tape cut with pinking shears and laid on a table. Five words are printed on it in dark ink. The current one is boxed in red running stitches, and a steel needle rests through the cloth at the corner where the last stitch ended, still threaded. Choose another word and the needle goes back to work: it pulls the old stitches out last one first, hops across with its shadow dropping away beneath it, then sews the new box one stitch at a time and parks again. Point at a tab, or tab to it, and a dashed chalk line shows where the stitching would go. The weave is generated once per size, pixel by pixel, and only the thread and needle are redrawn while something moves. On phones the tape is 344 pixels wide with tighter lettering.",
  useWhen: [
    "A clothing, tailoring, quilting or haberdashery shop needs category tabs that belong to the trade.",
    "A handmade goods marketplace wants its filters to feel made by hand without resorting to a script font.",
    "A brand story page switches between a few chapters and the change of chapter deserves a second of theatre.",
    "A product page offers four or five options, such as fabric or fit, and should show clearly which is chosen.",
  ],
  customize: [
    "`links` is the row of words. The grid divides the tape evenly, so keep them to seven letters or fewer for phones.",
    "`THREAD`, `THREAD_LIGHT` and `THREAD_DARK` are the body, highlight and edge of the sewing thread. Navy is `#1f3a7a`, `#6f8fd6` and `#0f1d42`.",
    "`TAPE` is the cotton colour. `[38, 40, 44]` gives black tape, in which case change the label class `text-[#2b2019]` to a pale colour and remove `mix-blend-multiply`.",
    "Stitch length comes from `total / 10.5` in `outline`: a larger divisor means longer, fewer stitches. Sewing speed is the `44` in the frame loop and unpicking speed the `78`.",
    "The table colour is the `bg-[#c4674a]` on the outer element with its matching radial gradient.",
  ],
  accessibility: [
    "The tape is a `nav` landmark with a list of anchors. The chosen one carries `aria-current=\"page\"`, so the stitched box is decoration on top of real state.",
    "Labels are live text printed over the canvas, not pixels, so they can be read aloud, selected, translated and zoomed.",
    "Keyboard focus draws a dark ring inside the tab and also triggers the chalk guide, which means hover gives pointer users nothing extra.",
    "With reduced motion there is no unpicking and no hop: the finished box simply appears round the new tab with the needle already parked.",
  ],
  faqs: [
    {
      question: "How is the cloth texture produced?",
      answer: "A loop visits every pixel of an offscreen canvas and decides how bright the thread at that spot is. Diagonal ridges that reverse direction every band make the herringbone, a finer checker makes the firm edge, and each ridge gets its own slight tint so the tape does not look printed. The result is kept and stamped onto the visible canvas each frame.",
    },
    {
      question: "What happens if I click a third tab while it is still sewing?",
      answer: "There is one needle with one thread, so it finishes nothing by magic. It unpicks whatever it had sewn so far on the tab it is at, then hops to the newest choice. Rapid clicks are safe and never leave two boxes on the tape.",
    },
    {
      question: "Can the tabs switch panels of content?",
      answer: "Yes. Read the `active` index and render the matching panel below. If you do that, change the anchors to buttons with `role=\"tab\"`, wrap them in a `tablist` and add arrow key handling, because tab panels have a different keyboard contract from page links.",
    },
    {
      question: "Why does the needle stick out past the edge of the tape?",
      answer: "The canvas is 22 pixels larger than the tape on every side, set by `M`. That spare room lets the parked needle and its shadow cross the edge the way a real one does, and holds the shadow the tape casts on the table.",
    },
    {
      question: "Will it stay sharp on high density screens?",
      answer: "The cloth and stitches are drawn at two canvas pixels per CSS pixel, set by `RES`. Raise it to 3 for very dense phone screens. Weaving time grows with the square of that number but it only runs when the bar changes size.",
    },
  ],
  related: ["brass-lift-floor-indicator-navigation-with-an-arrow-that-sweeps-an-enamel-dial-between-sections", "cast-iron-finger-post-navigation-with-painted-arms-that-swing-round-the-post-to-point-at-the-chosen-page", "cloth-bound-book-spine-chapter-menu-where-the-chosen-volume-leaves-the-shelf-and-opens-at-its-chapter"],
  tags: ["tabs", "fabric", "stitching", "ribbon", "canvas", "needle", "skeuomorphic"],
  height: 640,
  interactive: true,
};

export default meta;
