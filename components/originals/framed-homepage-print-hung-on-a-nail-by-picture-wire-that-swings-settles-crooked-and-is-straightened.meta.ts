const meta = {
  slug: "framed-homepage-print-hung-on-a-nail-by-picture-wire-that-swings-settles-crooked-and-is-straightened",
  category: "originals",
  name: "Framed Homepage Print Hung on a Nail by Picture Wire That Swings, Settles Crooked and Is Straightened",
  keyword: "framed picture swing animation react",
  title: "React Framed Picture Swing Animation on a Nail | We.Inc",
  description: "Showcase piece: a homepage print in an oak frame drops onto a nail, swings on its wire, rests crooked and is set level. Free React code and HTML to copy.",
  intro: "A way to present finished work as something made and hung. A homepage sits behind glass as a print, inside a cream mount with a bevel-cut window and an oak frame with mitred corners and a small brass plate. The frame comes down onto a steel nail, bounces once on its picture wire, swings like the weight it is and comes to rest slightly off true, the way hung pictures do. Then it is put right. Drag it sideways and let go: it swings from the nail, and the wire keeps part of your push as a new crooked resting angle. A brass spirit level under the frame reads the tilt with a bubble in blue liquid, and two buttons do what a hand would: straighten it, or knock it. Light from a window lies across the plaster, and a band of it slides over the glass as the frame turns. On a phone the frame is zoomed to fit and the level and buttons wrap beneath it.",
  useWhen: [
    "A studio or freelancer wants the last screen of a case study to feel like a handover and not a screenshot.",
    "A site builder shows the moment a site is done as a keepsake on the wall.",
    "A launch announcement needs one calm image that still moves when touched.",
    "A gallery, print shop or framer wants a hero where the product hangs and swings.",
  ],
  customize: [
    "The print is the `site` object: business name, three links, headline, one line of copy, button label and photo. The name is also engraved on the brass plate.",
    "`FW`, `FH` and `M` are the frame width, height and moulding width. The mount window is the `284` by `384` box inside it.",
    "The wood is built in `grain`. For walnut change the base stops to `#5a3a22`, `#6b4529` and `#4a2e19` and lower the `0.22` highlight.",
    "`SWING` sets how fast it rocks, `DAMP` how soon it stops, and `SLIP` how crooked a push leaves it. Set `SLIP` to `0` for a frame that always returns to true.",
    "`DROP` is the length of wire showing above the frame. The wire meets the frame `118` pixels either side of centre in the three `path` elements.",
  ],
  accessibility: [
    "The frame is exposed as one image with a label naming the business, and the level is decoration: its reading is repeated in a polite live region as plain words.",
    "Dragging is optional. Straighten and Knock it are real buttons with visible focus rings, so the swing can be driven from the keyboard.",
    "With reduced motion the frame is shown already hung and level, the light on the wall stays still, and the buttons move the frame to its new angle without swinging.",
  ],
  faqs: [
    {
      question: "What makes it settle crooked instead of dead level?",
      answer: "The pendulum is pulled toward a resting angle called `rest`, not toward zero. Letting go after a drag sets `rest` to a fraction of the angle you left it at, which stands in for wire sliding over the nail. Straighten sets it back to zero.",
    },
    {
      question: "How is the oak drawn without an image?",
      answer: "Each rail is a `div` clipped to a trapezoid so the corners meet as mitres. Its background stacks two repeating line patterns of different pitch over a honey gradient, and a second layer shades it across its width so it reads as a rounded moulding lit from the upper left.",
    },
    {
      question: "Does the loop run all the time?",
      answer: "No. Once the swing and the drop have both died away the frame is snapped to its resting angle and the animation frame loop ends. A drag, a button or the occasional draught starts it again, and it pauses off screen.",
    },
    {
      question: "Can the frame hold a landscape print?",
      answer: "Yes. Swap `FW` and `FH`, then resize the mount window and move the blocks inside the print. The wire, shadows and brass plate are positioned from those constants.",
    },
    {
      question: "Why zoom and not a scale transform for small viewports?",
      answer: "Zoom re-lays the frame out at the new size, so the small type in the print is drawn sharp. A scale transform would resample it and soften every letter.",
    },
  ],
  related: ["tri-fold-screen-that-opens-leaf-by-leaf-from-phone-to-tablet-to-desktop-as-one-page-reflows", "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage", "hanging-photo-mobile-with-balanced-wire-arms-and-prints-that-turn-in-the-air"],
  tags: ["frame", "print", "pendulum", "physics", "handover", "oak", "showcase"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
