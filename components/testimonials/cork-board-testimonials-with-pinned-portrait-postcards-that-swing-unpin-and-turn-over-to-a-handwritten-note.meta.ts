const meta = {
  slug: "cork-board-testimonials-with-pinned-portrait-postcards-that-swing-unpin-and-turn-over-to-a-handwritten-note",
  category: "testimonials",
  name: "Cork Board Testimonials with Pinned Portrait Postcards That Swing, Unpin and Turn over to a Handwritten Note",
  keyword: "cork board testimonials react",
  title: "React Testimonials on a Cork Board | We.Inc",
  description: "Testimonial board of portrait postcards on map pins: they sway when brushed, then unpin and turn over to a handwritten note. Free React and HTML code.",
  intro: "Five photo postcards hang on a cork board, each from one round-headed map pin. Because a card held by a single pin is a pendulum, every card swings when the pointer brushes it and settles again over a second or two, and a draught crosses the board now and then so the picture is never frozen. Press a card and its pin lifts on its needle, the card comes off the board to the middle, grows to reading size and turns over. The back is a real postcard back: a perforated stamp cut from the same portrait, a postmark with the town and date, the quote in handwriting on ruled lines, a signature, and the sender's name, job and business under a printed rule. Press it again and it goes back under its pin, which is pushed home slightly off centre so the card rocks. On a phone the cards hang in two short rows and the open card fills most of the board.",
  useWhen: [
    "A studio, freelancer or small agency has a handful of warm client notes and wants them to feel sent, not collected by a form.",
    "A cafe, florist or guest house wants a wall of thanks that matches the pin board behind its real counter.",
    "A wedding photographer or planner needs each couple's portrait to lead and the words to come second.",
    "An about page needs one playful, touchable block between two plain sections of text.",
  ],
  customize: [
    "Everything written or shown lives in the `cards` list: `quote`, `sign`, `name`, `role`, `company`, the postmark `city` and `date`, the `pin` colour and the `photo` with its `focus` point and fallback `tone`.",
    "`WIDE` and `TALL` are the two arrangements. Each entry in `homes` is the pin's x, its y and the angle the card hangs at, so moving a card means editing three numbers.",
    "`rest` and `open` inside those objects are the hanging size and the reading size as a share of the 340 by 480 card. Lower `open` in `TALL` if your quotes are short.",
    "The swing is `-40 * c.th - 1.5 * c.w` in the frame loop: the first number is how quickly a card returns to hanging straight, the second is how soon it stops.",
    "The cork colour is the `fill='#b98654'` inside `CORK`. For a darker stained board change that and the `bg-[#b08052]` on the section together.",
  ],
  accessibility: [
    "Each card front is a real button with `aria-expanded` and a label that names the sender, so the board can be worked with Tab and Enter alone.",
    "When a card is open its note is an ordinary `figure` with a `blockquote` and `figcaption`, and a second button on the back pins it up again. Closed backs are hidden from assistive technology and taken out of the tab order.",
    "The self-running read-through stops for good after the first press and pauses while a pointer is over the board, so nothing is pulled away mid-sentence.",
    "With reduced motion nothing swings or flies: one card is shown already turned over, and pressing swaps cards instantly.",
  ],
  faqs: [
    {
      question: "Why do the postcards swing so convincingly?",
      answer: "Each card keeps an angle and an angular speed and is rotated about the exact point where the pin passes through it, 22 pixels below its top edge. A spring pulls the angle back to straight down, a small drag term bleeds the speed off, and pointer movement adds speed in proportion to how far below the pin it crossed the card. That is the whole pendulum.",
    },
    {
      question: "Is the cork an image file?",
      answer: "No. It is a small SVG held in a data address and tiled as a background. Three noise filters are stacked over a tan fill: one makes the dark gaps between granules, one makes pale granules and one adds fine grit. Nothing is downloaded for the board itself.",
    },
    {
      question: "The handwriting looks different on my machine. Why?",
      answer: "No font is loaded. The note asks for Bradley Hand, then Segoe Print, then Noteworthy, then whatever the device calls cursive, so macOS, Windows, iOS and Android each use a script face they already have. To fix one look everywhere, load your own handwriting font and put its name first in `HAND`.",
    },
    {
      question: "How many postcards can the board hold?",
      answer: "Add entries to `cards` and a matching pin position to both `homes` lists. Six or seven fit the wide board if you tuck some behind the middle. Past that, cards start to cover each other's pins and the unpinning stops reading clearly.",
    },
    {
      question: "Can a card open on a link to a case study?",
      answer: "Yes. Put an anchor inside the `figcaption` on the back and give it a higher stacking order than the pin-back button that covers the card, for example `relative z-10`, so that it receives its own clicks.",
    },
  ],
  related: ["wire-postcard-spinner-rack-photo-carousel-that-spins-with-inertia-and-shows-card-backs", "desk-spike-testimonials-with-handwritten-note-slips-that-lift-off-one-steel-spindle-and-drop-onto-another", "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce"],
  tags: ["testimonials", "postcard", "cork board", "pins", "pendulum", "flip", "handwriting", "portraits"],
  height: 762,
  section: true,
  interactive: true,
};

export default meta;
