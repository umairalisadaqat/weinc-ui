const meta = {
  slug: "vinyl-record-sleeve-testimonials-in-webgl-on-a-sunlit-shelf-where-the-chosen-record-slides-half-out-and-catches-light-in-its-grooves",
  category: "testimonials",
  name: "Vinyl Record Sleeve Testimonials in WebGL on a Sunlit Shelf Where the Chosen Record Slides Half Out and Catches Light in Its Grooves",
  keyword: "record sleeve testimonial section react",
  title: "React Record Sleeve Testimonials in WebGL | We.Inc",
  description: "Free testimonial section in WebGL: three record sleeves lean on a sunlit oak shelf, and the chosen one lifts its black disc half out beside a large quote.",
  intro: "Three square record sleeves, each printed with a portrait, lean against a limewashed wall on an oak shelf while afternoon sun falls through a four-pane window. Pick a sleeve and its black disc rides up out of the top on a spring, overshoots a little and settles half out, while the sleeve rocks off the wall from the tug and taps back. The disc has a paper label with the speaker's name, smooth bands between tracks, and grooves that pull the sunlight into a thin streak along the radius, the way a real record does when you tilt it toward a window. Everything in the room is traced per pixel in one fragment shader with four samples per pixel, so the sleeve corners and the disc rim stay clean. The quote sits on the wall as large serif type, ordinary HTML multiplied into the picture. On phones the quote moves above the shelf and the three sleeves fill the width; without WebGL 2 a flat version with the same photos and text is shown.",
  useWhen: [
    "A music school, a label, a recording studio or a record shop wants client quotes that feel like part of its world.",
    "You have exactly three strong quotes and a square image for each, and want them read one at a time at headline size.",
    "A landing page has warm, editorial photography and needs one section with real depth and light rather than another row of cards.",
    "You want a testimonial block that rewards a click with something physical without loading a 3D library.",
  ],
  customize: [
    "Edit the `records` array: `quote`, `name`, `role`, the cover `src` and its `alt`, `tone` for the colour shown while the photo loads and `label` for the disc label colour.",
    "`SLIDE` is how far the record rises, in metres; 0.158 is exactly half of a 12 inch disc. `SLIDE_PULL` and `SLIDE_DRAG` shape the spring, and `TIP_KICK` is how hard the sleeve rocks away from the wall.",
    "Wall, shelf and light colours are the `WALL`, `OAK`, `SUN` and `AMB` constants at the top of the fragment shader, written as linear colour. The window shape is in the `gobo` function.",
    "`LEANS`, `YAWS` and `XS` set each sleeve's lean against the wall, its slight turn and its place along the shelf.",
    "Change `KICKER` for the small line above the quote and the `64` (desktop) and `36` (phone) font sizes in `QuoteBody`.",
  ],
  accessibility: [
    "The quote, name and role are real text inside `figure`, `blockquote` and `figcaption`, in a polite live region that also gives a short description of the cover photo.",
    "Each sleeve has a transparent button laid over it with a spoken label and `aria-pressed`, the round buttons at the bottom do the same, and the left and right arrow keys move between records when the stage has focus.",
    "With reduced motion the disc does not slide and the sleeve does not rock: the chosen record is drawn already out, once. Automatic changes pause while the pointer or focus is inside the section.",
  ],
  faqs: [
    { question: "How is the light streak in the grooves made?", answer: "The grooves are not modelled one by one. For each point on the disc the shader takes the direction the groove runs, which is a circle round the centre, and uses a hair-style anisotropic highlight: brightness depends on how close that groove direction is to being square to the half vector between the sun and the eye. Along one radius that holds true, so the light gathers into a thin bright line, while the smooth bands between tracks reflect the window like a mirror instead." },
    { question: "Is there any 3D model or library?", answer: "No. One full-screen fragment shader intersects every ray with the wall plane, a box for the shelf, three thin boxes for the sleeves and a flat disc for each record. Shadows are found by firing two jittered rays toward the sun through the same shapes, which gives the soft edge you see where a sleeve stands off the wall." },
    { question: "Why do the edges look so clean?", answer: "Each pixel is traced four times on a rotated grid and the results are averaged after tone mapping. If the browser cannot keep up, the loop measures its own frame times and drops to one sample, then lowers the render size, rather than stuttering." },
    { question: "How do clicks find the right sleeve inside a canvas?", answer: "After each frame the code projects the corners of every sleeve, plus the part of its record that is out, through the same camera the shader uses and moves a transparent button over that rectangle. That keeps clicking, tabbing and screen readers working with no hit testing inside WebGL." },
    { question: "Can I add a fourth record?", answer: "The shader is written for three sleeves to keep the loops short. To add one, raise the array sizes in the shader from 3 to 4, add a value to `XS`, `LEANS` and `YAWS`, and widen the shelf view by raising the `needW` values in the draw function." },
    { question: "Does it keep running when nobody can see it?", answer: "No. An intersection observer stops the animation loop as soon as the section leaves the screen and starts it again when it returns, and the canvas is capped at about 1.1 million pixels." },
  ],
  related: [
    "framed-portrait-testimonials-in-webgl-with-a-leaning-two-sided-frame-that-swings-on-its-corner-and-claps-back-onto-a-sunlit-wall",
    "vinyl-record-sleeve-gallery-where-the-disc-slides-out-and-spins-beside-its-cover",
    "rotary-card-file-testimonials-with-typed-quote-cards-that-tip-over-the-spindle-and-land-with-a-bounce",
  ],
  tags: ["testimonials", "webgl", "vinyl", "record", "shadows", "physics", "editorial", "photography"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
