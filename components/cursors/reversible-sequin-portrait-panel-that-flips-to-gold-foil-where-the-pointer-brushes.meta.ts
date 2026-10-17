const meta = {
  slug: "reversible-sequin-portrait-panel-that-flips-to-gold-foil-where-the-pointer-brushes",
  category: "cursors",
  name: "Reversible Sequin Portrait Panel That Flips to Gold Foil Where the Pointer Brushes",
  keyword: "sequin flip image hover effect react",
  title: "React Image Hover Effect: Sequins That Flip | We.Inc",
  description: "Cursor effect in WebGL: a panel of flip sequins printed with a portrait, where each disc you brush swings over to its gold back. Free React and HTML code.",
  intro: "A panel of two-sided sequin cloth, the kind sewn onto cushions and jackets, hanging on a pale wall. A portrait is printed across the fronts of the discs and the backs are plain gold foil. Drag the pointer over it and the sequins under the stroke swing over on their stitches, one after another, each on its own spring, so a band of gold appears with a ragged, glittering edge. Stroke the same place again and the picture comes back. Every disc is a flat piece of foil sewn on at a slightly different angle, so single sequins flash white as the lamp drifts and as the pointer moves. When nobody is touching it an unseen hand lays a slanting stroke of gold, then another, then goes back and brushes the first one away. On a phone the panel shrinks to the screen width and a sideways swipe does the brushing while an up or down swipe still scrolls the page.",
  useWhen: [
    "A fashion or beauty campaign wants its lead picture to behave like the garment it is selling.",
    "You want visitors to scribble on a hero image without anything being lost, because every mark can be brushed back.",
    "A drop or launch page needs one object on an empty stage that people will screenshot and send round.",
    "A party, awards or end of year page wants glitter that is made of something, not a confetti overlay.",
  ],
  customize: [
    "Change `portrait.src` and `portrait.alt`. A close crop with large blocks of colour reads best through the discs.",
    "`FOIL.rgb` is the colour of the backs. Try `[0.78, 0.8, 0.84]` for silver, `[0.08, 0.08, 0.1]` for black, or `[0.85, 0.2, 0.4]` for hot pink.",
    "`COLS` is the number of sequins across. `18` gives big chunky paillettes, `40` gives a fine cloth where the picture is sharper.",
    "`BRUSH` is the width of the pointer's stroke measured in sequins, and `DEMO_BRUSH` is the same for the idle hand.",
    "The sparkle is the `pow(facing, 90.0) * 0.95` line in the shader. Lower the power for broad soft flashes, or the `0.95` for a matte cloth.",
  ],
  accessibility: [
    "The portrait is an ordinary image with alt text under the canvas, so it is announced whatever state the sequins are in.",
    "The button under the panel sends one stroke across every sequin and says which face it will bring up, which gives keyboard and switch users the whole effect.",
    "With reduced motion the cloth is drawn once, with a single stroke of gold already laid, and nothing glints or strokes itself.",
    "The panel keeps `touch-pan-y`, so a page can still be scrolled with a finger that starts on it.",
  ],
  faqs: [
    { question: "How are the sequins drawn?", answer: "None of them is an element. A small grid holds how far over each sequin is, from 0 to 1, and that grid is sent to a fragment shader as a tiny texture every frame. For each pixel the shader looks at the fifteen sequins that could reach it, works out which lies on top, and shades that disc as a flat piece of foil with its own tilt, a lit rim and a sewing hole." },
    { question: "Why does a stroke sometimes lay gold and sometimes bring the picture back?", answer: "A stroke lays down whichever face is not showing at the point where it starts, the way brushing real flip sequins against the nap turns them. A stroke counts as new after a press, after the pointer enters the panel, or after it has rested for about a third of a second." },
    { question: "Can the backs carry a second photo instead of a plain colour?", answer: "Yes, with a small shader change. Upload a second image to a third texture unit and replace `foil` in the `mix(foil, texture2D(u_a, ...), front)` line with a lookup into it. Use two pictures cropped alike, since a flipped sequin shows the matching spot of the other one." },
    { question: "Will the picture stay recognisable through the discs?", answer: "It is printed across the cloth, not sampled once per sequin, so detail survives. Each disc pulls its part of the picture a little toward its own centre, which gives the faceted look, and the shading of the overlapping rows adds the scale pattern on top." },
    { question: "How heavy is it?", answer: "One shader pass over the panel with fifteen reads of the small state texture per pixel, plus a spring step for about thirteen hundred sequins on the CPU. The loop stops when the panel is scrolled out of view or the tab is hidden." },
  ],
  related: ["portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph", "portrait-buried-under-sand-in-a-tray-where-the-pointer-drags-a-finger-trail-that-sifts-shut", "bar-magnet-cursor-that-combs-iron-filings-on-paper-into-field-lines"],
  tags: ["cursor", "image effect", "sequins", "fabric", "webgl", "shader", "portrait", "springs", "glitter"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
