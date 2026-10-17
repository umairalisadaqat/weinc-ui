const meta = {
  slug: "travertine-block-footer-with-a-wordmark-carved-in-roman-capitals-ray-marched-in-webgl-where-the-evening-sun-follows-the-pointer-and-rakes-shadows-through-the-cuts",
  category: "footers",
  name: "Travertine Block Footer With a Wordmark Carved in Roman Capitals Ray-Marched in WebGL Where the Evening Sun Follows the Pointer and Rakes Shadows Through the Cuts",
  keyword: "carved stone wordmark footer react",
  title: "Carved Travertine Wordmark Footer (React, WebGL) | We.Inc",
  description: "Free React footer: a brand name cut in V-grooved capitals into a travertine block in evening sun. Move the pointer and shadows sweep through the cuts.",
  intro: "A footer that ends the page on a slab of stone. The company name is incised into the front of a long block of pale travertine that lies on paving in front of a plaster wall, in the warm, low light of early evening. Every letter is a true V cut, the way a letter cutter works with a chisel: two sloping walls that meet in a sharp line down the middle of each stroke, so one wall catches the sun and the other falls into shade. The whole scene is one fragment shader that sphere-traces the block, the cuts, the paving and the wall, with soft sun shadows, ambient occlusion in the corners and the bedding lines and small holes that travertine is known for. Above it sit a serif line, the address and four columns of links in a real nav. Moving the pointer across the lower half walks the sun round the block, so the light flips from one wall of every cut to the other and the long shadow behind the stone swings; a small slider by the legal links does the same from the keyboard. On phones the columns fold to two by two and the block shrinks to fit the width.",
  useWhen: [
    "A stonemason, architect, letter cutter or memorial maker wants the last screen of the site to show the craft rather than describe it.",
    "The brand name is short and reads well in capitals, and you want it to close the page at full width with real weight behind it.",
    "A hotel, winery or estate with a warm, old-world look needs a sitemap footer that still feels like part of the place.",
    "You want an example of heightfield carving, soft shadows and procedural stone in a shader that does not pull in a 3D library.",
  ],
  customize: [
    "`brand.word` is the word that gets carved. It is set in capitals and scaled to the block, so keep it between four and nine letters.",
    "`CUT.slope` sets how steep the chisel walls are and `CUT.deepest` the deepest any cut may go. A slope near 0.8 gives shallow, soft cuts; near 1.8 gives sharp, deep ones that hold more shadow.",
    "`SUN.start` and `SUN.height` set where the sun stands when the page opens. Values of `start` near -1.2 rake the light hard across the face from the left; near 0 the sun faces the block and the letters nearly vanish, which is how real inscriptions behave at noon.",
    "The stone colours live in the `travertine` function of the shader; swap the cream `vec3(0.86, 0.78, 0.65)` for a cooler grey to make it read as limestone. Change `bg-[#3a2620]` on the footer to match any new wall colour.",
    "`columns`, `small` and `brand.place` hold the link lists and address. The link grid is set for four lists side by side; with fewer lists, lower the number in `sm:grid-cols-4` to match.",
  ],
  accessibility: [
    "The root is a `footer`, and the columns sit in a `nav` labelled Footer with a heading and a list each, so screen readers can jump straight to them.",
    "The carved word is a picture and is hidden from assistive technology. The company name appears as text above the tagline and again in the copyright line.",
    "Moving the sun is offered as a labelled range input with the time of evening as its spoken value, so it never depends on a pointer. Links and the slider show a visible focus ring on the dark wall.",
    "With reduced motion the sun stays where it opens, the shader draws one frame and stops, and the text does not slide in.",
  ],
  faqs: [
    {
      question: "How are the letters carved in the shader?",
      answer: "The word is drawn once on a 2D canvas, and a distance transform turns that drawing into a texture where every texel says how far it lies inside a letter. The shader turns that distance into depth, capped at a maximum, which gives each stroke two straight sloping walls that meet down the middle. The block is then a rounded box with that depth subtracted from its front face, and it is sphere-traced like any other solid.",
    },
    {
      question: "Why do the letters nearly disappear when the sun is straight in front?",
      answer: "Because that is what happens to real inscriptions. Both walls of a V cut face the light equally when it comes from the front, so neither falls into shade and the cut reads only as a faint line. Letter cutters photograph their work with the light low and from one side for this reason, and the footer opens with the sun there.",
    },
    {
      question: "Can I use my own typeface?",
      answer: "Yes. The carving uses whatever `SERIF` and `WEIGHT` resolve to in the page, and if a web font finishes loading after the first frame the word is baked again in it. Classical capitals with strong contrast between thick and thin strokes look best, because the thin strokes cut shallower, exactly as they do in stone.",
    },
    {
      question: "How heavy is it to run?",
      answer: "It draws only while the sun is moving, so a resting footer costs nothing. The drawing buffer is capped at about 1.3 million pixels, the march into the block only starts inside its bounding box, and if frames run long the resolution steps down by itself. The loop also stops when the footer scrolls out of view or the tab is hidden.",
    },
    {
      question: "What appears where WebGL is not available?",
      answer: "A CSS version of the same block: a warm stone gradient with an inset lower edge and a cast shadow, and the word set in the same serif with paired light and dark text shadows so it reads as incised. The links, columns and legal line are ordinary HTML in both cases.",
    },
  ],
  related: [
    "cast-glass-wordmark-footer-ray-marched-in-webgl-with-jewel-coloured-letters-that-throw-coloured-shadows-and-turn-on-their-pivots-when-pressed",
    "brick-wall-footer-with-screwed-on-street-name-plates-lit-by-a-torch-that-follows-the-pointer",
    "ray-marched-liquid-chrome-word-on-a-mirror-floor-with-a-mercury-bead-that-chases-the-pointer",
  ],
  tags: ["footer", "wordmark", "webgl", "ray marching", "shader", "stone", "carving", "shadows"],
  height: 840,
  interactive: true,
  section: true,
};

export default meta;
