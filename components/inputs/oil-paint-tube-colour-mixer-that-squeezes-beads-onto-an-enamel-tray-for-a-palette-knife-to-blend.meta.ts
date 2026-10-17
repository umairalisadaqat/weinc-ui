const meta = {
  slug: "oil-paint-tube-colour-mixer-that-squeezes-beads-onto-an-enamel-tray-for-a-palette-knife-to-blend",
  category: "inputs",
  name: "Oil Paint Tube Colour Mixer That Squeezes Beads onto an Enamel Tray for a Palette Knife to Blend",
  keyword: "paint mixing colour picker react",
  title: "React Colour Picker That Mixes Oil Paint | We.Inc",
  description: "Colour mixer on a canvas: squeeze a wet bead from a paint tube onto an enamel tray, then drag the palette knife through to blend. Free React and HTML code.",
  intro: "A colour input that works the way a painter's table does. Five crimped aluminium tubes lie beside a white enamel butcher tray. Press one and it lifts, lays a glossy worm of oil paint on the tray and goes back to its place, after which a palette knife comes in and spirals the fresh bead into the pile. The paint is a small simulation, not a picture: every cell of the tray stores how much of each pigment sits on it, the surface is lit from its own thickness so ridges shine and cast shadows, and the knife carries paint along its blade and leaves streaks behind. You can also drag the knife yourself. The chosen colour is the mix of every part squeezed so far, shown as a hex value with its recipe under the tray. On phones the tubes move to a row across the top and the tray fills the width.",
  useWhen: [
    "A theme or brand colour step in an onboarding flow where choosing by recipe feels friendlier than a hue wheel.",
    "An art supplies shop, a painting course or a studio site that wants a working object on the page instead of a banner.",
    "A children's or education product that teaches what two pigments make when they meet.",
    "A portfolio or agency homepage that needs one tactile toy visitors remember.",
  ],
  customize: [
    "`tubes` at the top lists each paint: `name` is printed on the label, `rgb` is the pigment and `strength` is how strongly it tints a mix. Five entries fit the layout; with four, the gaps simply stay.",
    "`START` is the recipe on the tray at load, one number per tube. Set it to all zeros to begin with clean enamel.",
    "`MAX_PARTS` caps the number of squeezes before the tray reports that it is full.",
    "Paint gloss is the `215` multiplier on the highlight inside `shade`, and relief is `S = 2.7`. Lower both for a matte gouache look.",
    "The stage is `bg-[#15120e]` with a radial gradient on the outer element. Any dark, slightly warm colour keeps the aluminium reading as metal.",
  ],
  accessibility: [
    "Each tube is a real button with a label such as \"Squeeze Ultramarine. 1 part on the tray\", so the control works without ever seeing or dragging the canvas.",
    "The hex value and recipe sit in an `output` element. It stays silent while the demo runs and becomes a polite live region after the first press.",
    "Dragging the knife is decoration only: it rearranges paint but never changes the value, so keyboard and switch users miss nothing.",
    "With reduced motion the tube and knife do not travel. The tray is repainted in its finished, blended state straight away.",
  ],
  faqs: [
    {
      question: "Why does yellow plus blue give green here when ordinary colour blending gives grey?",
      answer: "Averaging red, green and blue channels models coloured light. Paint works by absorbing light, so the mixer multiplies instead: it takes a weighted geometric mean of the pigments, which is `mixOf` in the code. Yellow keeps red and green, blue keeps a little green and blue, and what survives both is green.",
    },
    {
      question: "How do I get the mixed colour into my own form?",
      answer: "The `parts` state holds the recipe and `mixOf(parts)` returns the red, green and blue numbers. Pass `hexOf(mix)` to a hidden input or lift `parts` into a parent component with a callback from `squeeze` and `clean`.",
    },
    {
      question: "Is the paint on the tray a video or an image sequence?",
      answer: "Neither. It is five arrays of thickness values, one per pigment. Squeezing writes round stamps along a short path, and the knife is a row of sample points that swap paint with the cells beneath them. Only the patch that changed is re-lit each frame.",
    },
    {
      question: "Will it slow a page down?",
      answer: "Work happens only while a tube or the knife is moving. At rest nothing is redrawn, and the loop stops when the tray scrolls out of view or the tab is hidden. The grid is rebuilt once when the layout switches between the wide and narrow arrangement.",
    },
    {
      question: "Can I use watercolour or acrylic names instead of oils?",
      answer: "Yes. Change the `name` values and the small line of label text inside `drawTube`. For a thinner, more transparent paint, lower the `11` inside `Math.exp(-11 * t)` so the enamel shows through sooner.",
    },
  ],
  related: ["edit-sentence-that-gathers-into-a-bead-of-wet-paint-and-falls-onto-a-lacquered-page-model", "signature-pad-on-cotton-paper-with-a-fountain-pen-that-leaves-wet-ink-which-dries"],
  tags: ["colour picker", "paint", "canvas", "simulation", "palette knife", "skeuomorphic", "input"],
  height: 766,
  interactive: true,
};

export default meta;
