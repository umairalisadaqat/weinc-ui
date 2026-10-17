const meta = {
  slug: "index-card-checklist-where-a-pencil-draws-each-tick-in-graphite-and-its-eraser-rubs-it-out",
  category: "animated-cards",
  name: "Index Card Checklist Where a Pencil Draws Each Tick in Graphite and Its Eraser Rubs It Out",
  keyword: "pencil drawn checklist react",
  title: "React Checklist Drawn by a Pencil and Eraser | We.Inc",
  description: "Checklist on a ruled index card: a pencil ticks and strikes each line in grainy graphite, then turns round and rubs it out. Free React and HTML to copy.",
  intro: "A ruled index card on a green cutting mat with a red hexagonal pencil lying under it. Tick a line and the pencil lifts, travels to the box, writes a tick, then drags a slightly wobbly line through the words before it goes back to where it was resting. The graphite is laid as thousands of small specks that miss the low spots in the paper, so the mark looks like 2B on card and not like a vector line. Untick the line and the pencil swings round so its eraser leads, scrubs back along the stroke in short passes, sheds rubber crumbs that skid to a stop, and the crumbs are blown off the card once it is back. The scene is drawn at 480 pixels wide and scaled to fit, so on a phone the card shrinks with the pencil and each row stays a full tap target.",
  useWhen: [
    "A stationery shop, print studio or notebook brand wants a small to-do list that looks like the goods it sells.",
    "A landing page for a planning or task product needs one tactile object above the fold where a screenshot would be forgettable.",
    "A packing list, preflight list or opening checklist has four or five lines and deserves more ceremony than a row of checkboxes.",
    "A portfolio wants a playful contact or process card that visitors can mark up by hand.",
  ],
  customize: [
    "`tasks` holds the lines. Each has `text` and a `done` flag for how it starts. The card grows by `ROW` pixels for every entry you add.",
    "`LACQUER` is the pencil paint as red, green and blue numbers. `[32, 84, 64]` gives a dark green pencil, and the lit and shaded flats are worked out from it.",
    "`FOIL` is the gold lettering pressed into the top flat. Keep it under about twenty characters or it runs into the sharpened end.",
    "In `speck`, the loop count of 9 and the alpha range `0.07 + 0.25` set how dark the graphite is. Drop the count to 5 for a hard 2H line.",
    "The mat is `bg-[#1c2a27]` with four grid gradients in the section style. Swap the hex for `#22262e` and the grid tint for a cool grey to get a slate desk.",
  ],
  accessibility: [
    "Every line is a real button with `role=\"checkbox\"` and `aria-checked`, so Tab reaches each one and Space or Enter toggles it without the pointer.",
    "Both canvases are hidden from assistive technology. The count of lines still open is read from a polite live region each time it changes.",
    "The checked state changes at once when a line is pressed. The pencil catches up afterwards, so nobody waits on the drawing to know what happened.",
    "With reduced motion the tick and strike appear or vanish in one step, the pencil stays where it lies and the self-running demo does not start.",
  ],
  faqs: [
    {
      question: "How is the pencil line made to look like graphite?",
      answer: "Nothing is stroked. For every half pixel along the path the code scatters nine tiny squares across a band two to three pixels wide, each with its own opacity, and drops any that land on a low cell of a fixed noise grid. Pressure rises and falls along the stroke, which is why the ends of the line are paler.",
    },
    {
      question: "Why does the pencil keep its highlight on the same side when it turns round?",
      answer: "The lamp is fixed to the mat, not to the pencil. Each of the three visible flats is given a brightness from how squarely it faces that lamp at the current angle, so when the pencil swings through half a turn the lit flat and the shaded flat swap over.",
    },
    {
      question: "Can I save which lines are ticked?",
      answer: "Yes. The `done` state is a plain array of booleans in the same order as `tasks`. Lift it into a parent, or write it to storage inside the `toggle` function, which is the one place the value changes.",
    },
    {
      question: "What happens if someone clicks three lines quickly?",
      answer: "The boxes switch immediately and the three jobs are placed in a queue. The pencil finishes the mark it is on, then does the next one, so strokes never overlap or get cut short.",
    },
    {
      question: "Does the eraser remove the mark completely?",
      answer: "Almost. Each scrubbing pass takes off about a third of what is under it, and a final pass clears nine tenths of what remains on that row. A faint ghost is left on purpose, as it would be on real card.",
    },
  ],
  related: ["tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away", "instant-camera-that-ejects-photos-you-shake-to-develop", "leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling"],
  tags: ["checklist", "pencil", "eraser", "canvas", "paper", "todo", "skeuomorphic"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
