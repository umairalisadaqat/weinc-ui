const meta = {
  slug: "slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam",
  category: "galleries",
  name: "Slide Projector Photo Carousel with a Ribbed Tray That Clicks Round and Drops Each Frame into the Beam",
  keyword: "react slideshow carousel",
  title: "React Slideshow Carousel as a Slide Projector | We.Inc",
  description: "Slideshow staged as a slide projector: click the tray round a notch and the next photo drops into the beam. Free React and Tailwind code, or HTML.",
  intro: "You are standing behind a slide projector in a darkened room. Its round tray, ticked with white index marks round the rim and packed with eighty mounts, sits in the foreground; above it one large photograph glows on the wall with rounded gate corners, a hot centre, darker edges and a hair caught in the gate that stays put from slide to slide. Advance it and the tray knocks round one notch, the picture falls out of the bottom of the frame, the wall goes black for a beat, and the next slide drops in from the top soft and snaps sharp as the lens finds focus. The colour of each picture spills back onto the wall and across the far rim of the tray. Drag the tray sideways to click through by hand. It advances by itself too, and on phones the picture takes the full width with a smaller projector beneath.",
  useWhen: [
    "A portfolio, lookbook or travel story is best seen one large landscape image at a time, with a pause between frames that feels like a ritual.",
    "An agency or studio wants its showreel stills presented as a screening and not as a row of thumbnails.",
    "The page is already dark and you want the photographs to be the only source of light on it.",
    "An event, archive or retrospective page calls for nostalgia without resorting to sepia filters.",
  ],
  customize: [
    "Edit the `slides` array: `src`, `alt`, `title`, a `focus` crop position and `tone`, the colour that picture throws onto the wall and the tray. Any number of slides works; the tray simply keeps turning.",
    "The picture is `aspect-[3/2]` inside `max-w-[720px]`. Use `aspect-[4/3]` or `aspect-square` for other film formats, and change `rounded-[18px]` to square off the gate.",
    "The drop is the spring on `y` in the `in` state (`stiffness: 330, damping: 24`) and the dark beat before it is the `delay: 0.3`. The focus pull is the `filter` transition of `0.8` seconds.",
    "How hard the tray knocks into its notch is the `420` and `19` in `tick`. Lower the first for a lazier turn. `HOLD_MS` is the time each slide stays up.",
    "Remove the hair and dust by deleting the small SVG with the `path` and two `circle` elements, and the wall grain by deleting the SVG that holds `feTurbulence`.",
  ],
  accessibility: [
    "The piece is a single focusable carousel group. Left and right arrows change the slide, and the round buttons in the two lower corners do the same for pointer and touch users.",
    "All photographs stay in the page with their alt text, and the ones waiting in the tray are marked hidden so only the projected slide is read. The caption under the picture is a polite live region with the position and title.",
    "With reduced motion there is no drop, no focus pull, no lamp flicker and no drifting dust: slides cross-fade in a fifth of a second and the tray jumps to its notch. Autoplay pauses while the pointer or keyboard focus is inside.",
  ],
  faqs: [
    { question: "How is the round tray drawn without a 3D library?", answer: "Thirteen flat discs are stacked a few pixels apart inside a `preserve-3d` group that is tipped back 63 degrees. The lower twelve overlap into the tray's wall, with a repeating conic gradient on the upper three painting the white index ticks, and the top one carries the ribbed ring of slide mounts, the numerals and the chrome lock ring." },
    { question: "How do all the discs turn together cheaply?", answer: "The script writes one CSS variable, `--a`, on the tray each frame. Every patterned layer rotates by that variable, while the shading layers above them do not, so the light stays where the lamp is and only the ticks, mounts and numbers travel." },
    { question: "Why does the new slide arrive blurred?", answer: "It copies an autofocus projector hunting for the film plane. Waiting slides sit above the frame with a ten pixel blur; when one drops in, its blur eases to zero slightly after it lands, so the picture bounces, settles and then sharpens." },
    { question: "Will dragging the tray fight with page scrolling on a phone?", answer: "No. The grab area over the tray is set to `touch-pan-y`, so vertical swipes still scroll the page and only sideways movement turns the tray. Each notch you pass changes the slide straight away." },
    { question: "Can I hide the projector and keep only the picture?", answer: "Yes. Delete the block that starts with the `zoneRef` element and keep the buttons. The drop, the dark beat, the focus pull and the colour on the wall all live in the upper block and do not depend on the tray." },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "wire-postcard-spinner-rack-photo-carousel-that-spins-with-inertia-and-shows-card-backs", "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies"],
  tags: ["carousel", "slideshow", "projector", "dark", "3d", "drag"],
  height: 815,
  section: true,
  interactive: true,
};

export default meta;
