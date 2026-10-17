const meta = {
  slug: "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube",
  category: "originals",
  name: "Publish Button That Fires a Rolled-Up Site up a Glass Pneumatic Tube",
  keyword: "publish button animation react",
  title: "React Publish Button Animation: Pneumatic Tube | We.Inc",
  description: "Publish button on a steel station: press the key and a carrier holding a rolled-up page shoots up a glass tube to a Live lamp. Free React and HTML code.",
  intro: "A publish control built as a pneumatic tube station on a dark wall. A clear carrier with blue rubber ends floats on its air cushion inside a glass tube, and through its sleeve you can see the page it holds: a print of the site, rolled up, photograph outward. Under the tube is a steel station with one thick blue key marked Publish and an air gauge. Press the key and it sinks into its slot, the carrier dips, then leaves up the tube and out of the frame with a rush of air behind it. Light rings in the tube collars flash in turn as it passes, the gauge needle drops and swings, and the lamp plate marked Live comes on and stays on. A moment later the next draft rises from the station into the tube. The station is 300 pixels wide and the tube is centred on it, so the piece fits a phone without changes.",
  useWhen: [
    "A site or app builder wants its publish moment to feel like sending something away, not saving a form.",
    "A product page explains going live and needs one object that shows before, during and after.",
    "A deploy, send or submit action is rare and important enough to deserve a control with travel.",
    "An email or newsletter tool wants a send button that carries the thing being sent.",
  ],
  customize: [
    "`drafts` lists the pages that take turns in the carrier. Each has a photograph, a `paper` colour for the strip under it, an `ink` colour and a `name` for the status line.",
    "`BLUE` colours the key, the rubber ends, the collar lights and the lamp. The darker blues in `RUBBER` and in the key gradient need the same hue shift.",
    "`RELOAD` is the pause before the next carrier rises, and `EVERY` is how often the demo presses the key. The demo holds off for seven seconds after a real press.",
    "The launch is the `exit` on the carrier: `y: [0, 9, -1150]` is rest, dip and flight. A larger second value gives a heavier wind-up, and a longer `duration` a lazier tube.",
    "Call your own publish function at the top of `fire`. To hold the carrier until a request finishes, set `busy` back to false from your callback and remove the timer that does it.",
  ],
  accessibility: [
    "The key is a real `button` labelled Publish. While a carrier is in flight it is marked `aria-disabled` and ignores presses, but it keeps focus.",
    "The status line under the key is a polite live region: it reads which draft is waiting and then that the site is live.",
    "The Publish label is near black on blue, which passes contrast, where white on the same blue would not.",
    "With reduced motion the carrier fades out and the next fades in, the air streaks and collar flashes are skipped, and nothing presses the key for you.",
  ],
  faqs: [
    {
      question: "Is the glass drawn on a canvas?",
      answer: "No, everything is layered gradients on ordinary elements. Glass on a dark wall is almost invisible apart from its reflections, so the tube is two faint edge bands behind the carrier and four vertical highlights in front of it. Putting the highlights in a layer above the carrier is what places it inside the tube.",
    },
    {
      question: "How does the carrier leave and a new one arrive?",
      answer: "The carrier is keyed by the number of sends inside `AnimatePresence`. Raising the count makes the old one run its exit keyframes while the new one starts below the tube, where the station hides it, and springs up after `RELOAD` milliseconds.",
    },
    {
      question: "Can the launch wait for my server?",
      answer: "Yes. Start your request in `fire`, keep `busy` true while it runs, and only raise `sent` when it succeeds. Until then the key stays down and the carrier keeps floating, which reads as pressure building.",
    },
    {
      question: "Why does the key have two layers?",
      answer: "The lower span is the side wall and never moves. The cap above it is seven pixels shorter and slides down by seven pixels when pressed, so the wall disappears into the slot. That is all the depth there is, and it is enough.",
    },
    {
      question: "What makes the page look rolled?",
      answer: "A flat picture with an oval border radius, and one horizontal gradient over it that is dark at both sides and bright a third of the way across. A hairline near the right side stands in for the loose edge of the sheet.",
    },
  ],
  related: ["three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page", "round-blue-enamel-wall-plaque-unveiled-from-under-a-linen-cloth-whose-corner-is-carried-across-to-the-other-peg-and-left-hanging-in-folds", "satin-opening-ribbon-on-brass-posts-that-brass-scissors-cut-so-both-halves-flutter-down-and-the-page-goes-live"],
  tags: ["publish", "button", "pneumatic tube", "launch", "glass", "skeuomorphic", "send"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
