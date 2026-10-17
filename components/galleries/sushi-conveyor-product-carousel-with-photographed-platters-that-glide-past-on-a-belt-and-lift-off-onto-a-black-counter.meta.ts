const meta = {
  slug: "sushi-conveyor-product-carousel-with-photographed-platters-that-glide-past-on-a-belt-and-lift-off-onto-a-black-counter",
  category: "galleries",
  name: "Sushi Conveyor Product Carousel with Photographed Platters That Glide past on a Belt and Lift off onto a Black Counter",
  keyword: "react conveyor belt product carousel",
  title: "React Conveyor Belt Product Carousel | We.Inc",
  description: "Product carousel built as a sushi bar: photographed platters glide past on a belt and the one you tap lifts off onto the counter. Free React and HTML code.",
  intro: "A sushi counter at night, drawn almost entirely in black. Seven real photographs of platters, each shot on a black background so the pictures have no visible edge, travel right to left along a slatted belt behind a steel rail and a thin line of amber light. One platter sits large on the counter in front with a cream tent card beside it giving its name, what is on it and the price. Tap any plate on the belt and it rises over the rail, grows and settles on the counter while the last one goes back to its empty place in the queue. You can also drag or flick the belt. On a phone the counter plate fills the width and the card moves underneath it.",
  useWhen: [
    "A sushi bar, bakery counter or deli wants its menu to pass by the way the food does in the room.",
    "A shop has a short range of hero products photographed on a plain dark background and wants one shown large with the rest in view.",
    "You need an auto-advancing carousel where the next item is chosen by the visitor from what is going past, not by an arrow.",
    "A dark landing page needs one rich, moving object and almost no copy.",
  ],
  customize: [
    "Edit the `plates` array. `box` holds the left, top, right and front edge of the food inside its square picture as fractions, and is what lines every plate up on the belt and the counter. Photographs must be on pure black, or their square edges will show.",
    "`BELT_SPEED` is pixels a second, `BELT_SCALE` is how small a plate is on the belt compared with the counter, and `HOLD_MS` is how long the self-running demo leaves each plate out.",
    "`LIFT_STIFF` and `LIFT_DAMP` shape the hop over the rail. The height of the arc is the `0.1` multiplied by the plate size in the frame loop.",
    "The amber strip is three elements placed from `railTop`: change the `rgba(255,176,92,...)` values for another light colour, or delete them for a plain steel edge.",
    "Card wording is in the JSX: the `Take this plate` and `On your tab` labels, and the two mono captions at the top of the stage.",
  ],
  accessibility: [
    "Each platter is a button with `aria-pressed` and a label that says either that it is on the counter or that pressing will lift it off the belt, so the whole carousel works from the Tab key and Enter.",
    "The tent card text is a polite live region, and the tab total in the corner is another, so a change of plate and a change of order are both announced.",
    "Every photograph has its own alt text. The faint mirrored copy under the counter plate is decorative and hidden.",
    "With reduced motion the belt stands still, nothing swaps by itself and a chosen plate appears on the counter without the hop.",
  ],
  faqs: [
    {
      question: "How do the photos sit on the belt with no cut-out images?",
      answer: "The stage is pure black and so is the background of every photograph, so there is nothing to cut out. Plates on the belt use `mix-blend-mode: lighten`, which lets one picture's black corner pass over its neighbour without covering it. The plate on the counter switches to normal blending with a soft elliptical mask so the rail cannot show through the food.",
    },
    {
      question: "Where does a plate go back to?",
      answer: "Each plate owns a slot on the belt for good. While it is on the counter its slot carries on round empty, and when another plate is chosen the first one flies to wherever that slot has got to. A single spring value per plate blends between the belt position and the counter position.",
    },
    {
      question: "Why does the belt never show a gap at the edges?",
      answer: "The loop length is the larger of seven plate spacings and the stage width plus one plate, and each position is wrapped with a modulo and then shifted left by a margin. A plate therefore only jumps from one end to the other while it is fully off screen.",
    },
    {
      question: "Can I flick the belt backwards?",
      answer: "Yes. A drag moves the belt one for one with the pointer and records its speed. On release that speed is kept and eased back toward `BELT_SPEED`, so a hard flick to the right runs the belt in reverse for a moment before the motor wins.",
    },
    {
      question: "Will seven large photos slow the page down?",
      answer: "They are requested at 1000 pixels wide and are mostly flat black, which compresses to very little. The frame loop only writes one transform per plate and stops when the section is off screen or the tab is hidden.",
    },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam", "pepperoni-pizza-share-picker-on-an-aluminium-pan-that-cuts-the-photograph-into-equal-slices-and-pulls-one-out"],
  tags: ["carousel", "conveyor", "sushi", "product", "photo", "drag", "dark", "food"],
  height: 783,
  section: true,
  interactive: true,
};

export default meta;
