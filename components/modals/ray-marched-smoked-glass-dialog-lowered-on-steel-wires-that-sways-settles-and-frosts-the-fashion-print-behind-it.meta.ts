const meta = {
  slug: "ray-marched-smoked-glass-dialog-lowered-on-steel-wires-that-sways-settles-and-frosts-the-fashion-print-behind-it",
  category: "modals",
  name: "Ray-Marched Smoked Glass Dialog Lowered on Steel Wires That Sways, Settles and Frosts the Fashion Print Behind It",
  keyword: "react glass modal webgl",
  title: "Smoked Glass Dialog on Steel Wires (React, WebGL) | We.Inc",
  description: "Free React dialog drawn as a slab of smoked glass in WebGL. It drops on two steel wires, sways to rest and frosts the fashion print hanging behind it.",
  intro: "A confirmation dialog built as a thing you could photograph. A fragment shader ray-marches a thick slab of smoked glass hung from two braided steel wires in front of a fashion print, and a long lens looks at it slightly from the left. The back face is acid etched, so the middle of the sheet turns the portrait behind into a soft wash of pink and navy, while the polished rim bends the print sharply and splits its colours a little. The question, the running text and both buttons are fired onto the front face as white enamel and cast faint shadows into the frost. Pressing the trigger winches the sheet down from above the frame: it stops, nods past its mark, twists on the wires and settles, while the lens pulls focus from the wall to the glass and the print dims. Closing it gives the wires a tiny dip before they take the weight and lift it away. Real buttons sit exactly over the enamel and ride every sway. On a phone the slab turns to portrait and the buttons share the bottom row.",
  useWhen: [
    "A gallery, print shop or studio site wants one moment of ceremony before a purchase or a booking is confirmed.",
    "The page behind the dialog is a strong photograph and you would rather frost it through real glass than lay a flat grey scrim over it.",
    "A product launch page needs a self-running hero object that is also a working, accessible dialog when someone reaches for it.",
    "You are tired of modals that fade in at the centre and want one that arrives with weight and leaves the same way.",
  ],
  customize: [
    "`dialog` holds every word on the glass: `eyebrow`, `title`, `body`, both button labels and the `done` message announced after a reservation.",
    "`print` sets the photograph behind (`src`, `alt`), the two `back` colours painted before it arrives, and the large `title` lettered across the bottom of the wall.",
    "`TINT` is how much red, green and blue the glass swallows per unit of depth. Lower all three to about 1 for clear glass, or raise the blue to 6 for a bronze smoke.",
    "`FROST` sets how far the etched face spreads the print, in sheet heights. 0.08 leaves the portrait almost readable, 0.35 melts it into two colours.",
    "The drop lives in `frame`: `0.74` is the seconds the winch takes, `0.34` is the nod when it stops, and the `14.2` and `2.15` pair is how long the twist on the wires keeps swinging.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The dialog is a real element with `role=\"dialog\"`, `aria-modal`, a heading as its label and the running text as its description, laid exactly over the painted glass.",
    "Tab and Shift+Tab stay inside the three buttons while it is open, Escape closes it, and when a person closes it focus returns to the trigger, which carries `aria-expanded`.",
    "Every control has a white focus ring that follows the glass as it moves, and the reservation message is read out through a polite live region.",
    "With reduced motion or without WebGL the sheet is drawn still: the photograph is blurred and dimmed with CSS, the glass is a blurred panel with a slanting shadow, and opening and closing happen at once.",
  ],
  faqs: [
    {
      question: "How do the real buttons stay on top of glass that is swinging?",
      answer: "Each frame the four corners of the glass are projected through the same camera the shader uses, and a CSS matrix3d transform maps a flat element of the sheet's size onto those four points. The dialog's buttons are positioned inside that element from the same layout that paints the enamel, so clicks, hover and focus rings land on the lettering however the sheet is turned.",
    },
    {
      question: "Why does the print behind go soft when the dialog arrives?",
      answer: "Two things happen together. The lens is given a wide aperture and its plane of focus moves from the wall forward to the glass, so every sample of the wall spreads into a disc, and the wall loses about a third of its light. Behind the sheet the etched face blurs it much further, which is what keeps the enamel easy to read.",
    },
    {
      question: "Can I close it by clicking outside?",
      answer: "Yes. A press anywhere on the stage that is not on the dialog or a button lifts the sheet away, as do the close mark, the quieter button and Escape. The demo stops cycling the moment someone touches the piece.",
    },
    {
      question: "Is it heavy to run?",
      answer: "The march is bounded to a box around the slab, the canvas never exceeds about a million and a half pixels, frames are blended over time instead of supersampled, and the loop stops when the piece scrolls out of view or the sheet comes to rest. If frames start running long, it lowers its own resolution.",
    },
    {
      question: "How do I use it as an ordinary modal in my app?",
      answer: "Keep the `open` state and the `change` function, and drop the demo timer in `frame`. The stage is a positioned box, so to cover a whole page give it `fixed inset-0` and feed the shader a capture of your page in place of the photograph, or keep it as a framed hero moment as shipped.",
    },
  ],
  related: ["velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway", "ray-marched-frosted-glass-pill-navbar-on-steel-standoffs-with-a-bead-of-light-inside-over-colour-block-photographs-that-slide-past", "gilt-edged-show-ticket-card-in-webgl-with-hot-foil-that-catches-a-softbox-as-it-tilts-over-blue-lacquer"],
  tags: ["modal", "dialog", "glass", "frosted", "webgl", "ray marching", "shader", "photography"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
