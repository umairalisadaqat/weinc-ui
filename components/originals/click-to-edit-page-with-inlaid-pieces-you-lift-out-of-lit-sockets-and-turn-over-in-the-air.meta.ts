const meta = {
  slug: "click-to-edit-page-with-inlaid-pieces-you-lift-out-of-lit-sockets-and-turn-over-in-the-air",
  category: "originals",
  name: "Click-to-Edit Page with Inlaid Pieces You Lift Out of Lit Sockets and Turn Over in the Air",
  keyword: "click to edit animation react",
  title: "React Click to Edit Animation with 3D Page Parts | We.Inc",
  description: "Visual editing demo in 3D: lift the photo, headline or button out of a page and blue light shows in the empty socket. Free React code and HTML to copy.",
  intro: "Visual editing shown as something you do with your fingers. A pottery studio's homepage lies on a dark table as a thick card, and three parts of it are loose: the photograph, the headline and the button are separate slabs set into wells cut for them. Press one and it rises off the page toward you, leaning a little so its edge shows. The well it left is black inside with a blue light burning round the rim, which is the selection outline made physical. Drag and the slab follows your hand over the page, trailing a soft shadow. Let go and it swings home, turns over once in the air and drops into the well, where the page gives under the knock and the light is shut in. The other side carries the other version: a second photograph, a second line, a second button. With nobody touching it a small arrow does the same thing to each piece in turn. On narrow screens the whole table scales down and the pieces stay big enough to press.",
  useWhen: [
    "A site builder wants to show that any part of a page can be clicked and changed, without recording the real editor.",
    "A feature page compares two versions of a headline, picture or call to action and wants visitors to flip between them.",
    "A design tool's landing page needs a hero that makes selection feel like holding the element.",
    "A portfolio piece on interface craft needs one object that rewards being poked.",
  ],
  customize: [
    "`pieces` is the list of loose parts. Each has its rectangle on the page, a corner `radius`, the `axis` it turns on and two `sides`; a side with a `photo` is a picture, otherwise `text` and `tone` make a card.",
    "`page` holds what is printed directly on the card: the name, the three links and the sentence under the headline.",
    "`LIFT` is how far a piece comes off the page, in pixels, and `T` is how thick it is. Keep `LIFT` above half the longest side that turns, or the slab will clip the page as it goes over.",
    "The glow in the wells is `#4F98FB` in the socket's `boxShadow` and gradient. Change the three `rgba(79,152,251, ...)` values with it.",
    "The viewing angle is `rotateX(36deg) rotateZ(-7deg)` in the frame loop. Lower the first number for a flatter, more readable page.",
  ],
  accessibility: [
    "Each piece is focusable with `role=\"button\"` and a name that states what it is and what it currently shows, for example Headline: Thrown by hand.",
    "Enter or Space lifts the focused piece, turns it and sets it back without any dragging. Focus is drawn as a blue outline that travels with the slab.",
    "The line under the table is a live region: it says which piece is being held and what letting go will do.",
    "With reduced motion nothing lifts, turns or sways and the demo arrow is hidden. A press swaps the piece to its other side in place.",
  ],
  faqs: [
    {
      question: "How do the pieces get real thickness in CSS?",
      answer: "Every slab is a `preserve-3d` box holding a front face, a back face rotated 180 degrees with `backface-visibility: hidden`, and seven plain layers spaced through its depth in the edge colour. Seen at an angle the layers read as a solid side.",
    },
    {
      question: "What decides when a piece drops back in?",
      answer: "Each piece runs its own small spring for position, height and turn. After release it stays up until the turn is within about 46 degrees of done, then its target height becomes zero. When it reaches the page it bounces once at a fifth of its speed and the page gets a push from the same velocity.",
    },
    {
      question: "Can a piece have more than two versions?",
      answer: "Two is what a slab has sides for. For more, keep the two faces and swap the content of the hidden one each time the turn passes 90 degrees, reading from a longer list.",
    },
    {
      question: "Does dragging work on touch screens?",
      answer: "Yes. The handlers are pointer events with pointer capture, and the pieces set `touch-action: none` so a finger moves the slab and not the page. Everything outside the three pieces scrolls as usual.",
    },
    {
      question: "How do I stop the arrow demo?",
      answer: "It pauses by itself for seven seconds after any press, drag or key. To remove it, set `demoOn` to false in the frame loop and delete the cursor element.",
    },
  ],
  related: ["edit-sentence-that-gathers-into-a-bead-of-wet-paint-and-falls-onto-a-lacquered-page-model", "sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray", "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage"],
  tags: ["visual editing", "click to edit", "3d", "drag", "flip", "selection", "page model"],
  height: 754,
  section: true,
  interactive: true,
};

export default meta;
