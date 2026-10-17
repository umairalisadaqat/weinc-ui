const meta = {
  slug: "agent-sorting-cabinet-that-reads-each-incoming-note-under-a-blue-light-and-files-it-in-the-right-pigeonhole",
  category: "originals",
  name: "Agent Sorting Cabinet That Reads Each Incoming Note Under a Blue Light and Files It in the Right Pigeonhole",
  keyword: "message triage animation react tailwind",
  title: "React Message Triage Animation: Sorting Cabinet | We.Inc",
  description: "Watch an agent sort a bike shop's messages: each note is read under a blue light, labelled and filed in a pigeonhole. Copy the React code or HTML free.",
  intro: "An agent triaging messages for a bicycle workshop, shown as an ivory enamel cabinet with six dark pigeonholes on a near-black stage. A paper note stands in a slot in the top of the cabinet beneath a slim blue reading lamp held on two steel posts. A band of light travels down the note, the phrase that decides where it belongs is marked with blue highlighter, and a rubber-stamp label names the pigeonhole: repairs, bookings, quotes, bills, parts or thanks. That pigeonhole glows, the note tips flat and slides in on top of the pile, the count on the steel label holder goes up by one and the next note rises. Press a pigeonhole to take its newest note back out and stand it under the lamp again. The cabinet is drawn at one size and scaled to its container, so the grid stays three across on a phone.",
  useWhen: [
    "You are explaining that an agent reads what comes in and decides where it goes before anything else happens.",
    "A support, inbox or lead-routing feature needs a picture of sorting that is not a flowchart with arrows.",
    "A dark section wants a pale object with visible depth: recesses, piles of paper and a light source.",
    "You want visitors to poke at the result, here by pulling a note back out of any pile.",
  ],
  customize: [
    "`holes` defines the six pigeonholes. `pile` is the starting count, `from` the sender, and `before`, `key` and `after` are the sentence split around the phrase that gets highlighted.",
    "`ORDER` lists which pigeonhole each arriving note belongs to, by index. Repeat an index to make one kind of message arrive more often.",
    "`HOLD_FIRST` and `HOLD` are how long a labelled note waits before filing, in milliseconds. The first is longer so the opening view is the finished one.",
    "The highlighter is `bg-[#4F98FB]/35` and the stamp uses `border-[#4F98FB]` with `text-[#2f74dc]`. Change those three to recolour the agent's marks.",
    "For a different grid, change the `% 3` and `/ 3` in `holeX`, `pileTop` and the list item position, and widen or narrow the cabinet to suit.",
  ],
  accessibility: [
    "Every pigeonhole is a button whose name gives its category and how many notes it holds, and says what pressing it does. An empty one is disabled.",
    "The note is real text in the page, so the sender, the message and the label can all be read and selected; the highlighter sits behind the words and never replaces them.",
    "With reduced motion the routine stops on the opening note, already marked and labelled. Pressing a pigeonhole swaps the standing note at once with no rise, sweep or slide.",
  ],
  faqs: [
    {
      question: "How does the note turn into a sheet on the pile?",
      answer: "A copy of the note is moved to the top of the target pile while it shrinks to 36 percent and rotates 80 degrees about its horizontal axis with perspective, so it ends nearly edge-on. It fades in the last quarter and a new top sheet, drawn as a tapering shape with two lines of writing, springs onto the pile.",
    },
    {
      question: "Where does the next note come from?",
      answer: "It starts 178 pixels lower, hidden behind the cabinet because the cabinet sits above it in the stacking order, and springs up through the slot. The note being filed is a separate element with a higher z-index, so it passes in front while its replacement is already on the way up.",
    },
    {
      question: "Can it sort real messages?",
      answer: "The component only plays the notes in `holes`. To drive it yourself, replace the timed effect with your own calls: set the note and its target, step `phase` through rise, read and tag as your classifier answers, then set `flight` to send the note to its pigeonhole.",
    },
    {
      question: "What happens to the note on show when I open a pigeonhole?",
      answer: "It is filed straight into its own pile without the animation, the newest note from the pigeonhole you pressed takes its place, and the routine carries on from there.",
    },
    {
      question: "Why do the piles stop growing?",
      answer: "The count keeps rising but only twelve sheet edges are drawn, which is what fits under the top of a recess. The number on the label holder stays accurate.",
    },
  ],
  related: ["agent-switchboard-with-swaying-patch-cords-and-lamps-that-light-as-each-step-runs", "brass-letterbox-file-upload-with-a-sprung-flap-that-swallows-envelopes-and-rattles-shut", "desk-spike-testimonials-with-handwritten-note-slips-that-lift-off-one-steel-spindle-and-drop-onto-another"],
  tags: ["originals", "agent", "triage", "pigeonholes", "sorting", "inbox", "tactile"],
  height: 800,
  interactive: true,
};

export default meta;
