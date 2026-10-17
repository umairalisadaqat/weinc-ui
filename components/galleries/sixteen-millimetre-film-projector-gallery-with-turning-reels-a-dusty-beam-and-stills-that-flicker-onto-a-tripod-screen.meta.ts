const meta = {
  slug: "sixteen-millimetre-film-projector-gallery-with-turning-reels-a-dusty-beam-and-stills-that-flicker-onto-a-tripod-screen",
  category: "galleries",
  name: "Sixteen Millimetre Film Projector Gallery with Turning Reels, a Dusty Beam and Stills That Flicker onto a Tripod Screen",
  keyword: "react film projector gallery",
  title: "React Film Projector Gallery with Turning Reels | We.Inc",
  description: "Gallery on a canvas: a film projector with turning reels throws a dusty beam at a tripod screen where each still flickers on. Free React and HTML to copy.",
  intro: "A dark room with one machine running in it. On a walnut side table stands a sage green projector with a hammered enamel finish, glowing lamp vents, fluted knobs and a black lens barrel. Two aluminium reels turn above it at different speeds, because the full one moves less for every inch of film than the nearly empty one, and a strand of stock runs between them through two shaking loops and the gate. From the lens a cone of light crosses the room, tinted by whatever is on screen and full of drifting dust. It lands on a portable screen on a tripod, set at an angle, where the current photograph shows with a hot centre, dark corners, a faint scratch and the small jump of a worn print. Every few seconds the frame rolls up and the next still drops into place while the light spilling on the wall and floor changes colour with it. Below 700 pixels the scene is rearranged: the screen fills the top of the phone and the projector tilts up at it from underneath.",
  useWhen: [
    "A film maker, cinematographer or colourist wants to show a handful of frames from recent work with more atmosphere than a slider.",
    "A repertory cinema or film club needs a home page centrepiece that cycles through what is showing this month.",
    "A photographer is presenting a short series that was shot to look like stills from a film.",
    "A wedding or travel video studio wants a preview of scenes that plays by itself and needs no video file.",
  ],
  customize: [
    "The `stills` array is the reel. Each entry has a `title`, a `src`, an `alt` sentence and a `tone`, which is the colour painted on the screen until the photo loads and the tint mixed into the beam and the wall glow.",
    "`HOLD_MS` is how long a still stays up. The length of the roll between two stills is the 0.26 in `tick`, in seconds.",
    "`ENAMEL` holds the three shades of the projector's paint, light to dark. Try a cream set for an older machine or three greys for a studio one.",
    "`SPEED` is how fast the film runs, which sets how fast both reels and the small sprockets turn.",
    "`layoutFor` places everything: `proj` is the centre, scale and tilt of the projector, and `scr` gives the four corners of the screen as a left and right edge with a top and bottom each.",
  ],
  accessibility: [
    "The scene is one canvas hidden from assistive technology. The counter under it is a polite live region that also reads the full description of the still, so the photographs are not lost to a screen reader.",
    "Two real buttons wind back and run on, and with the scene focused the arrow keys do the same. Hover or focus anywhere in the section holds the current still.",
    "With reduced motion the reels, flicker, dust and frame roll all stop. The still changes in a single step when a button or arrow key is used.",
    "Flicker is kept to about a tenth of the brightness and never flashes the whole screen, but if your audience is sensitive to it, set `fl` to 1 in `draw`.",
  ],
  faqs: [
    {
      question: "How is the photo drawn at an angle on a flat canvas?",
      answer: "The screen is a four cornered shape whose right edge is taller than its left. The photograph is cut into 72 upright slices and each slice is stretched to the height the screen has at that point. Across a few hundred pixels that reads as a surface turned away from you, with no 3D library.",
    },
    {
      question: "Why do the two reels turn at different speeds?",
      answer: "Film leaves one reel and arrives on the other at the same speed, so a reel's turning rate is that speed divided by the radius of the film wound on it. As the gallery advances, the feed reel empties and speeds up while the take-up reel fills and slows down. After the last still both ease back to the start.",
    },
    {
      question: "Do the photos need to allow cross origin use?",
      answer: "No. The canvas only draws them and never reads pixels back, so ordinary image addresses work. They are loaded with `new Image()` as soon as the component mounts, which means the first still is on screen without waiting for lazy loading.",
    },
    {
      question: "Can I show video instead of stills?",
      answer: "Yes. Create a muted, looping `video` element in the effect and pass it to `drawImage` in the `frame` function in place of the image, using `videoWidth` and `videoHeight` for the crop. The slices, flicker and beam work the same way.",
    },
    {
      question: "What does it cost per frame?",
      answer: "The room, table and projector body are painted once into two off-screen canvases. A frame then copies those, draws the 72 slices, two reels, about seventy dust motes and a few gradients. Drawing stops when the section leaves the viewport or the tab is hidden.",
    },
  ],
  related: ["slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam", "film-clapperboard-call-to-action-with-sticks-that-snap-shut-chalked-scene-details-and-a-running-timecode-countdown"],
  tags: ["film projector", "gallery", "canvas", "cinema", "reels", "light beam", "photography"],
  height: 750,
  section: true,
  interactive: true,
};

export default meta;
