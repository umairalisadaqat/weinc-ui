const meta = {
  slug: "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce",
  category: "testimonials",
  name: "Rotary Card File Testimonials with Typed Quote Cards That Tip over the Spindle and Land with a Bounce",
  keyword: "rotary card file testimonial slider",
  title: "React Testimonial Slider as a Rotary Card File | We.Inc",
  description: "Testimonial slider built as a desk card file: quote cards with clipped portraits tip over the spindle and land with a bounce. Free React and HTML code.",
  intro: "A desk card file seen from above the front edge: a black base with a chrome strip, two chrome posts, a ridged black knob at each end of the spindle, and fifteen cream cards standing round it. The card facing you carries one client's words in typewriter type, a small portrait print held on by a wire paperclip, the surname initial in red and the name and business underneath. Coloured index tabs from the cards behind show over its top edge. Every few seconds the front card is thumbed forward. It is pushed only as far as upright, then it falls on its own weight, slaps onto the pile of card backs below the spindle and bounces twice, and the pile dips under it. The knobs roll with every card. On a phone the whole object shrinks to fit and the type on the cards is set larger to stay readable.",
  useWhen: [
    "An accountant, solicitor, recruiter or any office trade wants its client quotes shown as a contact file, which is what those clients are.",
    "A page has five to ten short quotes and room for only one at a time.",
    "A retro or stationery brand needs a testimonial block that matches a mid-century desk aesthetic.",
    "A B2B landing page wants a slider visitors will actually play with, so the second and third quotes get read.",
  ],
  customize: [
    "`people` holds each card: `quote`, `name`, `role`, the `tab` colour and the `photo` with a `focus` point and a `tone` shown while it loads. Keep quotes near a hundred characters so they clear the hub.",
    "`PITCH` is the viewing height in degrees. `FRONT_AT` is how far past facing you a card comes to rest. Lower `FRONT_AT` to 96 and the pile of backs stands taller.",
    "`GRAVITY` sets how hard a card falls, and the `-0.3` beside `c.v *=` is the bounce. Use `-0.1` for heavy card stock that lands dead.",
    "The backdrop is `bg-[#c8412b]` and the radial gradient on the section. The base, posts and knobs are neutral black and chrome, so any backdrop colour works.",
    "The plate on the base reads `Kind words`. Change that text, or delete the span for a plain front.",
  ],
  accessibility: [
    "Both knobs are real buttons labelled Previous card and Next card, reachable with Tab and worked with Enter or Space.",
    "The cards themselves are hidden from assistive technology. The current quote, name and role are repeated in a visually hidden `figure` that is a polite live region, so each turn is read out once.",
    "Flicking is optional. A click or tap anywhere on the cards also sends the front one over.",
    "With reduced motion nothing falls or bounces. Pressing a knob swaps the facing card at once, and the self-running demo is off.",
  ],
  faqs: [
    {
      question: "How does the card fall instead of just rotating?",
      answer: "A card in flight is treated as a rod hinged at the spindle. Its angular speed gains `GRAVITY` times the sine of its lean each frame, which is the real equation for something toppling. A push is added only until the card is a few degrees past upright, like a thumb letting go. When it reaches the pile its speed is reversed and cut to under a third, and it stops once that is too small to see.",
    },
    {
      question: "Why are there fifteen cards for five quotes?",
      answer: "The wheel needs enough cards to look full from this angle: seven waiting behind, one facing you and seven gone over. The quotes repeat round it in order. Because fifteen is a multiple of five the sequence never skips. If you change the number of quotes, set `N` to a multiple of it.",
    },
    {
      question: "Where do cards go after they disappear behind the base?",
      answer: "Each card keeps turning the same way under the spindle and comes up at the back of the waiting stack. That half turn happens out of sight, so the code simply hides a card between 152 and 322 degrees.",
    },
    {
      question: "Is this built with a 3D library?",
      answer: "No. Each card is a plain element rotated about its bottom edge with `rotateX`, inside a parent that keeps its children in 3D. The browser sorts them by depth. The base, posts and knobs are flat shapes with gradients drawn in front of and behind that group.",
    },
    {
      question: "Can visitors go backwards?",
      answer: "Yes. The left knob, or an upward flick on the cards, lifts the top card of the pile back over the spindle. It runs the same physics in reverse and settles against the waiting stack.",
    },
  ],
  related: ["cork-board-testimonials-with-pinned-portrait-postcards-that-swing-unpin-and-turn-over-to-a-handwritten-note", "desk-spike-testimonials-with-handwritten-note-slips-that-lift-off-one-steel-spindle-and-drop-onto-another", "round-blue-enamel-wall-plaque-unveiled-from-under-a-linen-cloth-whose-corner-is-carried-across-to-the-other-peg-and-left-hanging-in-folds"],
  tags: ["testimonials", "slider", "card file", "3d", "physics", "typewriter", "retro", "portraits"],
  height: 775,
  section: true,
  interactive: true,
};

export default meta;
