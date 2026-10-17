const meta = {
  slug: "pin-art-board-where-steel-pins-rise-into-the-relief-of-an-app-screen-and-follow-the-pointer",
  category: "originals",
  name: "Pin Art Board Where Steel Pins Rise into the Relief of an App Screen and Follow the Pointer",
  keyword: "pin art canvas animation react",
  title: "React Pin Art Canvas Animation of App Screens | We.Inc",
  description: "Canvas piece: a framed board of steel pins rises into the relief of an app screen and bulges under the pointer. Free React and HTML code.",
  intro: "A dark framed board holds a grid of round-headed pins, 46 across and 62 down, like the desk toy you press a hand into. A sentence is typed above it, and the pins travel forward by different amounts until an app screen stands out of the board: a count of orders with a week of bars, a calculator with a display and sixteen keys, or a sign-up sheet with three ticked names. The pins that make up the main button are blue and every other pin is steel, lit from the top left so tall pins shade the short ones beside them. Moving a pointer or a finger over the board pushes a soft dome through whatever is there. Three pills under the frame pick the app, and the board changes by itself until someone touches it. The canvas scales with its frame, so a 360 pixel phone shows the whole board with nothing cut off.",
  useWhen: [
    "A page about turning a written idea into a working app needs one object that shows several kinds of app without three separate mock-ups.",
    "You want a hero visual that rewards a curious pointer: the dome under the cursor makes people stay and wave at it.",
    "A product tour has to switch between a tracker, a calculator and a sign-up sheet in the same spot, and a plain fade would feel flat.",
    "A dark, tactile centrepiece is wanted on an otherwise pale page, with a single accent colour doing the pointing.",
  ],
  customize: [
    "Each entry in `reliefs` paints one screen with three helpers: `box(x, y, w, h, radius, level, blue)`, `dot(x, y, r, level, blue)` and `text(...)`. Positions are in pins and `level` is the height from 0 to 1.",
    "`apps` holds the pill label and the sentence for each relief, in the same order. Add a fourth entry to both arrays and a fourth pill appears.",
    "`COLS`, `ROWS` and `PITCH` set the grid. A finer board, say 60 by 80 at a pitch of 5.5, shows smaller details and costs more drawing time per frame.",
    "`LIFT` is how far a full-height pin moves. Raise it past 10 for a deeper, more dramatic relief or drop it to 4 for a shallow emboss.",
    "The two colour ramps live in `tone`: steel runs from `[24, 29, 38]` to warm white, and the blue ramp passes through `[79, 152, 251]`. Swap those triples to re-skin every pin.",
  ],
  accessibility: [
    "The canvas is exposed as an image whose label names the screen currently formed, and the sentence above it is real text that a screen reader hears in full, not one letter at a time.",
    "The three pills are a `radiogroup` with roving focus: Tab reaches the checked pill, and the arrow keys move between apps and wrap at the ends.",
    "With reduced motion the pins jump straight to each relief, the ring that runs out from the button is skipped, the sentence appears whole and nothing changes until a pill is chosen.",
    "The board sets `touch-action: pan-y`, so a finger can push pins sideways and the page still scrolls when the same finger moves up or down.",
  ],
  faqs: [
    {
      question: "How are nearly three thousand pins drawn fast enough?",
      answer: "A pin head is not painted from scratch each frame. Thirty brightness steps are rendered once in steel and once in blue onto tiny off-screen canvases, and every frame stamps the right one with `drawImage`. The shafts are plain rectangles. The loop also stops when the board scrolls out of view or the tab is hidden.",
    },
    {
      question: "Where do the pin heights come from?",
      answer: "Each relief is painted in shades of grey onto a hidden canvas at eight pixels per pin, then every eight by eight block is averaged into one number. That averaging is why rounded corners and the digits get in-between heights along their edges instead of a hard stair-step.",
    },
    {
      question: "What makes it look raised when it is a flat 2D canvas?",
      answer: "Three things. A raised head is drawn higher up the canvas than its base, with the shaft visible below it. Rows are painted from the top down, so near pins overlap far ones. And each pin is darkened when the neighbour above or to its upper left is taller, which reads as a cast shadow.",
    },
    {
      question: "Can the pins show a logo or a photo instead of an app?",
      answer: "Yes. Anything that can be drawn on a canvas can become a height map. Inside the map builder, replace the `paint(...)` call with `hc.drawImage(yourImage, 0, 0, COLS * U, ROWS * U)` and bright areas will stand tallest. High-contrast, chunky artwork works best at this resolution.",
    },
    {
      question: "Why do the pins wobble when the screen changes?",
      answer: "Every pin is its own spring with a stiffness of 190 and a damping of 15, and each one starts moving a little later than the pin above it. The staggered start gives the diagonal sweep and the light damping gives the small overshoot as a pin arrives.",
    },
  ],
  related: ["sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["originals", "canvas", "pin art", "app", "relief", "pointer", "tactile"],
  height: 820,
  interactive: true,
};

export default meta;
