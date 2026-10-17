const meta = {
  slug: "proof-press-with-a-steel-cylinder-that-rolls-a-typed-brief-into-a-printed-homepage",
  category: "originals",
  name: "Proof Press with a Steel Cylinder That Rolls a Typed Brief into a Printed Homepage",
  keyword: "before after reveal slider react",
  title: "React Before After Reveal Slider: Proof Press | We.Inc",
  description: "Reveal slider built as a proofing press: drag a steel cylinder down the bed and a typed brief comes out as a printed homepage. Free React and HTML to copy.",
  intro: "A flatbed proofing press seen from the operator's side. A paper ticket clamped at the head of the bed holds one typed sentence describing a surf school. Below it lies a blank sheet, and a polished cylinder rides two toothed rails over it. Everything the cylinder has passed is printed: a menu, a heavy headline, a photograph screened in blue ink, three lesson boxes and a pill button, with registration marks in the corners and an ink bar at the foot like a real proof. The strip just behind the cylinder still shines because the ink there is wet, and the knurled ends and two slots on the steel turn at the speed the carriage travels. Drag anywhere to push the carriage, or let it run by itself. On a narrow screen the press scales down whole and the button under it pulls or rolls back the proof.",
  useWhen: [
    "A homepage hero for a site builder or studio that wants to show a short brief going in and a finished page coming out.",
    "A before and after comparison where the usual vertical divider line would feel generic, such as a redesign or a rebrand.",
    "A print shop, letterpress studio or stationery brand that wants its own page pulled off a press as the opening picture.",
    "A portfolio entry where each project starts as the client's one line request.",
  ],
  customize: [
    "The `job` object holds the sentence on the ticket and every word of the printed page: `brand`, `links`, `headline`, `sub`, `cta`, `photo` and `lessons`.",
    "`BLUE` is the second ink. It colours the photograph, the button, the brand dot, the ink bar and the bearing caps, so one change re-inks the whole proof.",
    "`TILT` is the camera angle in degrees. 50 shows the cylinder as a solid object; 38 flattens the bed so the page is easier to read.",
    "`R` sets the cylinder radius. If you raise it, lower `Y0` by the same amount so the cylinder still clears the ticket at the start.",
    "The carriage weight is the `16` and `7.4` in the frame loop. Use 40 and 12 for a lighter, quicker pull.",
  ],
  accessibility: [
    "The scene is a `slider` with a 0 to 100 value and a spoken value text that says whether the sheet is blank or printed.",
    "Up and Left roll the cylinder back a tenth of the bed, Down and Right roll it on, Home and End go to either stop.",
    "The printed page stays in the document at every position, so a screen reader can read the headline and lessons before the cylinder has reached them.",
    "With reduced motion the proof is shown finished and the carriage jumps between stops with no travel.",
  ],
  faqs: [
    {
      question: "How is the page revealed as the cylinder moves?",
      answer: "The printed layer sits over the blank stock and is cut with `clip-path: inset()` whose bottom edge is a CSS variable holding the cylinder's position on the sheet. The same variable moves the carriage, the wet ink band and the contact shadow, so they cannot drift apart.",
    },
    {
      question: "Is the cylinder a 3D model?",
      answer: "No. It is one element with a fixed vertical gradient, stood up to face the camera. A real polished cylinder looks like that from the side: the bands of light and dark stay put while it turns. Rotation is shown by the knurled ends scrolling and by two machined slots that travel over the face and narrow as they reach the edge.",
    },
    {
      question: "How is the photograph printed in one colour?",
      answer: "The image is turned grey with a CSS filter and blended in `screen` mode over a block of the ink colour, which pushes every dark tone to blue. The block itself is blended in `multiply` so the white areas take the colour of the paper.",
    },
    {
      question: "Can I use it as a normal before and after slider?",
      answer: "Yes. Put the before picture where the blank stock is and the after picture inside the clipped layer. The slider value is the `value` state, from 0 to 100, if another part of the page needs it.",
    },
    {
      question: "Does dragging block page scroll on phones?",
      answer: "The scene allows horizontal panning only, so a vertical swipe that starts on the press moves the carriage. Leave some page above or below the component for the thumb to scroll by.",
    },
  ],
  related: ["pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["press", "letterpress", "reveal", "slider", "steel", "print", "originals"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
