const meta = {
  slug: "hanging-photo-mobile-with-balanced-wire-arms-and-prints-that-turn-in-the-air",
  category: "animated-cards",
  name: "Hanging Photo Mobile with Balanced Wire Arms and Prints That Turn in the Air",
  keyword: "react hanging photo cards animation",
  title: "React Hanging Photo Cards on a Balanced Mobile | We.Inc",
  description: "Photo mobile with prints on balanced wire arms: they sway and turn on their threads, and the whole thing tips when you pull one. Free React and HTML code.",
  intro: "A ceiling mobile of four photographs in a white room. One thread comes down to a long arched wire. A large print hangs from its long end and a second wire from its short end, which carries a print and a third wire in the same way. Every arm is balanced the way a real mobile is, weight times arm length equal on both sides, so the structure rests level and tips when anything disturbs it. Pull a print down and its arm dips, the far end rises and the prints beyond it lift and swing. Let go and the movement travels back through the wires. Each print also turns slowly on its thread, darkening as it goes side on, catching a strip of glare at one angle and showing a plain card back with its title if it comes right round. Soft shadows on the wall follow all of it. On phones the mobile scales down as one object.",
  useWhen: [
    "A photographer, gallery or print shop wants a small set of images shown as objects in a room instead of tiles in a grid.",
    "A nursery, toy or interiors brand needs a header that is gentle to look at and still rewards a visitor who touches it.",
    "You have three to five images of different importance and want size and height to carry that order.",
    "An about page or a studio page needs one calm, moving centrepiece in place of a slideshow.",
  ],
  customize: [
    "Edit the `prints` array for your own pictures. `w` and `h` are the card size in design pixels, `tone` is the colour shown while the photo loads and `rest` is the angle in radians the print settles at, where `0` faces the viewer.",
    "The shape of the mobile is `ARMS`, the left and right length of each wire, plus the six calls at the end of `buildModel`, where each `rod(...)` and `card(...)` is given the length of the thread it hangs on.",
    "You do not have to rebalance by hand. The weights `m1` to `m4` are worked out from `ARMS`, starting at the lightest print, so the wires hang level whatever lengths you choose.",
    "`GRAVITY` sets how briskly things swing and `DAMPING` how long they keep going. The turning of the prints is the line that updates `s.spin`, where `0.00005` is the stiffness of the thread.",
    "The room is `bg-[#efeeea]` with a `radial-gradient`, the wire is `#17150f` and `SHADOW` moves the wall shadows.",
  ],
  accessibility: [
    "Each photograph is a real `img` with its own alt text on the front of its card, and the wires, threads and shadows are hidden from assistive technology.",
    "The corner `button` sends a breeze through the mobile, so someone using a keyboard or a switch can set it moving without a drag.",
    "With reduced motion requested the mobile hangs level with every print at its resting angle, mostly facing forward, and nothing animates. Only the prints hold touch scrolling.",
  ],
  faqs: [
    { question: "How does the mobile stay level?", answer: "Each wire is three points held in a shallow triangle: the two ends, and a pivot in the middle that sits slightly higher. The thread from above pulls the pivot up while the loads pull the ends down, and because the pivot is above the line between the ends the arm rights itself after a tilt. The weights are picked so the turning force on each side of a pivot matches." },
    { question: "Why does pulling one print move the others?", answer: "Nothing is animated directly. Eighteen points are joined by fixed length links, and after every step the solver goes through all the links 70 times, nudging each pair back to its proper distance in proportion to their weights. Drag one print and the only way the links can all be satisfied is for its arm to tip and everything on the far end to rise." },
    { question: "Are the prints really turning in 3D?", answer: "Yes. Each card is a small box made of a front, a back and two edge strips with `transform-style: preserve-3d`, turned with `rotateY` inside a scene that has CSS `perspective`. A dark overlay fades in as the card goes side on and a white band slides across at one angle to stand in for glare." },
    { question: "How many prints can it carry?", answer: "Four is what the layout is tuned for at 900 design pixels wide. A fifth works if you add another `rod` hung from the last one, but widen `W` and shorten the arms so the prints do not overlap at rest, and raise the solver passes a little if the threads start to look stretchy." },
    { question: "Will the photos flash white while loading?", answer: "No. Every picture sits in a box filled with its `tone` colour, so until the file arrives the card shows a flat panel close to the photograph's main colour, and the images are not lazy loaded because they are all on screen from the start." },
  ],
  related: ["leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling", "hotel-room-key-and-enamel-fob-on-a-brass-ring-that-swing-and-knock-together", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table"],
  tags: ["physics", "mobile", "photos", "drag", "3d", "balance"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
