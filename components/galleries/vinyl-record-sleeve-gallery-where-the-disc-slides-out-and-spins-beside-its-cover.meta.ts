const meta = {
  slug: "vinyl-record-sleeve-gallery-where-the-disc-slides-out-and-spins-beside-its-cover",
  category: "galleries",
  name: "Vinyl Record Sleeve Gallery Where the Disc Slides out and Spins Beside Its Cover",
  keyword: "react vinyl record album carousel",
  title: "React Vinyl Record Album Carousel in 3D | We.Inc",
  description: "Album gallery of thick record sleeves in 3D: the black disc slides out of the front cover and spins beside it. Free React and Tailwind code, or HTML.",
  intro: "Four square record sleeves lean in a short stack on a bone coloured stage, turned a little so you can see the mouth of the front one. The front sleeve is a real box nine pixels deep with a photograph laminated on its face, a tinted spine and pale board on its edges, and the ones behind it are fanned out so a strip of each cover shows. Shortly after load the black disc slides out of the mouth on a spring, overshoots slightly and settles half way, with the shadow of the cover falling across its grooves. Its paper label then turns once every 1.8 seconds, which is 33 rpm, while the streaks of light on the vinyl hold still. Stepping forward tucks the disc away, swings the front sleeve round to the back of the stack and brings the next cover up. On a phone the whole scene shrinks as one object, so the stack never reflows.",
  useWhen: [
    "A label, record shop or musician page wants releases shown as objects you could pick up, with the artwork doing the talking.",
    "You have three to six square images that deserve a slow, one at a time presentation instead of a grid.",
    "A podcast or mix series needs a cover browser where each episode has its own artwork and a short title.",
    "A portfolio wants a single hero object on a quiet background with no headline competing for attention.",
  ],
  customize: [
    "Edit the `records` array. `src` is the square cover, `tone` is both the spine colour and the fill shown before the picture loads, and `label` with `ink` colour the paper label on the disc.",
    "`S` is the sleeve edge, `T` its thickness and `D` the disc diameter, all in design pixels. Keep `D` about twenty less than `S` so the disc hides fully inside.",
    "`OUT` is how far the disc travels. 214 shows a little over half of it. Push it to 300 and widen `SCENE_W` if you want the label fully clear of the cover.",
    "The resting angle of the stack is the `-19` and `5` inside the two `useTransform` calls. The numbers multiplied by the pointer position beside them set how far it leans toward the cursor.",
    "The stage is `bg-[#e4dfd3]` plus one radial gradient. For a dark room, change both and swap the caption and button colours from neutral-900 to white.",
  ],
  accessibility: [
    "The front cover is a real button with `aria-pressed`, so Enter or Space slides the disc out or back, and its label names the record and says which of the two will happen.",
    "Covers further back are taken out of the tab order and hidden from assistive technology with empty alt text, which means each photograph is announced only when it is at the front.",
    "Left and right arrow keys step through the stack from anywhere inside the group, the two round buttons do the same, and the counter in the corner is a polite live region.",
    "With reduced motion the timer never starts, the label does not turn, the idle sway is removed and a step swaps covers without the swing.",
  ],
  faqs: [
    {
      question: "How is the vinyl drawn without an image?",
      answer: "It is five stacked gradients on a black circle. A repeating radial gradient makes the fine grooves, a second radial gradient paints the smooth rings between tracks, and two conic gradients add the pairs of bright wedges you see on a real pressing. The paper label and spindle hole sit on top.",
    },
    {
      question: "Why does only the label rotate?",
      answer: "A record is symmetrical around its centre, so when it spins the reflections stay where the lamp put them and only printed things move. Rotating the whole disc would drag the highlights round with it and make it look like a sticker. The label has text at four points so the turning is easy to read.",
    },
    {
      question: "What stops the disc showing through the cover?",
      answer: "Nothing is masked. The front sleeve is built from separate faces in a `preserve-3d` box, with the cover nine pixels in front of the back board and the disc travelling on a plane between them. The browser sorts them by depth, so the cover hides the disc exactly as card would.",
    },
    {
      question: "How does the front sleeve get to the back of the stack?",
      answer: "Every sleeve has a slot number, and its resting offset comes from that slot multiplied by the four `FAN` constants. The one sleeve whose slot wraps round is given a three point keyframe path that first carries it out to the left and down, then in behind the others. The rest move up one place on a spring.",
    },
    {
      question: "Can I stop it advancing by itself?",
      answer: "Yes. Remove the `setInterval` line, or raise `HOLD_MS`. The timer already waits while the pointer is over the stage, while anything inside has keyboard focus and while the browser tab is hidden.",
    },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre"],
  tags: ["vinyl", "record", "album", "carousel", "3d", "sleeve", "music"],
  height: 656,
  section: true,
  interactive: true,
};

export default meta;
