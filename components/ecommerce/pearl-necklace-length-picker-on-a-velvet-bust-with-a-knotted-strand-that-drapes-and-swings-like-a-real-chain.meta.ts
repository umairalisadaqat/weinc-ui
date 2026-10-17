const meta = {
  slug: "pearl-necklace-length-picker-on-a-velvet-bust-with-a-knotted-strand-that-drapes-and-swings-like-a-real-chain",
  category: "ecommerce",
  name: "Pearl Necklace Length Picker on a Velvet Bust with a Knotted Strand That Drapes and Swings Like a Real Chain",
  keyword: "necklace length selector react",
  title: "React Necklace Length Selector with Physics | We.Inc",
  description: "Length selector on a canvas: a knotted pearl strand on a velvet bust drapes under simulated gravity and swings when pulled. Free React and HTML to copy.",
  intro: "A product option control that shows the option instead of naming it. A graduated strand of pearls hangs from a jeweller's bust in black velvet, and four pills under it choose choker, princess, matinee or opera. Picking a longer size feeds more pearls round the back of the neck one at a time, and the loop sinks down the chest and swings until it comes to rest. Each pearl is a point in a small rope simulation joined to its neighbours by a fixed distance, so the curve you see is worked out and not drawn by hand. Take hold of any pearl and pull: the strand follows as far as its length allows and swings back when released. The pointer also carries the lamp, which slides the highlight across every pearl and along the velvet. On phones the caption and the pills stack under the bust and the page still scrolls vertically over the canvas.",
  useWhen: [
    "A jewellery product page sells one necklace in several lengths and buyers cannot picture forty centimetres against fifty eight.",
    "A chain, pendant or bead configurator needs a live preview of the drop before the customer adds it to the bag.",
    "A bridal or gift landing page wants a centrepiece visitors can play with while they decide.",
    "A size guide for necklaces should sit beside the buy button and not on a separate page.",
  ],
  customize: [
    "`lengths` holds each option: `label`, `size`, `price`, and `pearls` for how many show in front of the neck. The entry with the most pearls sets how long the strand is.",
    "`START` is the index of the length worn at load. The gallery picture is taken then, so pick one that fills the chest.",
    "Pearl size is the line that builds `rad`: `7.2` is the smallest radius and `4.2` is how much is added at the centre. Use `9` and `0` for a uniform strand.",
    "Nacre colour is the six stops in `pearl`. Replace them with `#f4f4f6` through `#3c3f4a` for grey pearls, or warm them toward `#f6e3b8` for golden ones.",
    "`1500` in `step` is gravity and `0.986` is how much speed survives each tick. Lower the second number to 0.96 if you want the strand to settle almost at once.",
  ],
  accessibility: [
    "The lengths are a `radiogroup` of real buttons with `role=\"radio\"` and `aria-checked`. Only the chosen one is in the tab order, and the arrow keys, Home and End move between them.",
    "The line that states the chosen length, its measurement and its price is a polite live region.",
    "The canvas and its drag layer are hidden from assistive technology, since pulling the pearls is play and changes nothing a buyer needs.",
    "With reduced motion a new length is shown already settled, the lamp only moves with the pointer and the self-running demo is off.",
  ],
  faqs: [
    {
      question: "How does the strand find its shape?",
      answer: "It is a rope simulation of the kind used in games. Every pearl remembers where it was a moment ago, which gives it a velocity, gravity pulls it down, and then eighteen passes push each neighbouring pair back to the exact distance of their two radii plus a knot. The two ends are fixed where the strand leaves the neck, and the catenary curve appears from those rules alone.",
    },
    {
      question: "How does the necklace get longer without jumping?",
      answer: "The full opera strand always exists. Pearls beyond the chosen count are parked at the neck, and the link to the next free pearl is given a fraction of its length that grows from nothing to full size. The count moves at sixteen pearls a second, so the loop pays out smoothly.",
    },
    {
      question: "Can I hang a pendant or a chain instead of pearls?",
      answer: "Yes. For a chain, set every radius to about 2 and draw a link shape in place of the `pearl` call. For a pendant, draw your shape at the middle index after the loop; the index is `MID`, and its position is in `px` and `py`.",
    },
    {
      question: "Why do the pearls look round and not like flat discs?",
      answer: "Each one has five layers: a radial body that is brightest off centre, a dark band low down where it mirrors the velvet, a pale rim under that from light bouncing back up, two faint tints of rose and green, and a soft highlight that tracks the lamp.",
    },
    {
      question: "What happens if someone drags a pearl far away?",
      answer: "The grab point is clamped to the two circles the strand can reach from either side of the neck, so the pearl stops at full stretch and the silk never lengthens.",
    },
  ],
  related: ["velvet-ring-box-with-a-sprung-hinged-lid-and-a-diamond-solitaire-that-flashes-under-a-moving-light", "heavy-glass-perfume-bottle-you-tilt-with-amber-liquid-that-stays-level-and-a-gold-stopper-that-lifts-out"],
  tags: ["jewellery", "pearls", "necklace", "physics", "canvas", "size picker", "luxury"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
