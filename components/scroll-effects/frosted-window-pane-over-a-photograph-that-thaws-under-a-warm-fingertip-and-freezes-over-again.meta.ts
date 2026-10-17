const meta = {
  slug: "frosted-window-pane-over-a-photograph-that-thaws-under-a-warm-fingertip-and-freezes-over-again",
  category: "scroll-effects",
  name: "Frosted Window Pane over a Photograph That Thaws Under a Warm Fingertip and Freezes Over Again",
  keyword: "frosted glass image reveal effect",
  title: "React Frosted Glass Image Reveal Under the Cursor | We.Inc",
  description: "Image reveal in WebGL: window frost hides a photograph, melts where the pointer rubs, beads with water and freezes over again. Free React and HTML code.",
  intro: "A small dark window frame on a pale winter wall, its glass iced over. Behind the ice is a warm photograph that shows through only as smears of colour, pushed about by feathered crystals that spread from scattered seeds. Where the pointer or a finger rubs the glass the thin ice between the crystals goes first and the feathered arms last. The glass behind is fogged at first and then sharp, with beads of meltwater standing along the retreating edge, each bead a tiny lens with its own highlight. Stop, and the cold comes back: the cleared patch shrinks from the outside in until the pane is white again. A click breathes a wide warm circle onto the glass. One patch over the subject's face is already clear when the page loads, and with no visitor an unseen finger keeps drawing slow loops. On phones the window fits the screen and a sideways rub melts it.",
  useWhen: [
    "A winter campaign, ski lodge or seasonal menu wants its lead photograph to arrive in a way that belongs to the season.",
    "You are teasing a product before launch and want visitors to work a little to see it.",
    "A portrait or interior shot is the whole message and a plain image block feels too flat.",
    "A page needs a playful moment that leaves nothing permanently hidden, since one click clears most of the pane.",
  ],
  customize: [
    "Change the photograph in `view`. Warm, bright pictures show through the ice better than dark ones, and `tone` is the colour the pane holds while the file loads.",
    "`FINGER` is the size of the warm spot as a share of the pane height. `0.03` draws thin lines you can write with and `0.12` clears like the heel of a hand.",
    "`CHILL` is how fast the glass cools. `0.03` keeps a drawing for half a minute, and `0.3` closes over almost as you go.",
    "The ice is tinted by `vec3(0.80, 0.87, 0.93)` in the shader. Push it towards white for heavy hoarfrost, or towards amber for a steamed bathroom mirror.",
    "The opening patch is the single `warm(0.5, 0.36, 0.15, 1.5)` call: position across, position down, size and strength. Move it over your own subject or delete it to start fully iced.",
  ],
  accessibility: [
    "The pane is one button with a label that explains both ways of clearing it, and the photograph beneath is a real image with alt text, so its content never depends on melting anything.",
    "Arrow keys slide the warm spot across the glass in steps and Enter or Space breathes on it, which clears most of the picture at once.",
    "With reduced motion or without WebGL the canvas is not used: the photograph is shown with a soft ring of blur left round the edges and a clear middle.",
  ],
  faqs: [
    { question: "How does the frost remember where I rubbed?", answer: "The component keeps a small grid of numbers, 56 by 70, holding how warm each patch of glass is. The pointer adds warmth in a soft round spot. Every frame each cell drifts towards the average of its four neighbours and loses a little. That grid is sent to the shader as a tiny texture and decides, pixel by pixel, whether to draw ice, fog or clear glass." },
    { question: "Why is the melting edge jagged?", answer: "The crystal pattern is subtracted from the warmth before the melt threshold is applied, so the feathered arms count as thicker ice and need more heat. The thin glaze between them clears first and the arms stand out for a moment as white ferns before they go too, which is how window frost really lets go." },
    { question: "How is the picture blurred inside the ice without a slow blur pass?", answer: "The photograph is drawn once into a 1024 pixel square and the graphics card builds a chain of half-size copies of it. The shader reads a small copy for the ice, a medium one for fogged glass and the full one for clear glass, so the blur costs nothing extra per frame." },
    { question: "Can visitors write a word in the frost?", answer: "Yes, with `FINGER` at about `0.03` and `CHILL` at `0.03` strokes stay narrow and last long enough to write a short word. The grid is coarse, so letters need to be large, roughly a quarter of the pane high." },
    { question: "Can it reveal a video?", answer: "It can, with one change: upload the current video frame to the picture texture each time you draw, and call `generateMipmap` after it so the blurred copies keep up. Expect that to cost more on phones than a still image does." },
  ],
  related: [
    "photograph-in-an-enamel-darkroom-tray-under-water-that-ripples-where-the-pointer-drags",
    "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph",
    "glossy-photo-print-that-peels-off-a-second-photograph-with-a-lit-curling-underside",
  ],
  tags: ["image reveal", "frost", "frosted glass", "webgl", "cursor", "melt", "winter", "photo"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
