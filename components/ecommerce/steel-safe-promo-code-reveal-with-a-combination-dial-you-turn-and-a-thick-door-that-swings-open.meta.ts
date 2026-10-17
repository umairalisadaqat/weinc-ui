const meta = {
  slug: "steel-safe-promo-code-reveal-with-a-combination-dial-you-turn-and-a-thick-door-that-swings-open",
  category: "ecommerce",
  name: "Steel Safe Promo Code Reveal with a Combination Dial You Turn and a Thick Door That Swings Open",
  keyword: "react promo code reveal",
  title: "React Promo Code Reveal Behind a Safe Door | We.Inc",
  description: "Promo code reveal: turn the combination dial of a steel safe to the right numbers and the thick door swings open on the code. Free React and HTML code.",
  intro: "A discount code kept in a small enamelled safe. The door carries a brass maker's plate, a hundred-mark dial with a knurled knob, three lenses and a lever handle. Dragging the dial round to each of the three numbers in the caption lights a lens; rest on the number for half a second and it counts. After the third the lever drops and the door, which has real thickness and three bolt ends in its edge, swings out towards you on a spring. Inside, under a warm lamp, are a shelf of banded notes and a dashed-edge card with the code and the offer. A button under the safe dials the combination for anyone who would rather not; once the door is open it is joined by Copy code and becomes Lock it again. Everything is built from gradients and CSS 3D transforms, with no canvas and no images. The safe is drawn at 420 pixels and scaled down to fit a phone, shifting sideways as it opens so the door stays on screen.",
  useWhen: [
    "A sale, launch or newsletter page wants visitors to earn the code with ten seconds of play before they shop.",
    "An order confirmation or loyalty screen hands over a reward and a plain grey box would waste the moment.",
    "A security, password or backup product needs a hero object that opens to show what is protected.",
    "A seasonal campaign hides a different code each week behind the same three numbers printed in an email.",
  ],
  customize: [
    "`CODE`, `OFFER` and `SMALL` are the three lines on the card. `MAKER` is the name engraved on the brass plate.",
    "`COMBO` holds the three dial numbers, each from 0 to 99. The caption, the lenses and the self-dialling button all read from it.",
    "`SWING` is the open angle of the door in degrees. 108 shows the edge and a slice of the back plate, 90 shows the edge alone.",
    "The paint is the `ENAMEL` gradient on the cabinet and the matching `linear-gradient(150deg,#445869...)` on the door. Try `#5a2f2a` to `#2a1412` for oxblood.",
    "The backdrop is `bg-[#c98a6e]` plus the radial gradient beside it on the outer element. The caption and button colours `#3a1a0f` were chosen against it, so change them together.",
  ],
  accessibility: [
    "The dial is a `role=\"slider\"` from 0 to 99. Arrow keys move one number, Page Up and Page Down move ten, and its value text says how many numbers are in and which is next.",
    "Nobody has to solve it: the button below is a normal `button` that enters the combination, and it becomes Lock it again once the door is open.",
    "While the door is shut the inside is hidden from assistive technology and the copy button is not rendered. The caption is a live region that announces the code when the door opens.",
    "With reduced motion the safe starts open with the code visible, the demo loop does not run, and locking or opening changes state without the swing.",
  ],
  faqs: [
    {
      question: "How does the door get its thickness?",
      answer: "The door is one element with `transform-style: preserve-3d` hinged on its left edge. It has three children: the front, a back plate pushed 36 pixels behind it and turned to face the other way, and a 36 pixel strip rotated 90 degrees to close the gap on the handle side. The cabinet sets the perspective, so opening is a single `rotateY`.",
    },
    {
      question: "Is the code safe from people who view the page source?",
      answer: "No, and it should not be treated as a secret. The code is a constant in the component and is in the page from the start. Use this for codes you are happy to give every visitor. For single-use codes, fetch the value from your server after the third number is entered.",
    },
    {
      question: "Why does dragging clockwise make the numbers go down?",
      answer: "Because that is how a numbered ring behaves when it turns under a fixed pointer: the marks to the left of the arrow move up into it. The arrow keys work the other way round for comfort, so Right always means a higher number.",
    },
    {
      question: "Can I skip the puzzle and open it on a click?",
      answer: "Yes. Call `enter(0)` from your own handler, which is what the button does, or set the starting state to closed and trigger it when the block scrolls into view. To open with no dialling at all, set `set` to 3 and the lever and door follow.",
    },
    {
      question: "What does the copy button do if the browser blocks the clipboard?",
      answer: "The call is wrapped so a refusal is ignored, and the code stays printed on the card and in the caption for the visitor to select by hand. The label still changes to Copied for two seconds, so swap that line if you need to report the failure.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "thread-spool-rack-colour-filter-with-cross-wound-cotton-reels-that-pay-out-thread-and-drop-a-swinging-button", "velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light"],
  tags: ["safe", "promo code", "coupon", "dial", "3d", "door", "skeuomorphic"],
  height: 790,
  section: true,
  interactive: true,
};

export default meta;
