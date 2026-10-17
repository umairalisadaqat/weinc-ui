const meta = {
  slug: "portrait-buried-under-sand-in-a-tray-where-the-pointer-drags-a-finger-trail-that-sifts-shut",
  category: "cursors",
  name: "Portrait Buried Under Sand in a Tray Where the Pointer Drags a Finger Trail That Sifts Shut",
  keyword: "sand reveal cursor effect webgl",
  title: "WebGL Cursor Effect: Sand Reveal over a Portrait | We.Inc",
  description: "Cursor effect where a portrait lies under sand in a tray: the pointer ploughs a trail down to the print and the sand sifts shut. Free React and HTML code.",
  intro: "A shallow walnut tray filled level with pale sand, and a colour portrait lying on the glass underneath. The pointer acts as a fingertip: wherever it is dragged it scoops the sand aside, banks it into a low ridge along both sides of the furrow, and leaves the print showing through with a few stray grains still on it. The furrow does not last. Loose sand slumps in from the edges, the ridges sink, and over about twenty seconds the line closes from its oldest end. A lamp at the top left rakes across the bed, so ridges are lit on one flank and shaded on the other and the near wall of each furrow throws a shadow onto the picture. With no pointer a slow hand keeps drawing one wandering line. The tray scales to phone width, where a sideways drag draws and the button lifts all the sand at once.",
  useWhen: [
    "A teaser page for an unreleased collection, record or cover should let visitors uncover the picture a strip at a time.",
    "A spa, ceramics or interiors brand wants one calm object on the page that answers to touch.",
    "An archive or excavation story needs an opening image that is found by the reader and then lost again.",
    "You want a reveal that cannot be left fully open by accident, so the picture keeps its mystery for the next visitor.",
  ],
  customize: [
    "Replace `print.src` and `print.alt`. Saturated colour works best, because it is seen in narrow strips against a warm neutral.",
    "`FINGER` is the width of the furrow as a share of the tray. `0.03` draws with a fingertip, `0.09` wipes with the side of a hand.",
    "`LEVEL` is how quickly grains sift back over bare glass and `CREEP` how quickly the walls close in. Halve both for lines that last a minute, or set both to `0` to keep every mark.",
    "For black volcanic sand, change the first two `vec3` colours in the `grain` lines of the shader to about `0.09, 0.09, 0.1` and `0.03, 0.03, 0.04`, and make the fallback layer `bg-[#c9b796]` match.",
    "The tray is the outer div: the `WALNUT` gradient is the wood, `p-[22px]` is the width of the rim and `rounded-[22px]` its corner.",
  ],
  accessibility: [
    "The portrait is a real image with alt text beneath the canvas, so it is announced whether or not any sand has been moved.",
    "The button is a native toggle with `aria-pressed` that brushes all the sand off and pours it back, so the full picture is reachable from the keyboard.",
    "With reduced motion the sand never drifts: a stroke stays exactly as drawn and the button changes the tray in one step.",
    "If WebGL is not available the tray shows the print through one cleared patch in a grained sand-coloured layer, and the button still uncovers it.",
  ],
  faqs: [
    { question: "How is the sand simulated?", answer: "A grid of 128 by 160 numbers holds how deep the sand is in each cell. Pressing the finger down lowers the cells under it and adds most of what was removed to a ring of cells around it. Every frame, any step between two neighbouring cells that is steeper than `REPOSE` collapses, the way a real sand wall does; shallower slopes creep very slowly; and every cell drifts a hair toward the level bed, which is the refilling. That grid is uploaded as a small texture and the shader does the rest." },
    { question: "Why does the edge of a furrow look grainy and not blurred?", answer: "Depth alone would give a soft gradient from sand to picture. The shader instead compares the depth with a per-grain random number, so where the bed is thin some grains are present and some are not. The same trick leaves a scatter of single grains on the cleared glass." },
    { question: "Where does the pushed sand go?", answer: "Seven tenths of it is banked onto the sand beside the finger and the rest is dropped, which keeps the ridges believable. It is only ever banked onto cells that still have sand, so nothing falls back into the furrow behind the fingertip." },
    { question: "Can visitors keep what they have drawn?", answer: "Set `LEVEL` and `CREEP` to `0` and remove the idle hand by deleting the `wander` branch in the loop. The bed will then hold every mark until the button is used; only walls too steep to stand still fall in." },
    { question: "What does it cost per frame?", answer: "One pass over about twenty thousand cells on the CPU, one small texture upload, and one shader pass with nine texture reads per pixel. Device pixel ratio is capped at two and the loop pauses off screen." },
  ],
  related: ["photograph-in-an-enamel-darkroom-tray-under-water-that-ripples-where-the-pointer-drags", "reversible-sequin-portrait-panel-that-flips-to-gold-foil-where-the-pointer-brushes", "bar-magnet-cursor-that-combs-iron-filings-on-paper-into-field-lines"],
  tags: ["cursor", "image reveal", "sand", "trail", "webgl", "shader", "heightfield", "portrait"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
