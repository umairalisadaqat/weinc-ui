const meta = {
  slug: "slr-viewfinder-photo-gallery-with-a-split-image-focusing-circle-you-line-up-before-the-shutter-fires",
  category: "galleries",
  name: "SLR Viewfinder Photo Gallery with a Split-Image Focusing Circle You Line Up Before the Shutter Fires",
  keyword: "camera viewfinder gallery react",
  title: "React Camera Viewfinder Gallery You Focus | We.Inc",
  description: "Viewfinder gallery: each photo arrives blurred, you turn the lens ring until the split circle lines up, then the shutter fires. Free React and HTML code.",
  intro: "A photo gallery you look at through the finder of a manual-focus film camera. Every picture starts soft. In the middle of the ground glass sits a split-image circle whose top and bottom halves are pushed apart sideways, inside a microprism collar that breaks the picture into a fine check. Drag the ribbed lens ring under the finder and the halves slide towards each other, the collar clears and the whole frame sharpens. Let go close to the mark and the ring drops into place, a green dot lights between two red arrows in the readout, and the chrome release fires: the mirror slaps the view black for a moment and the next frame is waiting, out of focus at a different distance. On phones the finder fills the width and the ring and release sit in one row beneath it.",
  useWhen: [
    "A photographer or film lab wants a gallery where visitors spend a few seconds with each picture instead of flicking past.",
    "A camera shop, repair bench or analogue photography blog needs an opening piece that shows what manual focusing feels like.",
    "A product launch wants a reveal that the visitor has to earn with one small action.",
    "A photography lesson explains split-image and microprism focusing screens and needs a working one on the page.",
  ],
  customize: [
    "`shots` is the roll. Each entry has a 3:2 `photo`, its `alt`, a `tone` shown while loading, the ring position where it is sharp (`focus`, from 0 to 1) and the `speed` and `stop` shown in the readout.",
    "`distances` are the numbers engraved on the ring. Swap in feet, or cut the list to five entries for a wide-angle lens.",
    "`SHARP` is how near the ring must be to count as focused. Raise it to 0.03 for an easier game, and widen the `0.05` catch distance in `onUp` to match.",
    "The size of the focusing aids is `h-[23%]` on the split circle and `h-[40%]` on the collar, both measured against the height of the ground glass.",
    "How far the halves separate is the `17%` in their two transforms. The LED colours live in the `.slrvf-led` and `.slrvf-dot` rules.",
  ],
  accessibility: [
    "The focus ring is backed by a real `input type=\"range\"` with a label, so arrow keys turn it in steps of one hundredth and a focus outline appears round the ring.",
    "The range reports `In focus` or `Out of focus` as its value text, and the line under the controls is a polite live region saying the same.",
    "The ground glass has `role=\"img\"` and the description of the current photograph. The duplicate copies used for the blur and the split circle are hidden from assistive technology.",
    "With reduced motion every frame opens already sharp, the mirror blackout is skipped and nothing plays by itself.",
  ],
  faqs: [
    {
      question: "How does the split circle work?",
      answer: "The circle holds two more copies of the photograph, one clipped to its top half and one to its bottom half, each placed so it sits exactly over the picture behind. A CSS variable carries the focus error from minus one to one, and the two halves translate in opposite directions by that amount. At zero they meet and the circle disappears into the image.",
    },
    {
      question: "Is the blur recalculated on every frame?",
      answer: "No. Two blurred copies of the photo, one light and one heavy, are stacked over the sharp one and only their opacity follows the focus error. The browser blurs each copy once when it loads and the animation is opacity and transform after that.",
    },
    {
      question: "What are the two red arrows for?",
      answer: "They are the focus aid from the readout of a late manual camera. The arrow that is lit tells you which way to turn the ring, and when both go dark and the green dot comes on the picture is sharp.",
    },
    {
      question: "Can I skip the focusing and use it as a plain slideshow?",
      answer: "Give every entry in `shots` the same `focus` value. After the first frame the ring is already on the mark, so each press of the release shows a sharp picture straight away.",
    },
    {
      question: "How is the lens ring drawn?",
      answer: "On a small 2D canvas as a cylinder seen from above. Each rubber rib and each engraved distance is placed at the sine of its angle, so they crowd together and narrow towards the left and right edges, and a horizontal gradient adds the dark limbs and one highlight.",
    },
  ],
  related: ["light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies", "slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam", "instant-camera-that-ejects-photos-you-shake-to-develop"],
  tags: ["viewfinder", "camera", "focus", "gallery", "photography", "split image", "canvas"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
