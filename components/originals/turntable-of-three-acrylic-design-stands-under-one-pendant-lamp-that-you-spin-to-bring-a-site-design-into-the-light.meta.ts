const meta = {
  slug: "turntable-of-three-acrylic-design-stands-under-one-pendant-lamp-that-you-spin-to-bring-a-site-design-into-the-light",
  category: "originals",
  name: "Turntable of Three Acrylic Design Stands Under One Pendant Lamp That You Spin to Bring a Site Design into the Light",
  keyword: "design chooser turntable react",
  title: "React Design Chooser on a Lit Turntable | We.Inc",
  description: "Design chooser with acrylic stands, each a different design of one website, on a turntable you spin to bring one under the lamp. Free React and HTML code.",
  intro: "A chooser that sets three designs of the same homepage on a dark metal turntable as if they were scale models in a studio. Each design is a double-sided print sealed in a clear acrylic sheet and slotted into a clear block, so the two stands at the back are still readable from behind, only dimmer. One pendant lamp hangs over the front of the table: whichever stand you bring round is fully lit and the others fall into shadow as they turn away. The platter is built in real CSS perspective, it coasts when you let go of a drag and then drops into the nearest of three detents with a little overshoot. The three pills under the table do the same job for keyboards. The pages are live text and photographs for an invented surf school, in three different typefaces and palettes. On a phone the stands move closer to the spindle and the platter runs off both edges of the screen.",
  useWhen: [
    "A site builder has produced several designs from one written brief and you want the visitor to turn them round like objects before choosing.",
    "An agency pitch page presents three directions for a client and wants the unchosen two to stay in view, in shadow, instead of vanishing.",
    "A product page shows three finishes or editions of one printed thing, such as a poster, a menu or a book cover.",
    "A landing page needs one dark, quiet hero object that moves by itself and rewards a drag.",
  ],
  customize: [
    "`designs` holds the three stands: a `name` for the pill, a `note` for the line under the pills and `page`, any element drawn at 250 by 330 pixels (`PW` and `PH`).",
    "`BLUE` colours the lit edges of the acrylic, the three index dots on the rim and the dot in the active pill. The edge gradient is the `edge` string inside `Stand`.",
    "`TILT` is how far the camera looks down, in degrees. Around 8 gives a shop-window view with a thin platter; around 24 shows more of the metal face.",
    "The spring in `spinTo` and `onUp` (`stiffness: 42, damping: 9.5`) sets how the table settles. Raise the damping to 16 to remove the overshoot.",
    "`HOLD` is the rest between turns of the self-running demo, which waits nine seconds after any drag, click or key press.",
  ],
  accessibility: [
    "The pills are a `radiogroup` with roving focus: arrow keys, Home and End turn the table, and only the checked pill is a tab stop.",
    "The turntable is exposed as a single image whose label names the design at the front, and the note under the pills is a polite live region.",
    "Dragging is an extra, never the only way: every design can be reached from the pills, and vertical page scrolling still works over the table on touch screens.",
    "With reduced motion the lamp stops swaying, the demo does not run and the table jumps straight to the chosen stand.",
  ],
  faqs: [
    {
      question: "How do the stands at the back stay readable?",
      answer: "Each stand renders its page twice, once on the front and once on a face turned 180 degrees, both with `backface-visibility: hidden`. That is how a real double-sided sign holder works, so the print reads the right way round from either side.",
    },
    {
      question: "What makes the front stand look lit?",
      answer: "Every face has a near-black overlay whose opacity comes from the cosine of its angle to the viewer, computed from the table angle with `useTransform`. Facing forward the overlay is clear; side-on or turned away it reaches 80 percent. A second gradient slides a band of reflection across the acrylic as it turns.",
    },
    {
      question: "Why does the highlight on the metal not rotate with the table?",
      answer: "Because the light source does not move. The platter face with its bow-tie sheen and warm pool is a fixed layer; only the three blue dots, the spindle cap and the stands sit inside the element that rotates.",
    },
    {
      question: "Can it carry four or five stands?",
      answer: "Yes. Add entries to `designs` and change `STEP` to 90 or 72. With more stands, widen the spacing by raising the upper limit of `r` so the back row is not hidden behind the front one.",
    },
    {
      question: "How do I read the choice in my own code?",
      answer: "The `chosen` state is the index of the stand at the front. It is set in `spinTo` for pills and the demo and in `onUp` when a drag settles, so those are the two places to call your own handler.",
    },
  ],
  related: ["three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page", "white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive", "turntable-with-a-tonearm-you-lift-and-drop-onto-a-spinning-record"],
  tags: ["design picker", "turntable", "3d", "acrylic", "lamp", "chooser", "drag"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
