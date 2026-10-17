const meta = {
  slug: "ray-traced-glass-ball-cursor-on-a-wire-that-turns-a-poster-portrait-upside-down-and-burns-the-lamp-to-a-point-when-knocked-to-the-wall",
  category: "cursors",
  name: "Ray-Traced Glass Ball Cursor on a Wire That Turns a Poster Portrait Upside Down and Burns the Lamp to a Point When Knocked to the Wall",
  keyword: "webgl glass ball cursor react",
  title: "Ray-Traced Glass Ball Cursor on a Wire (React, WebGL) | We.Inc",
  description: "Free React cursor effect: a solid glass ball on a steel wire follows the pointer over a poster, flips the portrait inside it and focuses the lamp on the wall.",
  intro: "A cursor made of a physical object. A pasted-up portrait poster fills the block, and a clear glass ball hangs in front of it from a hair of steel wire with a brass cap. Wherever the pointer goes the carriage above the frame runs after it and the ball is dragged along underneath, late, then swings past and settles. Every pixel of the ball is traced through the glass exactly: in at the front, out at the back, on to the wall, six times for six slices of the spectrum, so the portrait behind it appears upside down and mirrored with thin colour at its edges, and the window that lights the room shows on the surface with its glazing bars. A second pass sends a disc of lamp rays through the same ball and draws where they land, which gives the wall a ring of light with a red inner lip. Press, and the ball is pushed at the wall: the picture inside swells, turns upright as the wall comes inside the focal length, and the ring closes to one burning point before the ball knocks, bounces and swings back out. Left alone it wanders a slow figure of eight and knocks by itself now and then. On phones a tap sends the ball to your finger and knocks it, a sideways drag carries it, and vertical swipes still scroll the page.",
  useWhen: [
    "A photographer's or stylist's landing page has one strong portrait and needs visitors to play with it for a few seconds before they scroll.",
    "A magazine or lookbook cover section wants the pointer to become part of the picture instead of a ring that follows it around.",
    "You are showing off a WebGL portfolio piece and want real optics that people can check with their own hand: push the ball in and the image flips.",
    "An opticians, glassware or lens brand needs a hero that demonstrates refraction without a line of explanation.",
  ],
  customize: [
    "`PHOTO`, `PHOTO_ALT` and `FACE` swap the portrait. `FACE` is where the head sits in the photo, and the masthead is laid out to stop just short of it.",
    "`MASTHEAD` and `FOLIO` are the words printed on the poster. They are painted into the wall texture, so the ball bends them along with the photograph.",
    "`GAP` is how far the ball hangs off the wall in ball radii. At `2.75` the picture inside is upside down and a little enlarged; `4` makes it smaller and sharper, and anything under `1.5` leaves it upright.",
    "`SPREAD` sets how far red and violet separate. `0.02` is close to real crown glass, `0.075` is the showy default and `0` gives colourless glass.",
    "`LAMP` moves the light. Bring the third number down to `0.6` and the ring of light lands further from the ball and stretches into an ellipse.",
    "`REST`, `ROAM` and `KNOCK_EVERY` set where the ball waits, the figure of eight it wanders and how often it knocks without being asked.",
  ],
  accessibility: [
    "The canvas has `role=\"img\"` and a label built from `PHOTO_ALT`, so a screen reader hears what the poster shows and that a glass ball hangs in front of it.",
    "The Knock button is the keyboard route to everything the pointer does: arrow keys carry the ball while it has focus, and Space or Enter pushes it to the wall for as long as the key is held. A polite live region counts the knocks.",
    "Because the ball keeps moving, a Pause button with `aria-pressed` is always present while motion is on. Paused, the ball still goes where it is sent, one still frame at a time.",
    "With reduced motion the loop never starts. The ball sits at its resting place, jumps straight to wherever it is sent and shows the pushed-in state while a press is held.",
  ],
  faqs: [
    {
      question: "Why is the picture inside the ball upside down?",
      answer: "A solid glass ball is a strong lens with a focal length of about one and a half radii from its centre. The wall is further away than that, so rays from the top of the poster cross over inside and leave from the bottom of the ball. Nothing flips the texture in code: the shader bends each ray with Snell's law at both surfaces and looks up whatever part of the wall it reaches.",
    },
    {
      question: "What happens to the image when the ball is pushed to the wall?",
      answer: "As the wall approaches the focal distance the picture inside is magnified more and more, smears into one colour at the crossover, then comes back upright and enlarged once the wall is inside the focal length. The lamp behaves the same way from the other side, so the ring of light on the wall shrinks to a point at that moment. Both come from the geometry, not from a keyframe.",
    },
    {
      question: "How is the light on the wall behind the ball calculated?",
      answer: "A disc of about fifteen thousand lamp rays is laid over the lit half of the ball in a vertex shader, refracted in and out, and each ray is moved to the place it lands. The fragment shader compares the area each triangle of that disc covers before and after, and where the disc has been squeezed the wall receives more light. It runs six times with six refractive indices, which is why the pool has a coloured lip.",
    },
    {
      question: "Does the ball follow the pointer exactly?",
      answer: "No, and that is the point. The pointer moves a carriage on a rail above the frame through a damped spring, and the ball is a pendulum under that carriage, so it starts late, leans its wire, overshoots by a few centimetres and settles in about a second. The depth swing after a knock uses the same pendulum, with a bounce when the glass meets the wall.",
    },
    {
      question: "How does it behave on a touch screen?",
      answer: "The stage sets `touch-action: pan-y`, so a vertical swipe scrolls the page as usual. A tap sends the ball to that spot and knocks it against the wall, and a sideways drag carries it with the finger. The system cursor is hidden over the stage on desktop because the ball replaces it, and it returns over the two buttons.",
    },
    {
      question: "What does it cost to draw, and what if WebGL is missing?",
      answer: "The ball is an exact sphere, so there is no ray marching: one ray per pixel on the wall and four on the glass, capped at one and a half device pixels per CSS pixel. The loop watches its own frame times and gives up samples, then resolution, if they run long, and it stops when the block leaves the screen. Without WebGL 2 the block shows the same poster in plain layers with a glass disc that holds an inverted copy of the photograph.",
    },
  ],
  related: [
    "ray-traced-glass-cabochon-button-over-a-fashion-print-that-splits-colour-throws-caustics-and-drops-when-pressed",
    "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph",
    "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
  ],
  tags: ["cursor", "webgl", "shader", "ray tracing", "glass", "refraction", "dispersion", "caustics", "pendulum"],
  height: 700,
  interactive: true,
  section: true,
};

export default meta;
