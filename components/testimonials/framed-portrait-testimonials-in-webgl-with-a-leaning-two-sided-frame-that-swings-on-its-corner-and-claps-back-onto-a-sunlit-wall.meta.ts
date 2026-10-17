const meta = {
  slug: "framed-portrait-testimonials-in-webgl-with-a-leaning-two-sided-frame-that-swings-on-its-corner-and-claps-back-onto-a-sunlit-wall",
  category: "testimonials",
  name: "Framed Portrait Testimonials in WebGL with a Leaning Two-Sided Frame That Swings on Its Corner and Claps Back onto a Sunlit Wall",
  keyword: "webgl testimonial section react",
  title: "React WebGL Testimonial Section with a Framed Portrait | We.Inc",
  description: "Free testimonial section in raw WebGL: a framed portrait leans on a sunlit wall beside a huge quote, and swings round like a door to show the next speaker.",
  intro: "A large walnut frame with a bevelled mount leans against an apricot plaster wall on a terracotta tile floor, and the quote is set very large on the wall beside it. The room is drawn in raw WebGL 2 with a real camera: sun comes through a window with glazing bars and a branch outside, the frame throws a wedge of soft shadow that widens toward the floor, the tiles mirror the wall and the picture, and the glass picks up the window as it turns. The frame has a portrait on both sides. To change speaker it stands up, pivots on one bottom corner like a heavy door, drops back and knocks against the wall twice before it settles, while the sun moves to a new place for that person. The quote is ordinary page text, placed on the wall with a CSS matrix and multiplied into the picture, so shade falls across the letters. On phones the quote sits on the wall above the frame, and without WebGL a flat version with the same content takes over.",
  useWhen: [
    "A studio, agency or consultancy has three to six client quotes and a good portrait of each person, and wants them to carry a whole screen.",
    "The landing page is warm and editorial and a grid of small review cards would look out of place.",
    "You want each quote read one at a time, at headline size, with the speaker's face next to it.",
    "You need depth, reflections and soft shadows in a section without adding three.js or any other rendering library.",
  ],
  customize: [
    "Edit the `voices` array for the quote, name, role and photo of each speaker. `focus` is the crop centre from 0 to 1 and `tone` is the colour shown in the mount while the photo loads. Keep quotes under about 70 characters so they stay at four lines.",
    "Each entry in `suns` belongs to the speaker with the same position: `dir` points at the sun, `col` and `power` set its colour and strength, `leaf` is how much branch shade there is and `aim` is where the window light lands on the wall.",
    "Wall, floor and frame colours are the `WALLC`, `TILE` and `WOOD` constants at the top of the fragment shader, as linear colour. `AMB` is the cool fill light in the shadows. Change `INK` for the colour of the lettering.",
    "`SWING` and `SWING_DRAG` set how fast the frame travels and `BOUNCE` how much of its speed survives each knock on the wall. `HOLD_MS` is the pause before it turns by itself.",
    "`MASTHEAD` and `KICKER` are the wordmark and the small label above the quote. The quote size is the `66` (desktop) and `39` (phone) in `QuoteBody`.",
  ],
  accessibility: [
    "The quote, name and role are real text in a `figure` with a `blockquote` and `figcaption`, inside a polite live region, so every change of speaker is read out once together with a description of the portrait.",
    "The stage is a single focusable carousel group: left and right arrow keys turn the frame, and the two round buttons do the same with spoken labels. The canvas itself is hidden from assistive technology.",
    "With reduced motion the frame does not swing, the camera and the leaf shade hold still and a new speaker is drawn as one finished frame. Automatic turning pauses while the pointer or keyboard focus is inside the section.",
  ],
  faqs: [
    { question: "Is the quote part of the WebGL picture?", answer: "No. It is normal HTML text in a positioned block. Every frame, the component projects the block's corner and its two edges through the same camera the shader uses and writes the result as a CSS `matrix3d`, so the text sits on the wall in perspective and moves with the camera. `mix-blend-mode: multiply` lets the sunlight and the shadows under it show through the ink." },
    { question: "How does the frame change from one portrait to the next?", answer: "The frame is glazed on both sides. While one side faces the room, the hidden side is given the next speaker's sheet from an array texture. The frame then pivots half a turn about its bottom corner, so the hidden side arrives facing the camera on the other half of the wall, and the quote moves to the half the frame has left." },
    { question: "What makes the landing look heavy?", answer: "Three small simulations run together in `physics`. The swing is a damped spring that is stopped dead at the wall. The lean starts almost balanced, so it falls slowly and then quickly, and each time the top edge reaches the wall it rebounds with a fraction of its speed. The free bottom corner is lifted during the turn and bounces once when it lands." },
    { question: "How are the shadows and reflections made?", answer: "The frame's shadow is found by walking from each wall or floor point toward the sun through the distance field of a box, which gives an edge that is tight where the frame touches the wall and soft where it stands away. Each floor pixel sends five rays off a slightly rough mirror and tests them against the frame, the wall and the room behind the camera." },
    { question: "Will it run well on a laptop?", answer: "The canvas is capped at about 1.5 million pixels and a device pixel ratio of 1.5. The loop times its own frames and lowers the render scale in steps if too many run long, and it stops drawing when the section is scrolled out of view." },
    { question: "Can I use more than four speakers?", answer: "Yes. Add entries to `voices`; the texture array grows to match. The `suns` list is reused in order when there are more speakers than suns, so add a sun for each new person if you want every one to have a different light." },
  ],
  related: ["fashion-print-carousel-in-webgl-with-standing-prints-that-rock-on-their-corners-over-a-mirror-floor", "cork-board-testimonials-with-pinned-portrait-postcards-that-swing-unpin-and-turn-over-to-a-handwritten-note", "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce"],
  tags: ["testimonials", "webgl", "3d", "portrait", "frame", "shadows", "physics", "editorial"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
