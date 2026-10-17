const meta = {
  slug: "village-scoreboard-with-enamel-number-plates-that-drop-onto-brass-hooks-and-swing",
  category: "app-ui",
  name: "Village Scoreboard with Enamel Number Plates That Drop onto Brass Hooks and Swing",
  keyword: "react scoreboard component",
  title: "React Scoreboard Component with Hanging Plates | We.Inc",
  description: "Scoreboard on a canvas: a painted wooden board where enamel number plates fall off brass hooks and new ones drop on and swing. Free React and HTML code.",
  intro: "A score display built like the board at the edge of a village ground, where someone changes the numbers by hand. Green painted boards sit in a cream frame with signwritten team names. Each digit is an enamel plate hanging by a punched hole from a brass cup hook. Press a team and the plates that need to change are flicked off, tumble out of the bottom of the frame and fade, while fresh ones drop from above, land on the hook with a small bounce and swing as pendulums until friction stops them. No two plates share the same chips along the edge. A small red plate in the middle counts the period. Drag the pointer across a plate and it swings the way you brushed it, and a light gust stirs them now and then. On narrow screens the two teams stack with the period plate between them.",
  useWhen: [
    "A club, school or league site shows a latest result and wants it to look like the ground, not like a spreadsheet cell.",
    "A party game, quiz night or family app keeps a running score for two sides on a shared tablet.",
    "A game menu needs a results screen with weight, where the final numbers land one by one.",
    "A landing page counts two things against each other, such as votes for two options, and can afford a playful display.",
  ],
  customize: [
    "`sides` holds the two painted names. Shorter words sit better over a pair of plates; anything up to about nine letters fits.",
    "`START` sets the scores and period that hang on load, and `PERIODS` is where the red plate wraps back to one.",
    "`PAINT` is the board colour as a lit and a shaded tone. `[\"#1d3557\", \"#14263f\"]` gives a navy board; update the focus ring offset class to match.",
    "`ENAMEL` is the plate colour followed by the numeral colour. Swap the two entries for black plates with cream numbers.",
    "Pendulum feel lives in the frame loop: `58` is how hard gravity pulls a plate back and `1.5` is the friction. Lower the friction to `0.6` for plates that rock much longer.",
    "Set `DEMO` to `false` to stop the board adding points by itself before anyone presses it.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. A real button lies over each pair of plates and over the period plate, and each label includes the current value.",
    "The line under the board is a polite live region that repeats both scores and the period as text, so a change is announced without the animation.",
    "Clear the board is an ordinary visible button at least 40 pixels tall, reachable by Tab after the three plate buttons.",
    "With reduced motion nothing falls or swings: a changed plate is replaced in place and the demo and the gusts never run.",
  ],
  faqs: [
    {
      question: "How do I feed it scores from my own data?",
      answer: "Call the `put` function with an array of two scores and a period number whenever your data changes, for example from an effect that watches a prop. It updates the text, compares each digit with what is hanging and swaps only the plates that differ.",
    },
    {
      question: "Can it show scores above 99?",
      answer: "Each side has two hooks, so values wrap at 100. For a third digit, add one more entry per side to `slots` in `layoutFor`, extend `digitsOf` to return the hundreds, and shift the label positions so the name stays centred.",
    },
    {
      question: "How do I take a point away after a mistake?",
      answer: "Add a second button per side that calls `put` with the score minus one, or read `event.shiftKey` in the existing click handler and subtract when it is held. The plate swap works the same in both directions.",
    },
    {
      question: "What makes the plates swing believably?",
      answer: "Each plate is a damped pendulum pivoting on its hook hole. Its angle is pulled back in proportion to the sine of the angle and slowed in proportion to its speed, stepped twice a frame. A new plate arrives with a sideways kick, so it rocks through several shrinking swings before it hangs still.",
    },
    {
      question: "Is every plate redrawn each frame?",
      answer: "No. The board is painted once, and each numeral plate is painted once to its own small off-screen canvas with its chips and gloss, then stamped in place at the current angle. A frame is one board image and five to ten plate images.",
    },
  ],
  related: ["split-flap-station-board-countdown-that-clatters-down-to-a-launch-date", "mechanical-stopwatch-with-a-crown-you-press-a-ticking-sweep-hand-and-a-flyback-reset"],
  tags: ["scoreboard", "score", "canvas", "pendulum", "enamel", "sport", "physics", "skeuomorphic"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
