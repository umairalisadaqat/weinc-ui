const meta = {
  slug: "ray-traced-glass-cabochon-button-over-a-fashion-print-that-splits-colour-throws-caustics-and-drops-when-pressed",
  category: "animated-buttons",
  name: "Ray-Traced Glass Cabochon Button Over a Fashion Print That Splits Colour, Throws Caustics and Drops When Pressed",
  keyword: "webgl glass button react",
  title: "React WebGL Glass Button with Caustics | We.Inc",
  description: "Glass button traced in a WebGL shader: a dome over a photo print splits colour at its rim, pools light and drops when pressed. Free React and HTML code.",
  intro: "A domed bar of solid glass, the shape jewellers call a cabochon, floating a few millimetres above a magazine print on a dark stone table. Nothing in it is a gradient pretending to be glass. A fragment shader sends a ray through every pixel, finds exactly where it meets the dome, bends it on the way in and again on the way out, and repeats that for six slices of the spectrum, so red and violet land in different places and hard edges in the photo fan out into colour. A second pass pushes a sheet of light rays from the lamp down through the same glass and draws where they land: that is the thin bright line focused on the paper, the hard shadow in front of it and the ghost of the lettering underneath. The white label sits on top of the dome. Press and the bar falls to the paper, rattles on its edges, settles, and floats back up with a small overshoot when you let go. The masthead on the print passes behind the model's head, as it would on a real cover. On a phone the camera backs away so the glass still spans most of the screen.",
  useWhen: [
    "A magazine, fashion or fragrance launch page needs one object in the first screen that people will prod before they read anything.",
    "You have a single strong photograph and one action, and a flat button on top of it would look like a sticker.",
    "A studio or portfolio wants proof on the landing page that it can write shaders, without loading a 3D library to do it.",
    "A product reveal is built around glass, lenses or optics and the call to action should belong to that world.",
  ],
  customize: [
    "`SPREAD` is the gap in bending strength between red and violet. `0` gives clean, colourless glass, `0.085` is the shipped look and `0.14` is close to cut crystal.",
    "`HOVER` is the resting height. At `0.05` the bar almost touches the print and the light under it is a wide soft band; at `0.3` the band pulls into a hard bright line.",
    "`SPOT` chooses where on the print the glass sits, as fractions across and down. Move it so the rim crosses a hard colour edge in your own photo, because that is where the spectrum shows.",
    "`TINT` is how much red, green and blue the glass swallows per unit of thickness. The default is the faint sea green of thick window glass; `[0.03, 0.03, 0.03]` is optical white.",
    "`HEAD_FROM` tells the masthead where your subject starts, as a fraction across the photo. Left of it the word always prints. Right of it the word only prints on pixels that look like the yellow wall or blue cloth, so change the two colour tests beside it for a different backdrop.",
    "`LAMP` is where the lamp stands. Lower it and the focus line stretches into a long streak; move it to the right and the shadow swings to the left end of the bar.",
  ],
  accessibility: [
    "The glass is a picture, but a real `button` with the label as its text is moved over it every frame, so Tab reaches it, Space and Enter drop and release the bar, and a white focus ring follows the outline of the glass.",
    "The canvas carries a text description of the photograph, the masthead and folio painted on the print are repeated in a visually hidden heading, and each press is announced through a polite live region.",
    "With reduced motion the scene is traced once and held still. A key or pointer press redraws it with the glass down, and letting go redraws it raised, with no travel in between.",
    "If WebGL2 is missing or the graphics context is lost, a tilted print and a layered glass pill built from ordinary elements stay on screen with the same working button and readable label.",
  ],
  faqs: [
    {
      question: "Is this ray marching or ray tracing?",
      answer: "Tracing. The dome is a capsule squashed in height and cut by a flat base, and both of those have an exact formula for where a ray meets them. That costs a few dozen multiplications where a distance-field march would loop forty times, which is what leaves room for six colours and four samples per pixel on the glass.",
    },
    {
      question: "How is the light on the paper worked out?",
      answer: "A mesh of 320 by 128 cells is laid over the top of the dome. Each corner is treated as a ray from the lamp, carried through the glass in the vertex shader and drawn where it lands on the paper. Cells that end up smaller than their own shadow would have been have gathered light, so they are drawn brighter by exactly that ratio. The mesh is drawn six times, once per slice of the spectrum, which is why the focus line has a red side and a violet side.",
    },
    {
      question: "Why does the label stay sharp when the picture under it bends?",
      answer: "It is treated as white enamel fired onto the top surface, so the camera sees it before any refraction happens. Its shadow is another matter: the light pass blocks rays that hit the lettering, so when the bar is near the paper a soft copy of the words appears below, seen through the glass.",
    },
    {
      question: "What does it cost to run?",
      answer: "Three passes a frame: the light map at 768 by 512, the scene, and a lens glow that reuses smaller copies of the frame. Measured in Chrome on an Apple M4 Pro it used a little over 3 milliseconds of graphics time per frame at 2160 by 1050. Resolution is capped at one and a half device pixels, the loop stops when the block leaves the screen or the tab is hidden, and if frames run long it first halves the samples on the glass and then lowers its resolution in steps.",
    },
    {
      question: "Can I use my own photograph?",
      answer: "Yes. Change `PHOTO` and `PHOTO_ALT`, then `SPOT` and `HEAD_FROM`. The image is drawn to a canvas before it becomes a texture, so its host has to allow cross-origin reads. If it does not, the print falls back to two flat colour fields and the glass carries on working.",
    },
    {
      question: "Does pressing it do anything besides the animation?",
      answer: "It is an ordinary button with an `onClick`, which here only counts presses for the live region. Replace that handler with your navigation or form action. The fall and the rattle are driven by pointer and key events and need no changes.",
    },
  ],
  related: ["thick-glass-pill-button-that-refracts-a-portrait-and-flattens-when-pressed", "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph", "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies"],
  tags: ["glass", "webgl", "ray tracing", "caustics", "dispersion", "button", "shader", "photo"],
  height: 700,
  interactive: true,
};

export default meta;
