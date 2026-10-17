const meta = {
  slug: "riveted-swatch-deck-photo-carousel-that-fans-portraits-round-a-brass-pin",
  category: "galleries",
  name: "Riveted Swatch Deck Photo Carousel That Fans Portraits Round a Brass Pin",
  keyword: "react fan carousel",
  title: "React Fan Carousel of Portraits on a Brass Pin | We.Inc",
  description: "Fan carousel styled as a studio swatch deck: portrait leaves pivot on a brass pin and trail each other on springs. Free React and Tailwind code, or HTML.",
  intro: "A colour guide of the kind a studio keeps for its backdrop papers, lying on a pale blue table and seen at a slight tilt. Nine long slips of card are pinned through one brass rivet at the foot. Each carries a portrait shot on that paper, a flat chip of the colour, its name and a roll code. The stacking is honest: the leaves you have already passed sit on top, pushed well to the left, and the ones still to come peek out from underneath on the right. Step forward and the open leaf swings aside while the next slides out, the looser outer leaves arriving a beat late. Gloss slides across each photo as it turns and every shadow stays on the side away from the light. After the last leaf the deck sweeps shut and reopens. On phones the deck is scaled down and the widest leaves run off the edges.",
  useWhen: [
    "You sell or show things that come in named colours, such as paint, fabric, paper or frames, and want a photo beside each one.",
    "A small set of tall images needs a compact footprint: nine pictures fit in the width of about three.",
    "A studio or stylist page wants an object from the working day as its gallery, with no heading wrapped round it.",
    "You want a carousel where the order is visible at a glance, since passed and upcoming leaves sit on opposite sides.",
  ],
  customize: [
    "The `leaves` array holds everything on a slip: `name`, `code`, the `chip` colour as a hex value, the photo and a `focus` string. The horizontal part of `focus` matters most because the crop is narrow, so set it to where the subject stands.",
    "`GAP` is how far the passed leaf is pushed clear of the open one. Lower than 30 and it starts to hide the photograph. The two other spreads are the `38` and `58` inside `angleFor`.",
    "Leaf proportions are `LW`, `LH` and `PIN`. The photo height is `h-[292px]` and the chip sits at `top-[304px]`, so move those together if you change the length.",
    "Card colour is `bg-[#fbf9f4]`, the table is `bg-[#dfe3ec]` plus the radial gradient over it, and the rivet is the brass `radial-gradient` near the end of the markup. A steel pin only needs greys in that gradient.",
    "How much the leaves trail is the `13` in the stiffness line `150 - ... * 13`. Set it to 0 and they move as one rigid fan.",
  ],
  accessibility: [
    "The deck is a focusable carousel group. Left and right arrows thumb one leaf, Home and End jump to the top and bottom of the deck, and the two buttons below are disabled at the ends so their state is announced.",
    "Each portrait has its own alt text, and the name and roll code are real text on the leaf. The line under the deck repeats them in a polite live region whenever the open leaf changes.",
    "The fan pauses on hover and on focus. With reduced motion the leaves take their places without springs, the idle sway and the pointer tilt are off, and nothing advances by itself.",
  ],
  faqs: [
    { question: "Why is the previous leaf covering a corner of the open photo?", answer: "Because that is what a pinned deck does. The leaves cannot change their stacking order, so a leaf you have passed stays above the one that is open and overlaps it near the pin. The 36 degree gap keeps that overlap to a small triangle at the foot of the photograph. If you would rather cheat, raise the `zIndex` of the active leaf." },
    { question: "How do the leaves trail behind each other?", answer: "There are two layers of spring. One moves a single number, the position of the open leaf. Every leaf then has its own spring that chases the angle it should have for that position, and leaves further from the open one get a softer spring. The result is a fan that bunches and spreads instead of turning as one piece." },
    { question: "How are the shadows kept on the correct side?", answer: "A `box-shadow` rotates with its element, which would swing the shadow round as a leaf turns. Each frame the code rotates the shadow offset by the opposite of the leaf angle, so on screen it always falls down and to the right." },
    { question: "Can I pin the deck at the top instead?", answer: "Yes. Set `PIN` to about 30, move `PY` near the top of the scene and put the label block above the photograph. The angle maths is the same, though the fan will hang downward and the open leaf reads better if you flip the sign of the spreads in `angleFor`." },
    { question: "Does dragging work on touch screens?", answer: "Sideways swipes thumb through the deck and vertical swipes are left to the page through `touch-pan-y`. Tapping any visible leaf opens it. The slight tilt that follows a mouse is not applied for touch input." },
  ],
  related: ["concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table"],
  tags: ["carousel", "fan", "swatch", "spring", "portrait", "drag"],
  height: 662,
  section: true,
  interactive: true,
};

export default meta;
