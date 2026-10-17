const meta = {
  slug: "agent-day-book-printer-with-jewel-lamps-for-each-tool-and-a-paper-tape-that-ratchets-out-what-was-done",
  category: "originals",
  name: "Agent Day Book Printer with Jewel Lamps for Each Tool and a Paper Tape That Ratchets Out What Was Done",
  keyword: "agent activity log component react",
  title: "React Agent Activity Log as a Desk Printer | We.Inc",
  description: "An agent's activity log as a black desk printer: a lamp lights for each tool and paper tape feeds out the finished job. Free React code and HTML to copy.",
  intro: "An activity log for a bakery's agent, built as a small black printer seen from above on a pale desk. Five glass lamps in steel rings sit across its lid, one for each tool: inbox, diary, stock, till and site. A strip of paper with feed holes down both edges runs out from under a steel tear bar and ends in a loose curl. Each time the agent finishes something, that tool's lamp turns blue, a carriage shuttles across the little print window, the knurled wheel on the side turns and the tape is pulled out by one entry in five short clicks. The new entry arrives in wet blue ink and dries to black, with the time and the tool above it. Press any lamp to have the agent do a job with that tool straight away. The whole object is laid out at one fixed size and scaled to its container, so on a phone it is the same machine, smaller.",
  useWhen: [
    "You want to show what an agent has done as a plain list of finished jobs, and a scrolling console would feel cold.",
    "An automation page needs proof of work that reads at a glance: which tool, what time, what happened.",
    "A light, calm section needs one dark object as its anchor.",
    "You are building a status area where new items should arrive with a physical beat and not simply appear.",
  ],
  customize: [
    "`tools` names the lamps and holds the `lines` each one prints in rotation. Keep lines to about 34 characters so they fit the strip on a single row.",
    "`OPENING` is the tape at load, newest first, as `[tool, line, minutes after midnight]`. Eight entries fill the strip from the tear bar to the curl.",
    "`AUTO` is the order the demo presses the lamps, `FIRST_JOB` the pause before it starts and `EVERY` the gap between jobs, both in milliseconds.",
    "Fresh ink is `text-[#2f74dc]` and dry ink `text-[#1b2130]` on the entry text; `duration-[1400ms]` beside them is the drying time.",
    "The pull of the paper is the `ratchet` function. Change both `5`s for more or fewer clicks per entry, or pass `\"easeOut\"` in `feed` for a smooth slide.",
  ],
  accessibility: [
    "The tape is an ordered list with a label saying it is newest first, so the log reads top to bottom without the animation.",
    "Each lamp is a button named for its tool, 68 by 88 design pixels including its engraved label, with a visible focus ring. The label brightens along with the lamp, so state is not carried by colour alone.",
    "With reduced motion the demo does not run by itself. Pressing a lamp still adds the entry, which appears in place with no feed, shuttle or ink fade.",
  ],
  faqs: [
    {
      question: "Why does the paper move in clicks?",
      answer: "The feed uses a custom easing that splits the travel into five steps, each a quick pull followed by a rest. A real printer advances on a ratchet, and the stops are what make it look driven by a wheel.",
    },
    {
      question: "How do I print my own events?",
      answer: "Call `run(toolIndex)` when a job finishes, after changing it to take the text as an argument in place of picking from `lines`. Remove the `schedule` effect so nothing prints by itself.",
    },
    {
      question: "How many entries does it keep?",
      answer: "Nine are held in state and about seven show. Older ones pass under the curl and are dropped, so the list never grows however long the page stays open.",
    },
    {
      question: "Is anything here an image?",
      answer: "No. The lacquered case, steel rings, glass lamps, feed holes, tear bar teeth and the rolled end are gradients and shadows on ordinary elements. The only script-driven sizing is one scale factor from a ResizeObserver.",
    },
    {
      question: "Can the tape be wider for longer sentences?",
      answer: "Yes, but several things move together: the strip's `w-[276px]`, the feed-hole background size, the curl and the tear bar. Shortening the text is the easier route.",
    },
  ],
  related: ["agent-switchboard-with-swaying-patch-cords-and-lamps-that-light-as-each-step-runs", "agent-sorting-cabinet-that-reads-each-incoming-note-under-a-blue-light-and-files-it-in-the-right-pigeonhole", "arched-brass-ticket-window-prompt-box-with-a-sliding-tray-that-carries-a-typed-slip-under-the-glass-and-returns-a-ticket"],
  tags: ["originals", "agent", "activity log", "printer", "paper tape", "indicator lamps", "tactile"],
  height: 800,
  interactive: true,
};

export default meta;
