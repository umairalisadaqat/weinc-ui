const meta = {
  slug: "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
  category: "galleries",
  name: "Light Table Slide Gallery with a Glass Loupe That Glides Between Mounted Transparencies",
  keyword: "react image magnifier gallery",
  title: "React Image Magnifier Gallery on a Light Table | We.Inc",
  description: "Photo gallery laid out as slides on a light table: a loupe glides between them and enlarges what lies under it. Free React and Tailwind code, or HTML.",
  intro: "The whole section is the lit top of a picture editor's light box, with a brushed frame round the edge and the soft bars of the tubes showing through the acrylic. Six mounted colour slides lie on it, each a little crooked, each printed with a lab name, a red frame number, a date and a title. On top sits an eight times loupe: clear base, knurled black barrel, polished bezel and a glass that really enlarges what is beneath it, the film and the small print on the mount alike. Left alone, the loupe wanders from slide to slide like a hand that is choosing. Move a mouse over the table and it follows the pointer with a little lag, while the neck cord swings after it. The grid is three across on wide screens and two across on phones.",
  useWhen: [
    "A photographer or picture desk wants a small edit of frames shown the way they were chosen, on a light table under a loupe.",
    "Your thumbnails are small on purpose and you want a way to look closer that is more physical than a hover zoom.",
    "A film lab, scanning service or analogue camera shop needs an opening piece that says slides without a word of copy.",
    "You have five to nine landscape images that belong together as one shoot and should be seen side by side.",
  ],
  customize: [
    "Put your pictures in the `slides` array. `no`, `date` and `title` are printed on the mount and shown in the corner, `tone` is the colour of the window before the photo arrives, and `rot`, `dx` and `dy` set how crooked each slide lies.",
    "Magnification is `ZOOM`. The glass, barrel and clear base are the diameters `LENS`, `BARREL` and `SKIRT`, so a smaller, stronger loupe is `LENS = 110` with `ZOOM = 3.4`.",
    "For portrait film swap `WIN_W` and `WIN_H`. The mount stays square, as real ones do.",
    "The order of the idle wander is the `TOUR` array of slide indexes and the pause on each is `HOLD_MS`. The glide itself is the `62` and `13.5` spring pair in `tick`; the pointer uses the stiffer `210` and `26`.",
    "The table colour is the section's `bg-[#f1f4f5]` plus the first radial gradient, and the metal frame is the stacked inset `box-shadow` on the layer above it.",
  ],
  accessibility: [
    "Every slide is a real button holding a real image with alt text. Tabbing to one, or clicking it, sends the loupe there, so the enlarged view is reachable without a pointer.",
    "The enlarged copy inside the glass is decorative and hidden from assistive technology, which means each photograph is announced once. The corner readout is a polite live region naming the slide under the loupe.",
    "On touch screens only the loupe itself captures a drag, so the table still scrolls with the page. Reduced motion stops the wandering, the hand tremor and the swinging cord, and the loupe jumps straight to the chosen slide.",
  ],
  faqs: [
    { question: "How does the glass magnify without canvas or WebGL?", answer: "Inside the round glass is a second, hidden copy of every slide on the table. That copy is scaled by `ZOOM` and shifted each frame so the point under the centre of the loupe stays in the centre of the glass. Because it is the same markup, the mount lettering is enlarged along with the photograph." },
    { question: "Does the second copy load every image twice?", answer: "No. The slide on the table uses an `img` and the copy under the glass uses the same address as a CSS background, so the browser fetches each file once and reuses it." },
    { question: "Why request photos at 640 pixels for such small windows?", answer: "The window on the table is only 128 pixels wide, but under the loupe that same picture is drawn at more than twice the size, and the whole table is scaled up again on wide screens. 640 keeps the enlarged view sharp on a dense display." },
    { question: "What draws the neck cord?", answer: "A single SVG curve from the barrel to a fixed point past the corner of the table. Its middle control point is on a loose spring, so when the loupe moves the belly of the cord arrives late and swings past before it rests." },
    { question: "How do I fit nine slides?", answer: "Add three more entries and extend `TOUR` to list all nine indexes. The grid adds a third row by itself and the section grows to hold it. On phones that becomes five rows of two, so consider whether the page can spare the height." },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "linen-archive-box-photo-gallery-whose-lid-opens-into-an-easel-for-loose-prints", "magazine-stack-gallery-that-fans-out-across-the-table-and-lifts-the-chosen-issue-to-face-you"],
  tags: ["gallery", "magnifier", "loupe", "slides", "light table", "pointer"],
  height: 722,
  section: true,
  interactive: true,
};

export default meta;
