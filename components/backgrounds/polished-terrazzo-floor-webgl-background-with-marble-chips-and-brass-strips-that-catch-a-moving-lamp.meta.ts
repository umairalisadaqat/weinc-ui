const meta = {
  slug: "polished-terrazzo-floor-webgl-background-with-marble-chips-and-brass-strips-that-catch-a-moving-lamp",
  category: "backgrounds",
  name: "Polished Terrazzo Floor WebGL Background with Marble Chips and Brass Strips That Catch a Moving Lamp",
  keyword: "terrazzo shader background react",
  title: "React Shader Background: Polished Terrazzo | We.Inc",
  description: "Terrazzo background in WebGL: a shader sets marble chips in cream cement, lays brass strips and mirrors a lamp the pointer moves. Free React and HTML code.",
  intro: "A polished terrazzo floor seen straight down. Chips of white, rose and yellow marble, terracotta, green serpentine and dark slate sit in cream cement in three grades, from thumb-sized slabs to grit, and two brass divider strips cross the pour. A pendant lamp hangs over it. Its round shade shows as a crisp disc in the stones and as a soft bloom in the cement between them, and because no two chips were ground perfectly level the disc breaks at every edge as it slides. The lamp swings in a slow figure of eight until the pointer takes hold of it. Nothing sits on the floor except a small caption pill. Phones show a closer crop so the chips stay a comfortable size under a thumb.",
  useWhen: [
    "A cafe, bakery, gelateria or hotel lobby page wants the floor its guests actually stand on behind the opening line.",
    "An architecture or interiors studio needs a pale, textured backdrop that is not another sheet of grey concrete.",
    "A homeware or tile shop wants a material sample that responds to light on a product page.",
    "You need a light background with colour in it, where a dark navbar and dark type still read cleanly on a panel.",
  ],
  customize: [
    "`floor.stones` holds the six chip colours and `floor.cement` the binder. For a dark floor set the cement to `[0.12, 0.13, 0.14]` and keep the white and rose rows so they stand out.",
    "`floor.chipSize` scales all three grades together. `0.7` reads as a fine Venetian mix, `1.5` as large broken slabs.",
    "`floor.fill` is the share of the biggest chips that are kept. Lower it to `0.45` for a sparse, modern scatter with more cement showing.",
    "`floor.polish` runs from a honed finish at `0.3`, where the lamp is only a haze, to a full mirror grind at `1`.",
    "Set `floor.strips` to `0` to remove the brass, or move the crossing point in the `uStrip` line of `resize`, which places it as a share of the view.",
  ],
  accessibility: [
    "The floor is decoration, so the canvas and the SVG drawn beneath it are both hidden from screen readers and neither one intercepts clicks.",
    "Chips range from near white to near black, so text laid straight on the floor will cross both. The caption uses a `stone-900` pill for that reason; copy the approach for headings.",
    "Under the reduced motion setting the lamp is parked slightly right of centre, one frame is drawn, and pointer movement is ignored.",
  ],
  faqs: [
    { question: "How are the chips drawn?", answer: "The plane is divided into irregular cells, the kind you get from scattering points and giving each point the ground nearest to it. Every cell is then pulled back from its borders by its own random margin, which leaves an angular fragment with cement around it. This is done at three sizes, with the larger grades painted over the smaller, and some cells are skipped so the cement has room." },
    { question: "Why does the lamp reflection break up across the stones?", answer: "Each chip carries a tilt of a degree or so and its own sharpness. The shader bounces the line of sight off that tilted face and checks whether it lands inside the lamp's shade, so one chip may show the edge of the disc while its neighbour has already lost it. Cement uses a much wider blur and a weaker mirror, which gives the bloom." },
    { question: "What are the pale diagonal bands across the floor?", answer: "A row of skylights reflected in the polish. They stay put while the lamp moves, which helps the surface read as glossy even in the parts the lamp is far from." },
    { question: "Does the floor itself animate?", answer: "No. Stone does not move, so only the light does. That also means the pattern is identical on every visit, and a design placed over it will always sit on the same chips at a given screen size." },
    { question: "What happens without WebGL?", answer: "An inline SVG of about a hundred flat four-sided chips in matching colours, two brass lines and a pale pool of light. It is generated from a fixed seed, painted first, and covered by the canvas once the shader has produced a frame." },
    { question: "How much work is it per frame?", answer: "Three cell lookups per pixel is the main cost, and there are no shadow or supersampling passes. The canvas is capped at `floor.maxPixels` and drawing stops while the section is off screen or the tab is hidden." },
  ],
  related: ["marbled-paper-webgl-background-with-floating-inks-combed-into-feathers-on-a-wet-size-bath", "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light", "raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow"],
  tags: ["webgl", "shader", "terrazzo", "marble", "brass", "floor", "background", "pointer light"],
  height: 760,
  section: true,
};

export default meta;
