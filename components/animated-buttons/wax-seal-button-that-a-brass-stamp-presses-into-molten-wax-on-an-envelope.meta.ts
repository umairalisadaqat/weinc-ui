const meta = {
  slug: "wax-seal-button-that-a-brass-stamp-presses-into-molten-wax-on-an-envelope",
  category: "animated-buttons",
  name: "Wax Seal Button That a Brass Stamp Presses into Molten Wax on an Envelope",
  keyword: "wax seal button react",
  title: "React Wax Seal Button with a Brass Stamp | We.Inc",
  description: "Wax seal button on a canvas: a brass stamp presses into molten red wax on an envelope and leaves your initial raised as it cools. Free React and HTML code.",
  intro: "A confirm button that is a blob of sealing wax on the flap of a cream envelope. It starts as a bright, wet bead. Press it and a brass stamp with a walnut handle comes down from above, the wax is squeezed out past the stamp into an uneven rim, and when the stamp lifts your monogram is standing in a round hollow with a raised ring round it. Over the next second the wax cools from orange-red to oxblood and its highlight goes from a sharp wet point to a wider, duller sheen. Press again and the seal warms, loses its edges and flows back into a bead, ready for another go. The wax is not an image: the bead and the stamped seal are two height maps built from your letter, blended and lit per pixel on a small canvas, with translucent thin edges, stirred streaks and a few bubbles in the rim. The envelope is 320 pixels wide on phones and half as large again from tablet width.",
  useWhen: [
    "The last step of a form deserves ceremony, such as sending a wedding invitation, signing an agreement or submitting an application.",
    "A stationery, invitation or gifting brand wants the send button to be the hero of the page.",
    "A newsletter signup is styled as posting a letter and needs a moment that marks the letter as closed.",
    "You want a two-state control whose on state is clearly different at a glance and cannot be mistaken for a hover.",
  ],
  customize: [
    "`MONOGRAM` is the character cut into the stamp. One capital letter fills the hollow best; two are squeezed to fit, so reduce the `43` in the font line to about 30 for a pair.",
    "`COOL` and `HOT` are the wax colours. `[24, 58, 44]` with `[70, 150, 96]` makes bottle green wax, `[146, 112, 40]` with `[240, 196, 90]` makes gold.",
    "`DIE` is the radius of the stamp face in CSS pixels. The brass head is the element with `inset-[28px]`; shrink or grow the two together.",
    "Replace `OPEN_NOTE` and `SEALED_NOTE` with your own two captions, or call your submit handler inside `begin` where `setSealed(true)` runs.",
    "The stamp stays down for at least `640` milliseconds. Lower it for a brisker tap, or hold the pointer and the stamp waits for you to let go.",
  ],
  accessibility: [
    "The wax, stamp and envelope are hidden from assistive tech. A real round `button` sits on the wax with a text name and `aria-pressed` that follows the sealed state.",
    "Enter and Space run the same stamp sequence as a click, and a visible focus ring is drawn on the paper round the wax.",
    "The caption is a polite live region that says whether the letter is molten or sealed and what the next press will do.",
    "With reduced motion the stamp never travels. The seal is shown finished on load and each press swaps directly between the two wax shapes.",
  ],
  faqs: [
    {
      question: "How does the wax spread outwards instead of just fading between two pictures?",
      answer: "Each shape stores, for every pixel, how far inside its own outline that pixel is. The blend interpolates that distance as well as the height, then caps the height with a rounded edge profile at the interpolated outline. The result is one continuous lump whose rim really travels outward, and its slopes are measured again from the blended heights before lighting.",
    },
    {
      question: "Why is the letter raised and not cut in?",
      answer: "A seal stamp is engraved, so the wax that fills the engraving stands proud once the stamp is lifted. The code adds your blurred letter to the floor of the hollow, plus a narrow ring just inside the wall, which is what gives the classic signet look.",
    },
    {
      question: "Can I fire my form submit when the seal is made?",
      answer: "Yes. The `begin` function is the single place where the state flips. Add your call next to `setSealed(true)`. If the request can fail, call `api.current.press()` again from your error handler to melt the seal back.",
    },
    {
      question: "Does the canvas redraw all the time?",
      answer: "It only relights when the shape, the heat or the lamp position has changed since the last frame. A cooled seal under a still pointer costs nothing but a short string comparison, and the loop stops entirely off screen or in a hidden tab.",
    },
    {
      question: "What is drawn with CSS and what with the canvas?",
      answer: "Only the wax is on the canvas. The envelope is a small inline SVG with a fibre texture filter, and the stamp is a stack of round elements with conic gradients for brass and a ringed radial gradient for the turned wood. The stamp is scaled, blurred and shifted to read as coming down from the viewer toward the paper.",
    },
  ],
  related: ["glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger", "ray-marched-anodised-aluminium-air-key-on-black-glass-with-real-travel-a-backlit-legend-and-a-light-ring-that-latches-on", "ray-traced-glass-cabochon-button-over-a-fashion-print-that-splits-colour-throws-caustics-and-drops-when-pressed"],
  tags: ["wax seal", "stamp", "canvas", "confirm", "skeuomorphic", "envelope", "material"],
  height: 800,
  interactive: true,
};

export default meta;
