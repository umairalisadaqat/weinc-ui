const meta = {
  slug: "desk-spike-testimonials-with-handwritten-note-slips-that-lift-off-one-steel-spindle-and-drop-onto-another",
  category: "testimonials",
  name: "Desk Spike Testimonials with Handwritten Note Slips That Lift off One Steel Spindle and Drop onto Another",
  keyword: "testimonial stack animation react",
  title: "React Testimonial Stack Animation on Desk Spikes | We.Inc",
  description: "Testimonial stack of handwritten slips with stapled portraits: each lifts off one desk spike, faces you, then drops onto another. Free React and HTML code.",
  intro: "Two brass desk spikes stand on a dark desk, the kind a diner or a newsroom keeps for paid bills. Six pastel memo slips are impaled on the left one, each with a red printed heading, a stapled portrait print, the sender's name and business in ballpoint and a short quote on ruled lines. A slip is read by lifting it: it rides up the steel, rattling from side to side, clears the point, swings round to face you and grows to reading size. Ask for the next and the one in your hand goes over the right spike and falls down it under gravity, bouncing on the pile and spinning a little, while the next rises from the left. Because a spike only gives back its top slip, going backwards takes them off the right pile in reverse order. On a phone the spikes sit side by side at the bottom and the open slip fills the space above them.",
  useWhen: [
    "A restaurant, print shop or repair business wants its thank-you notes to look like the paperwork that actually piles up beside the till.",
    "You have five to eight short quotes and want a visible sense of progress through them: one pile shrinks while the other grows.",
    "A newsroom, studio or agency site leans on desk objects and needs a testimonial block in the same language.",
    "A case study page wants each client's portrait and words to arrive as one piece of paper.",
  ],
  customize: [
    "`notes` is the pile, top slip first. Each entry has `name`, `company`, `quote`, a `paper` colour and a `photo` with `focus` and a `tone` used until the picture loads.",
    "`TURNS` gives every slip the angle it rests at on a spike. Keep the list as long as `notes`, and widen the spread for a messier pile.",
    "`WIDE` and `TALL` hold the two arrangements: `spx` is how far each spike stands from the centre, `kit` scales the spikes and piles, `big` is the reading size and `cy` is how high the open slip is held.",
    "The red print is `#b3321f` and the ballpoint is `#16224e`. Replace each everywhere it appears to restyle the stationery.",
    "The fall is `2300` in the frame loop and the bounce is `0.34` on the line after it. Use `0.15` for a slip that lands flat with no hop.",
  ],
  accessibility: [
    "The two round arrow buttons in the corner are real buttons that take Tab, Enter and Space. Pressing a pile with the pointer does the same thing, as a shortcut only.",
    "Each arrow is disabled when its pile is empty, so a keyboard user is never offered a move that does nothing.",
    "The drawn slips are hidden from assistive technology. The note in hand is repeated as a `blockquote` and `figcaption` in a polite live region, so each one is announced once when it arrives.",
    "With reduced motion the second slip is shown already in the hand, nothing travels or bounces, and each press swaps the slip in one step.",
  ],
  faqs: [
    {
      question: "Why can I only go back in reverse order?",
      answer: "Because that is what a spike does. Only the top sheet can come off without lifting the rest, so the component keeps a single position: every slip before it is on the right pile and every slip after it is on the left. Moving forward and back walks that position along the list. The self-running demo goes to the end and then works its way back.",
    },
    {
      question: "How is the desk drawn in perspective?",
      answer: "One empty element is rotated 62 degrees about the horizontal and told to keep its children in 3D. Bases, spikes and slips are placed inside it by x, y and height. A slip in the hand is given the opposite rotation, which cancels the tilt so it faces the screen squarely.",
    },
    {
      question: "How do the slips hide the spike correctly?",
      answer: "Each spike is a thin upright plane and each slip is a flat plane at its own height, so they really do cross. The browser splits crossing planes when it sorts a 3D scene, which leaves the steel visible above the top slip and hidden below it with no extra work.",
    },
    {
      question: "What happens if someone presses next several times quickly?",
      answer: "Every slip follows the same rules whatever state it is caught in. One that is still climbing finishes clearing the point, then crosses to the spike it now belongs on and drops. Nothing is skipped and nothing passes through the steel.",
    },
    {
      question: "Can I use typed text instead of handwriting?",
      answer: "Yes. The name, business and quote take their face from `HAND`. Set it to a monospace or serif stack and the slips read as typed dockets. No web font is loaded either way, so the script face varies by device.",
    },
  ],
  related: ["rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce", "cork-board-testimonials-with-pinned-portrait-postcards-that-swing-unpin-and-turn-over-to-a-handwritten-note", "domain-name-plate-marked-out-in-blue-then-hand-stamped-with-steel-punches-and-screwed-down"],
  tags: ["testimonials", "paper", "stack", "3d", "physics", "handwriting", "desk", "portraits"],
  height: 752,
  section: true,
  interactive: true,
};

export default meta;
