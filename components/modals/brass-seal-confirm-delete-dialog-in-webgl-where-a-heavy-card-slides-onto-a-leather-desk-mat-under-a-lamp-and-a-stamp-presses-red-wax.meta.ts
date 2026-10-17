const meta = {
  slug: "brass-seal-confirm-delete-dialog-in-webgl-where-a-heavy-card-slides-onto-a-leather-desk-mat-under-a-lamp-and-a-stamp-presses-red-wax",
  category: "modals",
  name: "Brass Seal Confirm Delete Dialog in WebGL Where a Heavy Card Slides onto a Leather Desk Mat Under a Lamp and a Stamp Presses Red Wax",
  keyword: "react confirm delete dialog webgl",
  title: "Brass Seal Confirm Delete Dialog (React, WebGL) | We.Inc",
  description: "Free React confirm delete dialog drawn in WebGL: a letterpress card slides onto a leather desk mat and a brass seal presses red wax when you confirm.",
  intro: "A delete confirmation that feels like signing something off at a desk. A fragment shader ray-marches a heavy cotton card lying on a pebbled leather mat, with a turned brass seal and ebony handle standing beside it, all under one warm reading lamp that throws soft shadows across the leather. The question and the two choices are letterpressed into the card, so the ink sits in a shallow bite that catches the lamp. Opening the dialog deals the card up from the bottom of the frame on a spring, so it overshoots a hair and settles square. Choosing to delete lifts the seal, carries it over the dashed ring, pauses, then drives it down into a dome of red wax, which spreads, rolls up a lip and keeps a ring of beads and a saltire. The card is then filed off to the left. Keeping it slides the card back down out of view. Nothing is deleted in the demo. On a phone the card stands upright and the seal waits above it.",
  useWhen: [
    "A records, legal or archive product wants the final step before removing something permanent to feel deliberate rather than routine.",
    "You are building a portfolio or showcase page and want a dialog that is also the hero object people stop to watch.",
    "A destructive action should cost the person a short pause, and you would rather earn that pause with a ceremony than with a red warning banner.",
    "Your brand leans on paper, ink and craft, and a flat white modal would break the mood of the page around it.",
  ],
  customize: [
    "`card` at the top of the file holds every printed word: the small capitals, the question, the running text, the seal caption, both button labels and the two lines announced after a choice.",
    "`WAX` is the wax colour in linear RGB. Try `[0.02, 0.05, 0.16]` for navy sealing wax or `[0.22, 0.12, 0.01]` for an old gold.",
    "`PAPER` and `LEATHER` set the card stock and the desk mat. A lighter `LEATHER` such as `[0.12, 0.07, 0.035]` reads as tan saddle leather.",
    "The seal's journey is the `path` list: each row is a time in seconds, a position and an easing. Raise the `1.72` hold to leave the stamp in the wax longer.",
    "`motif` in the shader draws the impression. Swap the saltire for a monogram by replacing the two diagonal distances with any shape you can write as a distance.",
  ],
  accessibility: [
    "The painting is hidden from assistive technology. The dialog is a real element with `role=\"dialog\"`, `aria-modal`, the question as its label and the running text as its description, laid exactly over the printed card.",
    "Focus goes to the safe choice, Keep it, when a person opens the dialog. Tab and Shift+Tab cycle inside it, Escape keeps the ledger, and focus returns to the trigger, which carries `aria-expanded`.",
    "Both choices are announced through a polite live region, and the confirm message says plainly that the demo deleted nothing.",
    "With reduced motion the scene is drawn once and refined in place: the card appears without sliding, the wax shows its impression at once and the card leaves without travel. Without WebGL a CSS card on a leather toned stage takes its place.",
  ],
  faqs: [
    {
      question: "Does confirming actually delete anything?",
      answer: "No. The confirm button only plays the seal and announces a sentence. To wire it to your app, call your own delete function inside the `confirm` branch of `change`, ideally after the stamp has lifted so the moment is not cut short.",
    },
    {
      question: "How are the buttons clickable if the card is a shader?",
      answer: "Each frame the four corners of the card's printed face are projected through the same camera the shader uses, and a CSS matrix fitted to those corners is applied to a transparent element the size of the card. The real buttons inside it sit on the same layout that printed the ink, so they follow the card as it slides and turns.",
    },
    {
      question: "Why is Keep it focused first instead of the delete button?",
      answer: "On a destructive dialog the safe choice should be the one a stray Enter press lands on. Someone has to move focus or reach for the vermilion pill on purpose to seal it.",
    },
    {
      question: "Why does the picture sharpen a moment after it stops moving?",
      answer: "While anything moves the renderer draws one jittered sample per pixel and blends it with the last frames. Once the scene is still it keeps adding samples, shifting the lens and the pixel grid each time, which smooths the card edges, the lip of the wax and the soft shadows, then stops drawing altogether.",
    },
    {
      question: "Is it expensive to run?",
      answer: "The march starts at a ceiling just above the tallest point of the seal and stops at the desk, the canvas is held to about 1.3 million pixels, and it drops its own resolution if frames run long. It pauses when scrolled away or when the tab is hidden.",
    },
  ],
  related: [
    "wax-seal-button-that-a-brass-stamp-presses-into-molten-wax-on-an-envelope",
    "ray-marched-smoked-glass-dialog-lowered-on-steel-wires-that-sways-settles-and-frosts-the-fashion-print-behind-it",
    "velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway",
  ],
  tags: ["modal", "dialog", "confirm", "delete", "wax seal", "webgl", "ray marching", "letterpress"],
  height: 720,
  interactive: true,
  section: true,
};

export default meta;
