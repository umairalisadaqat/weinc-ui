const meta = {
  slug: "ray-marched-fan-of-painted-colour-chips-on-a-brass-rivet-that-washes-a-board-model-of-a-homepage-in-the-colour-you-pick",
  category: "originals",
  name: "Ray Marched Fan of Painted Colour Chips on a Brass Rivet That Washes a Board Model of a Homepage in the Colour You Pick",
  keyword: "webgl colour picker react paint chips",
  title: "3D Colour Picker: Painted Chips That Repaint a Page | We.Inc",
  description: "Free React and WebGL colour picker. Swing a painted chip out of a riveted fan and its colour spreads like wet paint over a sunlit model of a homepage.",
  intro: "A colour picker set as a still life that keeps moving. Six thick chips of brushed matte paint on card are fanned round a brass rivet on a white oak table in the sun, and beside them stands a small board model of a homepage in white card: a menu, a band behind the headline, two buttons and three cards. The parts of the page that carry the brand colour are painted. Take a chip and it lifts off the deck, hangs back for a beat, swings out round the rivet and settles with its tip almost on the table; as it settles, its colour runs across the model from the corner nearest to it, a wet edge with a darker bead of paint at the front, glossy where it has just landed and drying to matte behind. The table in front of the model picks up the new colour as light bounces off the painted band. Each chip has its name and number printed on a strip at the end. On a phone the camera rises to look down on the table, the name of the colour sits at the top and the six chips become a three by two grid of buttons.",
  useWhen: [
    "The brand or theme step of a site builder, where a person chooses one accent colour and should see it land on buttons, a headline band and card details at once.",
    "A landing section for a design tool that needs to show what changing one colour does to a whole page, without a screenshot.",
    "A studio portfolio opener that presents colour as a physical, chosen thing rather than a hex field.",
    "A settings screen for a shop or booking page where the accent colour is the main choice an owner makes.",
  ],
  customize: [
    "`CHIPS` holds every chip: its invented name, the code printed on its label strip, the hex colour of its paint and the one line shown under the big name. Add or remove entries and keep the count at six, or change the `6` in the uniform arrays of the `SCENE` shader too.",
    "`PARTS` lists every raised piece of the homepage model with its centre, half size, corner radius and height. Set `paint: true` on any piece the colour should wash over.",
    "`FAN` and `OUT` set the angle of each chip round the rivet while it is in the deck and the angle of the chip that is out, and `LIE_DECK` and `LIE_OUT` how far each tips toward the table. `PLACE` puts the rivet and the model on the table, with a closer arrangement for phones.",
    "`SPREAD` is the time in seconds the wash takes to cross the model, and `HOLD` how long the self-playing demo rests on each colour before taking the next chip.",
    "In the shader, `L` is the direction of the sun, `SUNC` and `SUNI` its colour and strength, `TABLE` the table colour and `leaves` the dappled shade at the edges of the table.",
  ],
  accessibility: [
    "The six colours are a `radiogroup` of real buttons with the colour name as text and a swatch beside it. It takes one tab stop, the arrow keys move both the choice and the focus, and each button shows a focus ring.",
    "A polite live region reads out the new colour name, its hex value and where it has gone on the model. The canvas itself is hidden from assistive technology; clicking a chip on it is a shortcut for pointer users only.",
    "With reduced motion nothing swings or spreads: a single frame is drawn for each choice with the chip already out and the model already painted, and the big name cross fades.",
    "Without WebGL 2, or if the context is lost, a still made of plain elements stands in: a fan of chips round a brass dot and a flat model whose band, buttons and card tops follow the chosen colour.",
  ],
  faqs: [
    {
      question: "How does the colour spread like paint instead of fading?",
      answer: "Every painted pixel on the model works out its distance from the lower left corner of the board, roughened with two layers of noise so the edge wanders. A uniform called `uR` grows from zero after a chip lands, and pixels inside it take the new colour. Just behind that edge the paint is darker and glossier, and a second uniform, `uDry`, takes the gloss away over the next second and a half.",
    },
    {
      question: "Where do the brush marks on the chips come from?",
      answer: "They are noise stretched about forty times more across the chip than along it, so it reads as streaks that follow the length of the card. The same noise, sampled twice a little apart, tilts the surface normal, which is why the sun catches the ridges at a low angle. The cut edges skip it and show the pale card core instead.",
    },
    {
      question: "Why does the table under the model turn the colour of the paint?",
      answer: "It is a cheap stand in for light bouncing off the painted band. Table pixels in front of the board add the current mix of old and new colour, fading with distance from the base and from the middle of the model, and a little more where the sun reaches them. Each chip tints the table right beside its edges in the same way.",
    },
    {
      question: "Can I read the chosen colour in my own code?",
      answer: "`pick` is plain React state holding the index into `CHIPS`. It changes at the moment the wash starts on the model, inside `startWash`, which is the place to call your own handler, save the choice or pass the hex value to the rest of your theme.",
    },
    {
      question: "How heavy is it to run?",
      answer: "The scene is drawn by one fragment shader that marches signed distance shapes, then a second pass adds depth of field and grain. The number of pixels it renders is capped by `PIXEL_BUDGET`, the render scale steps down by itself if frames run slow, and the loop stops when the piece scrolls out of view or the tab is hidden.",
    },
  ],
  related: [
    "three-ray-marched-board-models-of-one-homepage-in-window-light-where-the-design-you-pick-trades-places-with-the-one-in-front-on-a-base-that-lights-blue",
    "edit-sentence-that-gathers-into-a-bead-of-wet-paint-and-falls-onto-a-lacquered-page-model",
    "watercolour-pan-tin-colour-picker-with-a-sable-brush-that-loads-a-pan-and-blooms-a-wash-into-cotton-paper",
  ],
  tags: ["webgl", "ray marching", "shader", "3d", "colour picker", "radio group", "theme", "originals"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
