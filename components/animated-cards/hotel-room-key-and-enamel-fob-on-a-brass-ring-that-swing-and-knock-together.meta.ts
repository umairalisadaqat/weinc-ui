const meta = {
  slug: "hotel-room-key-and-enamel-fob-on-a-brass-ring-that-swing-and-knock-together",
  category: "animated-cards",
  name: "Hotel Room Key and Enamel Fob on a Brass Ring That Swing and Knock Together",
  keyword: "react pendulum physics component",
  title: "React Pendulum Physics Component: Key and Fob | We.Inc",
  description: "Pendulum piece with a brass room key and an enamel fob on one ring: they swing at their own speeds and knock when they meet. Free React and HTML code.",
  intro: "A room key on a hook in a hotel that still hands out keys. A brass cup hook is screwed into dark green boards under an engraved number plate. A split ring hangs in the hook, and on the ring sit two things: an oval fob with a brass rim and an oxblood enamel face carrying the room number in gold, and the key itself with a round bow, a collar and a cut bit. They are two separate pendulums of different length and weight, so after a flick the short key chatters quickly while the fob swings slow, and each time they meet they knock and part. You can drag either one. The brass rim and the shine on the enamel stay lit from the same lamp while the pieces turn. Phones get the same scene scaled down as a whole.",
  useWhen: [
    "A hotel, guest house or holiday let wants the booking page to open on an object guests will actually hold.",
    "You are building a rooms list and want the selected room shown as a key on its hook instead of a highlighted row.",
    "A sign in, access or members page could use a small, wordless picture of being let in.",
    "You want a physics toy with two bodies that collide, and a single swinging card would be too plain.",
  ],
  customize: [
    "The `room` object holds `number`, `house` and `floor`. The number is used three times: on the wall plate, in gold on the fob and stamped on the bow of the key.",
    "Enamel colour is the `radial-gradient(70% 60% at 42% 34%, #b42a2c ...)` on the fob face. Try `#1f4f8a` to `#0c2244` for navy, and keep the gold text colours as they are.",
    "The wall is `bg-[#10231c]` with a `radial-gradient` over it, and the board joints come from the `repeating-linear-gradient` whose `150px` is the board width.",
    "`REST` sets the weight of each piece in its `w` value, which is the inverse of mass. Make the key lighter by raising `0.42`, or the fob heavier by lowering `0.1`, and the knock changes character.",
    "`TUCK` decides how far the key may sit behind the edge of the fob. At `1` it has to clear the brass rim completely, and nearer `0.5` it hangs half hidden.",
  ],
  accessibility: [
    "The round control in the corner is a labelled `button` that flicks the key, so the motion can be started from the keyboard without dragging anything.",
    "Room number and house name are real text on the fob, and the caption repeats them at a readable size. The hook, ring, key drawing and shadows are marked as decoration.",
    "Under reduced motion the key and fob hang at rest and no animation loop is started. Touch scrolling is only held by the fob and the key, never by the wall.",
  ],
  faqs: [
    { question: "How do the key and the fob collide?", answer: "Three spots along the key are checked against the fob's oval outline on every pass of the solver. Each spot is measured in the fob's own frame: how far down the oval it is and how far out to the side. If it is closer to the centre line than the oval allows at that height, the key and the fob are pushed apart sideways, shared out by weight. Three tests a pass is enough to stop the key swinging through the fob." },
    { question: "Why do they swing at different speeds?", answer: "A pendulum's period depends on its length. The key's weight point is 52 pixels below the ring and the fob's is 84, so the key completes a swing noticeably sooner. Because both hang from one ring that is itself free to rock on the hook, each one also tugs the other, which is where the uneven, lifelike rhythm comes from." },
    { question: "How is the ring kept rigid?", answer: "The ring is three points: the spot resting in the hook, which is pinned, and the two spots where the fob and key hang. Three fixed distances between them make a rigid triangle that can only pivot about the hook. The circle you see is drawn from those points each frame." },
    { question: "Is the key an image?", answer: "No, it is one SVG path filled with a brass gradient, plus a second gradient on the bow, a few highlight strokes and a darker copy underneath for the cut edge. You can redraw `keyPath` for a different bit or bow without touching the physics." },
    { question: "Can I hang several keys in a row?", answer: "The component is written for one hook. To make a rack, render it several times side by side at a smaller width, each with its own `room` data, since every copy keeps its own simulation and scales to the space it is given." },
  ],
  related: ["leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["physics", "pendulum", "drag", "brass", "hotel", "collision"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
