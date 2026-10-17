const meta = {
  slug: "cast-glass-wordmark-footer-ray-marched-in-webgl-with-jewel-coloured-letters-that-throw-coloured-shadows-and-turn-on-their-pivots-when-pressed",
  category: "footers",
  name: "Cast Glass Wordmark Footer Ray-Marched in WebGL With Jewel-Coloured Letters That Throw Coloured Shadows and Turn on Their Pivots When Pressed",
  keyword: "giant wordmark footer react",
  title: "Cast Glass Wordmark Footer (React, WebGL shader) | We.Inc",
  description: "Free React footer: a giant wordmark cast in coloured glass, traced in a WebGL shader on a white studio floor, with link columns and a legal line set around it.",
  intro: "A site footer whose wordmark is an object, not type. The company name stands on a white studio sweep as five thick castings of coloured glass, each letter a different melt: cobalt, vermilion, amber, emerald and rose. A lamp behind the word shines through them, so each letter lays a stretched pool of its own colour on the floor toward the reader, and where two pools cross the colours mix the way gels do. A single fragment shader traces every ray into the glass, off the inside of the bevels and out the back. Above the word sit a serif line, an address and four columns of links in a real nav; below it run the copyright line and the small print. The lamp stands almost straight behind the word, so the pools read as the letters themselves, laid flat and upside down. Moving the pointer walks the lamp round and the shadows swing with it. Pressing a letter turns it once on its pivot, and its shadow thins to a line and opens again. On phones the columns fold to two by two and the word still runs edge to edge.",
  useWhen: [
    "The brand name is short, five to eight letters, and you want it to close every page at full width without it being one more line of big grey type.",
    "A studio, maker or design-led shop wants the last screen of the site to feel as considered as the first.",
    "You need an ordinary sitemap footer, with columns, small print and a copyright line, that also gives people something to poke at.",
    "A portfolio or launch page has to show glass, refraction and coloured shadow in a browser without loading a 3D library.",
  ],
  customize: [
    "`brand.word` is the word that gets cast. It is refitted to the frame, so four letters and eight letters both run edge to edge; letters with tails below the line are cut at the floor, so prefer words without g, j, p, q or y.",
    "`GLASS` lists the melts in order and repeats when the word is longer. Each entry is how strongly the glass absorbs red, green and blue: `[2.9, 1.05, 0.05]` is cobalt, and `[0.6, 0.6, 0.6]` gives smoked grey. Keep `TINT` in step with it, because the no-WebGL still uses those screen colours.",
    "`DEPTH` is half the thickness of a casting. Raise it toward 0.6 for chunky blocks with darker colour, lower it toward 0.25 for thin plate letters with paler shadows.",
    "`SUN.turn` and `SUN.height` place the lamp in radians. A `height` near 0.5 gives long evening shadows that reach the legal line; near 1.1 gives short midday ones.",
    "`columns` and `small` hold the link lists, and `brand.line`, `brand.place` and `brand.legal` the copy. Four columns fit the grid; for three, change `sm:grid-cols-4` to `sm:grid-cols-3`.",
    "The floor colour is `FLOORC` in the shader; change the `bg-[#efece6]` fallback on the footer to match it.",
  ],
  accessibility: [
    "The root is a `footer` and the columns live in a `nav` labelled Footer, each with its own heading and list, so landmark and heading navigation both find them.",
    "The glass word is decoration and hidden from assistive technology. The company name is written out in the small line above the tagline and again in the copyright line.",
    "Turning the letters is offered as a named button beside the small print, so it never depends on finding a letter with a pointer. Every link and the button show a dark focus ring.",
    "With reduced motion the lamp stays where it is, nothing turns, the button is removed and the picture is refined over a few passes and then left alone.",
  ],
  faqs: [
    {
      question: "How are the letters turned into glass?",
      answer: "The word is drawn once on a 2D canvas in the page font. A distance transform turns that drawing into a texture where every texel holds how far it is from the outline. The shader reads that texture as the cross-section of a solid, pushes it back to give thickness, cuts a bevel round both faces, and then sphere-traces it. A ray that lands is refracted in, bounced off the inside wherever it meets the wall too shallowly to leave, and followed out to whatever it reaches.",
    },
    {
      question: "Why are the shadows coloured instead of grey?",
      answer: "For each point of the floor the shader walks toward the lamp and adds up how much of each glass lies in the way. The light that survives is the lamp colour with that much red, green and blue removed, so cobalt glass leaves blue light and amber leaves gold. Two letters in the way remove both sets, which is why overlapping pools turn green or violet.",
    },
    {
      question: "Can I use my own typeface for the wordmark?",
      answer: "Yes. The casting uses whatever `FONT` and `WEIGHT` resolve to in the page, and if a web font finishes loading after the first frame the word is baked again in it. Heavy weights work best, because thin strokes leave no room for the bevel.",
    },
    {
      question: "What happens when a letter is pressed?",
      answer: "It makes one full turn about its own upright axis, away from the side you pressed. The turn winds back a few degrees first, swings through, runs a little past square and settles on a spring. The letters either side get a small shove a moment later and shiver back to rest. While anything is turning the shader measures each letter in its own turned frame, so the glass, the mirror image in the floor and the coloured shadow all follow.",
    },
    {
      question: "Will this slow my page down?",
      answer: "The drawing buffer is capped near one and a half million pixels, only pixels on glass pay for the trip through it, and the loop stops when the footer is off screen or the tab is hidden. If frames run long it steps the resolution down by itself. Because a footer is the last thing on a page, nothing is traced until someone scrolls to it.",
    },
    {
      question: "What shows without WebGL?",
      answer: "The same footer with the word set in real type at the same size, each letter filled with a gradient of its glass colour and a slanted, softened copy of the word laid on the floor in front of it as the shadow. Links, columns and small print are plain HTML in both cases.",
    },
  ],
  related: [
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
    "ray-marched-liquid-chrome-word-on-a-mirror-floor-with-a-mercury-bead-that-chases-the-pointer",
    "brick-wall-footer-with-screwed-on-street-name-plates-lit-by-a-torch-that-follows-the-pointer",
  ],
  tags: ["footer", "wordmark", "webgl", "ray marching", "shader", "glass", "shadows", "typography"],
  height: 840,
  interactive: true,
  section: true,
};

export default meta;
