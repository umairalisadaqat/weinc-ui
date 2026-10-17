const meta = {
  slug: "concertina-fold-photo-book-carousel-that-opens-flat-at-the-centre",
  category: "galleries",
  name: "Concertina Fold Photo Book Carousel That Opens Flat at the Centre",
  keyword: "react accordion fold carousel",
  title: "React Accordion Fold Carousel: Photo Book | We.Inc",
  description: "Carousel shaped like a concertina photo book: zigzag panels stand up and the one pulled to the middle opens flat. Free React and Tailwind code, or HTML.",
  intro: "A leporello, the folded strip of card that photographers use for small editions, standing on a pale table. Nine portraits are mounted one per panel with a typed title and plate number under each. Away from the middle the panels zigzag steeply, so you see slivers of colour, shaded on the faces turned from the light and blurred slightly with distance. Whichever panel reaches the middle unfolds until it faces you square on. Pull the strip sideways and the pleats travel through the book; pull fast and the whole thing stretches flatter before it settles back. It unfolds from a closed pack on load, then advances by itself. On phones the panels are half the screen wide and the strip runs off both edges.",
  useWhen: [
    "A photographer, stylist or studio wants a short edit of six to ten portraits to feel like a printed object, not a slideshow.",
    "You want neighbouring images hinted at as strips of colour while one picture holds the attention.",
    "A lookbook or campaign page needs a centrepiece on a plain background with no heading competing with it.",
    "You need a looping carousel that never shows an end stop, because the strip is recycled as it passes.",
  ],
  customize: [
    "Edit the `prints` array to change the pictures. Each entry has a `title`, a `src`, an `alt` and a `focus` value that is used as `object-position`, so you can keep a face inside the panel.",
    "`FOLD` is how far the side panels turn, in degrees. Around 50 gives an open, lazy zigzag that shows more of each neighbour. 75 packs them into thin spines.",
    "Panel size comes from the `measure` function: `sw * 0.27` capped at `320` on wide screens and `sw * 0.54` under 640 pixels. The height is always 1.44 times the width, set in the two `calc(var(--w) * 1.44)` styles.",
    "The card stock colour is `bg-[#f4f1ea]` and the table is the `radial-gradient` on the section. For a dark table, swap both and lower the shadow strengths, which are the `rgba(40,32,20, ...)` values.",
    "The feel of a pull is the `62` (stiffness) and `11.5` (damping) in `tick`. `HOLD_MS` sets how long it rests on each print when playing by itself.",
  ],
  accessibility: [
    "The book is a single focusable group with a carousel role description. Left and right arrow keys move one panel, and two labelled buttons under it do the same for people who cannot drag.",
    "The line between the buttons is a polite live region that announces the plate number and title of the centred print. The repeated panels that make the loop seamless have empty alt text so each picture is described once.",
    "Automatic play stops while the pointer is over the section or focus is inside it. With reduced motion there is no unfolding, no idle breathing and no autoplay, and each step lands at once.",
  ],
  faqs: [
    { question: "How is the zigzag kept joined while one panel opens flat?", answer: "Every frame the code walks along the strip from left to right. Each panel gets an angle that depends on how far it is from the middle, and the next hinge is placed at the far end of the previous panel using the cosine and sine of that angle. Because each panel starts exactly where the last one ended, the strip cannot tear, however the angles change." },
    { question: "Why does the book stretch when I drag quickly?", answer: "The fold angle is reduced in proportion to the current speed, up to 30 percent. Real folded card does the same when you tug it: the pleats open before the far end starts to move. It is one line, the `stretch` value in `layout`." },
    { question: "Does it need a 3D library?", answer: "No. The panels are ordinary elements moved with `translate3d` and `rotateY` inside a parent that has `perspective`. The shading is a gradient layered over each panel whose opacity follows the sine of its angle, and the shadow on the table is a blurred gradient laid flat with `rotateX(90deg)`." },
    { question: "How many pictures can it hold?", answer: "Any number from four up. The component renders twice the number of prints so the strip can wrap round, which keeps the panel count even, and the zigzag needs an even count to alternate correctly. With more than ten pictures consider rendering each only once and stopping at the ends." },
    { question: "Can I use landscape photographs?", answer: "The panels are tall, so landscape shots are cropped hard. If your set is landscape, change the 1.44 height ratio to about 0.75 and widen the panel in `measure`. The fold maths does not care about the shape." },
  ],
  related: ["fashion-print-carousel-in-webgl-with-standing-prints-that-rock-on-their-corners-over-a-mirror-floor", "glossy-photo-print-that-peels-off-a-second-photograph-with-a-lit-curling-underside", "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies"],
  tags: ["carousel", "3d", "fold", "photo book", "drag", "spring"],
  height: 704,
  section: true,
  interactive: true,
};

export default meta;
