const meta = {
  slug: "camera-lens-aperture-switch-with-iris-blades-that-stop-down-and-sharpen-the-background-of-a-portrait",
  category: "toggles",
  name: "Camera Lens Aperture Switch with Iris Blades That Stop Down and Sharpen the Background of a Portrait",
  keyword: "aperture slider react",
  title: "React Aperture Slider with Closing Iris Blades | We.Inc",
  description: "Aperture selector on a canvas: the iris blades of a camera lens close stop by stop while the background of a portrait sharpens. Free React and HTML code.",
  intro: "An eight-position selector dressed as a portrait lens standing on a dark table beside the print it made. Pick a stop and the nine steel blades inside the glass swing shut into a smaller nonagon, the knurled ring turns a notch, and the tree behind the sitter goes from a wash of pink to separate petals while she stays sharp the whole time. The scale under the lens is the real control: f/1.4 through f/16, with a caption that gives the matching shutter time. You can also drag sideways across the lens, or tap it to close down one stop. Move the pointer and the coloured coating reflections slide across the front element the way they do on real glass. On phones the print sits top left and the lens overlaps its lower corner at about half size.",
  useWhen: [
    "A photography course or camera review needs to show what the f-number does without a paragraph of explanation.",
    "A portrait studio or photographer portfolio wants an opening piece visitors can play with before they scroll to the work.",
    "A settings screen in a camera or editing app offers a background blur strength and a plain slider would feel flat.",
    "A lens rental or second-hand gear shop wants a hero object for its prime lens category.",
  ],
  customize: [
    "`stops` holds the scale. Each entry has the `f` label, a `speed`, a `note` for the caption and two opacities, `mid` and `heavy`, that set how much of each blurred copy shows.",
    "Swap the picture with `PHOTO` and `PHOTO_ALT`, then redraw `SITTER`: pairs of x and y on a 100 by 150 grid tracing the person who must stay sharp.",
    "`BLADES` sets the iris. Five gives a pentagon like an old rangefinder lens, fifteen is almost a circle.",
    "`PAINT` colours the index dot on the ring, the chosen stop and the focus ring. Try `#f4d03f` for a yellow engraving look.",
    "`ENGRAVING` is the lettering round the name ring. Keep it under about sixty characters so the ends do not meet at the bottom.",
  ],
  accessibility: [
    "The lens canvas is hidden from assistive technology. The scale below it is a `radiogroup` of eight buttons, each labelled with its f-number and carrying `aria-checked`.",
    "One radio is in the tab order at a time. Arrow keys step through the stops, Home opens the lens fully and End closes it to f/16.",
    "The caption is a polite live region that reads out the stop, the shutter time and a short description of the background.",
    "With reduced motion the demo does not run, the blades jump to the chosen opening and the blur layers swap without a fade.",
  ],
  faqs: [
    {
      question: "How does the background blur change without blurring the person?",
      answer: "The print is three copies of one photograph. The bottom copy is sharp. The two above it are blurred with a CSS filter and masked by a small inline SVG that is opaque everywhere except a feathered outline of the sitter. Choosing a stop only changes the opacity of those two layers, so the browser never has to recompute a blur while it animates.",
    },
    {
      question: "How are the iris blades drawn?",
      answer: "Each blade is the area outside one straight edge of a nine-sided polygon, filled with its own steel gradient and a soft shadow, and painted in order so each one overlaps the last. The first two are painted a second time inside a wedge so the overlap runs the same direction the whole way round. The polygon shrinks by a factor of the square root of two per stop, which is how a real diaphragm halves the light.",
    },
    {
      question: "Can I use it as a plain blur strength control for my own image?",
      answer: "Yes. Read the `stop` index, or lift it to a parent, and map it to whatever you are controlling. If your image has no single subject, delete the mask styles and the layers will blur the whole frame.",
    },
    {
      question: "Why does the shutter time change in the caption?",
      answer: "Closing the lens by one stop halves the light, so a photographer doubles the exposure time to keep the picture equally bright. The caption follows that rule from 1/4000 of a second at f/1.4 to 1/30 at f/16, which is why the print does not get darker as the blades close.",
    },
    {
      question: "Does the lens need WebGL?",
      answer: "No. It is a 2D canvas: conic gradients for the anodised metal, 300 small wedges for the knurling, clipped fills for the blades and additive radial gradients for the coating colours. Browsers without conic gradients get flat greys on the barrel and everything else unchanged.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "cast-iron-bench-vice-lock-switch-with-a-tommy-bar-that-winds-the-jaws-shut-on-an-oak-block", "chrome-stomp-footswitch-toggle-with-jewel-lamp-on-a-powder-coated-pedal"],
  tags: ["aperture", "lens", "camera", "depth of field", "canvas", "photography", "selector"],
  height: 760,
  interactive: true,
};

export default meta;
