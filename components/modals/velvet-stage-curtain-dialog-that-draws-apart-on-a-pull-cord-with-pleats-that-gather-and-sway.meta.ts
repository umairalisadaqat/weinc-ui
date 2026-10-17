const meta = {
  slug: "velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway",
  category: "modals",
  name: "Velvet Stage Curtain Dialog That Draws Apart on a Pull Cord with Pleats That Gather and Sway",
  keyword: "curtain reveal modal react",
  title: "React Curtain Reveal Modal with a Pull Cord | We.Inc",
  description: "Dialog hidden behind velvet stage curtains: pull the cord and the pleats gather to the wings to show a photo and its actions. Free React and HTML code.",
  intro: "A dialog that makes an entrance. Two red velvet curtains hang under a scalloped pelmet with gold fringe, and a tasselled cord hangs at the right. Pull the cord and the curtains travel to the wings. The cloth is a fixed width, so as each curtain is squeezed into less space its pleats get narrower and deeper, the lit flanks get brighter and the valleys go black. The hems lag behind the tops and swing before they settle. Behind them is a dark stage with a photograph, a title and two buttons. The second button, the cord and the Escape key all close the curtains again. On phones the words sit under the photograph and the curtain stacks narrow to about sixty pixels each.",
  useWhen: [
    "An event, premiere or product launch page wants its announcement to arrive with some ceremony.",
    "A venue, cinema or theatre site needs a tonight's programme panel that feels like the building.",
    "A landing page hides an offer until the visitor asks for it, and a grey overlay would be a let-down.",
    "A portfolio opens on a single image and you want the first interaction to be a pull, not a click on a link.",
  ],
  customize: [
    "`show` holds the kicker, title, line, both button labels and the photograph. The photo is shown at two to three, so pick an upright image with a dark background.",
    "`VELVET` is the lit colour of the cloth as red, green and blue. `[24, 52, 120]` gives a royal blue house curtain, `[30, 96, 62]` a billiard green.",
    "`FULLNESS` is how much wider the cloth is than the opening. 1.2 hangs nearly flat when shut, 1.6 is heavy and deeply folded.",
    "`PLEAT` is the width of one fold when shut. Lower it to 34 for a finer, lighter fabric.",
    "`HOLD_MS` is how long the self-running demo keeps the stage open. The demo ends for good the first time someone uses the cord or a button.",
  ],
  accessibility: [
    "The cord is a real button with `aria-expanded` and a label that switches between opening and closing. The panel behind is `role=\"dialog\"` with `aria-modal` and is named by its title.",
    "Opening from the cord moves focus to the first action once the curtains have parted. Closing returns focus to the cord, and Escape closes from anywhere inside.",
    "While the curtains are shut the dialog is `invisible`, which removes its buttons from the tab order and from screen readers.",
    "With reduced motion the curtains are drawn once, already open, and each press of the cord swaps between open and shut without travel or swing.",
  ],
  faqs: [
    {
      question: "How are the folds drawn?",
      answer: "Each curtain is painted one pixel column at a time into an off-screen canvas. For every column the code works out where it sits on a pleat, which way that bit of cloth faces and how deep in a valley it is, then mixes a matte term with a rim term that is strongest where the cloth is seen edge on. That rim is what makes it read as velvet and not satin.",
    },
    {
      question: "Why do the pleats get deeper as the curtains open?",
      answer: "The number of pleats and the width of the cloth never change. When the same cloth has to fit a narrower span, each fold must stick out further, so its sides get steeper. The shading follows from that, which is why nothing about the open state is drawn separately.",
    },
    {
      question: "What makes the bottom of the curtain swing?",
      answer: "The top edge follows a firm spring toward open or shut. The hem follows the top on a looser spring with little damping. The curtain is then copied to the screen in thin horizontal bands, each stretched to its own width between those two, so the folds lean while it moves.",
    },
    {
      question: "Can I use it as a full-page intro instead of a dialog?",
      answer: "Yes. Give the outer element the height of the window, put your page content where the photograph and dialog are, and remove the `role` and `aria-modal` attributes so the content is treated as ordinary page content.",
    },
    {
      question: "Is this heavy to run?",
      answer: "The columns are only repainted while the curtain tops are moving. At rest each frame copies about two hundred and forty thin bands and draws the cord. The canvas is capped at one and a half device pixels per pixel, and the loop stops off screen and in hidden tabs.",
    },
  ],
  related: ["hanging-garment-bag-scroll-reveal-with-a-brass-zip-that-parts-waxed-canvas-over-a-photograph", "press-stud-snap-toggle-on-a-waxed-canvas-strap-that-pops-open-and-curls-back", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["curtain", "velvet", "stage", "theatre", "dialog", "modal", "canvas", "reveal"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
