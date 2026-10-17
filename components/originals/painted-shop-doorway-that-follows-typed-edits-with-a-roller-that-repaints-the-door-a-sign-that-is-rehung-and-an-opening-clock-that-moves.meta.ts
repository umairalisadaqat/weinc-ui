const meta = {
  slug: "painted-shop-doorway-that-follows-typed-edits-with-a-roller-that-repaints-the-door-a-sign-that-is-rehung-and-an-opening-clock-that-moves",
  category: "originals",
  name: "Painted Shop Doorway That Follows Typed Edits with a Roller That Repaints the Door, a Sign That Is Rehung and an Opening Clock That Moves",
  keyword: "edit by prompt animation react",
  title: "React Edit by Prompt Animation: Shop Doorway | We.Inc",
  description: "Demo of editing by typing: each sentence sends a roller down a painted shop door, hangs a new sign or moves the opening clock. Free React and HTML code.",
  intro: "Editing a live site, shown on the one part of a small business everybody recognises: its front door. The stage is a plastered wall with a white doorcase, a fanlight carrying the street number, a panelled door in gloss paint with a brass knob and letter plate, an enamel plate beside it whose clock hand shows when the shop opens, and an iron bracket with a name board on two chains. A sentence types itself into the bar underneath. Ask for a different colour and a loaded paint roller comes down the door, leaving the new coat wet behind it. Ask for a new name and the old board drops off one chain and falls away, then the new one lands on the hooks and swings until it settles. Ask for an earlier start and the blue hand springs round the dial. Three buttons let a visitor make each change. Everything is built from gradients and shadows on plain elements, with no images, and the scene scales as one piece on a phone.",
  useWhen: [
    "A site builder or content tool wants to show that changing a published site is one sentence, without a screenshot of an editor.",
    "A landing page for local shops, cafes or studios needs a hero that looks like a premises.",
    "An onboarding step explains that colours, names and opening times can all be changed later.",
    "A changelog or what's new page wants a small recurring object that reacts to each entry.",
  ],
  customize: [
    "The `edits` array is the script. Each entry has the sentence to type and one of `door`, `name` or `hour`, which index into `paints`, `names` and the clock.",
    "Door colours are the two values in `paints`. The panels, gloss and shadows are translucent black and white overlays, so any paint colour keeps its mouldings.",
    "The sign text is `names`, two short lines each. The board itself is the `board` helper: change the `124` by `100` box and the `text-[19px]` class together.",
    "The roller's speed is the `1500ms` on the `-coat` and `-roll` classes, which must stay equal so the wet edge sits under the sleeve.",
    "The sign's pendulum is `-30` (how fast it swings) and `-0.9` (how soon it settles); `2.1` is the knock when a new board lands.",
  ],
  accessibility: [
    "The doorway is one decorative group hidden from assistive technology. The typed sentence is in a polite live region, so each edit is announced as words.",
    "Each kind of change has a labelled button of its own, at least 42 pixels tall, with a visible focus ring against the pavement colour.",
    "Under reduced motion there is no roller, falling board, swing or typing: the sentence appears whole and the door, sign and clock simply show their new state.",
  ],
  faqs: [
    {
      question: "How does the roller paint the door?",
      answer: "The door has two colour layers. The upper one starts fully clipped away and a keyframe opens its `clip-path` from the top down. The roller is a separate element moved by a second keyframe with the same duration and easing, so the edge of the new coat stays under the sleeve all the way down.",
    },
    {
      question: "Why do the panels survive a colour change?",
      answer: "Nothing on the door face is drawn in a fixed colour except the brass. Panels, glazing beads and the gloss are highlights and shadows in translucent white and black, laid over whichever paint layer is showing.",
    },
    {
      question: "How is the sign swapped?",
      answer: "Both boards exist for a moment. The old one is keyed so it remounts with a falling animation pivoted on one chain, and the new one drops in after a short delay. When it lands the script adds a push to the pendulum, which is why the chains and board swing together and then come to rest.",
    },
    {
      question: "Can I drive it from a real prompt box?",
      answer: "Yes. Replace the display bar with your own input, and on submit call the `apply` function inside the effect with an object shaped like an entry in `edits`. Remove the `loop` call so the demo stops typing over your visitor.",
    },
    {
      question: "Does the sign keep moving for ever?",
      answer: "It gets a small random gust every few seconds, so it is rarely dead still, which costs one transform a frame. The loop pauses whenever the doorway is off screen or the tab is in the background.",
    },
  ],
  related: ["white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive", "edit-sentence-that-gathers-into-a-bead-of-wet-paint-and-falls-onto-a-lacquered-page-model", "shop-door-open-closed-enamel-sign-toggle-that-spins-on-its-chain-and-rings-a-brass-bell"],
  tags: ["edit", "prompt", "doorway", "shopfront", "paint", "sign", "small business", "demo"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
