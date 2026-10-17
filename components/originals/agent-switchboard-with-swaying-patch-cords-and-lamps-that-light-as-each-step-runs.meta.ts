const meta = {
  slug: "agent-switchboard-with-swaying-patch-cords-and-lamps-that-light-as-each-step-runs",
  category: "originals",
  name: "Agent Switchboard with Swaying Patch Cords and Lamps That Light as Each Step Runs",
  keyword: "ai agent workflow animation react",
  title: "React Agent Workflow Animation: Patch Cord Board | We.Inc",
  description: "Agent steps drawn on a canvas as an enamel switchboard: patch cords hang with rope physics and a lamp lights per step. React code and HTML, free to copy.",
  intro: "An agent for a flower shop, drawn as a small enamel switchboard on a putty-coloured stage. Four numbered step jacks sit along the top and five tool jacks below them: inbox, stock, diary, reply and invoice. A braided cord, blue or black, hangs in a loop from each step to the tool it uses. When the agent runs, the first step's lamp comes on, a bead of light travels down its cord, the lamp above that tool glows and a dark readout at the foot of the panel says in plain words what was done. Then the second step, the third and the fourth. Every cord is a simulated rope, so the loops sway and settle. Take any plug and carry it to the spare jack: the cord swings after your hand, and from the next run that step uses the other tool. The panel keeps its shape and scales down to phone width with the readout on two short lines.",
  useWhen: [
    "A page about agents needs to show steps and tools without drawing boxes and arrows or a face.",
    "You are explaining that an agent is a fixed order of steps, each wired to one tool, and that the wiring can be changed by hand.",
    "A feature area for automation wants a single tactile object that people will pick up and pull on.",
    "A dark dashboard screenshot would be the obvious choice and you want something a visitor has not seen before.",
  ],
  customize: [
    "`tools` lists the lower jacks. `name` is engraved above the lamp and `does` is the sentence the readout shows when a step reaches that tool. Keep five entries or change `BX` to match.",
    "`START` wires the steps at load: `[0, 2, 1, 3]` sends step two to the third tool and step three to the second, which is why two cords cross. Leave at least one tool unused so there is a spare jack.",
    "`LENGTHS` sets each cord in design pixels. Longer cords hang lower; keep them under about 560 so the loops clear the readout.",
    "`COLOURS` alternates `BLUE` and `INK`. Any colour works for the body; the darker outline and the highlight are chosen by whether the cord is the blue one.",
    "`STEP_TIME` is how long each step takes in seconds. Gravity is the `1700` in `rope`, and `0.988` beside it is how quickly a swing dies down.",
  ],
  accessibility: [
    "The canvas is decoration. Each plugged cord has a real button on top of it whose label says which step it is and which tool it uses, and pressing Enter or Space moves that cord to the spare jack.",
    "The readout is ordinary text, so the current step can be read at any time. It is not a live region, because it changes every second and a half and would talk over everything else.",
    "With reduced motion no loop runs: the cords are settled before the first paint, all four tool lamps are lit and the readout shows the finished state. Moving a cord redraws the board once.",
    "The grab areas are 44 pixels across and stop the page from scrolling only while a finger is on a plug.",
  ],
  faqs: [
    {
      question: "How is the cord simulated?",
      answer: "Each cord is 34 points. Every tick a point keeps most of its last movement and falls a little, then twelve passes pull neighbouring points back to their fixed spacing while the two ends are held on their jacks. That is Verlet integration with distance constraints, run at 120 ticks a second.",
    },
    {
      question: "What decides where a dropped plug goes?",
      answer: "On release the nearest tool jack within 58 design pixels wins, as long as it is empty or it is the jack the plug came from. Otherwise the plug springs back home. A spring moves the plug to its jack, which is why the cord overshoots and swings when it seats.",
    },
    {
      question: "Why does one cord move by itself?",
      answer: "After each full run, if nobody has touched the board for seven seconds, the fourth cord moves to the spare jack. It keeps the preview alive and shows that the wiring is not fixed. Remove the three lines after the comment about the spare jack to stop it.",
    },
    {
      question: "How do I connect it to a real run?",
      answer: "The sequence lives in the `seq` object inside the frame loop. Replace the timer that advances `seq.step` with your own events, and set `lampTo[tool] = 1` when a tool call returns.",
    },
    {
      question: "Is the metal a picture?",
      answer: "No images are loaded. Nuts, screws, lamp bezels and the engraved lettering are painted once to a hidden canvas with gradients, then copied each frame under the moving parts.",
    },
  ],
  related: ["sentence-to-booking-app-keys-that-lift-off-a-typed-strip-and-seat-into-a-tray", "phone-game-built-from-stacked-glass-layers-that-press-together-into-a-playable-screen"],
  tags: ["originals", "agent", "switchboard", "rope physics", "canvas", "patch cords", "tactile"],
  height: 800,
  interactive: true,
};

export default meta;
