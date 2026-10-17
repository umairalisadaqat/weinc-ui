const meta = {
  slug: "hanging-garment-bag-scroll-reveal-with-a-brass-zip-that-parts-waxed-canvas-over-a-photograph",
  category: "scroll-effects",
  name: "Hanging Garment Bag Scroll Reveal with a Brass Zip That Parts Waxed Canvas over a Photograph",
  keyword: "zipper scroll reveal react",
  title: "React Zipper Scroll Reveal over a Photo | We.Inc",
  description: "Scroll reveal on a canvas: a waxed canvas garment bag hangs from a peg and its brass zip opens as you scroll or drag. Copy the React code or HTML free.",
  intro: "A waxed canvas garment bag hangs from a wooden peg on a plaster wall. Its brass zip runs down the front, and whatever you put inside is a photograph. As the page scrolls the slider travels down, the two front edges turn back to show their striped ticking, and the picture appears in the widening gap. You can also take the zip in your hand: drag it down to open and up to close. The pull tab flips upward when you close, the bag swings a little on its hook when you tug it, and creases in the cloth point at wherever the slider is. Everything is one canvas that scales with its box, so on a phone the bag simply gets smaller and the zip column stays the only part that captures a vertical swipe.",
  useWhen: [
    "A lookbook or collection page wants to hold back the lead photograph until the visitor has scrolled to it.",
    "A product launch needs a teaser: the cover is the tease and the opened bag is the announcement.",
    "A portfolio case study opens with one image and you want the visitor to do something small to earn it.",
    "A tailoring, luggage or outdoor brand wants a reveal that is made of its own materials.",
  ],
  customize: [
    "`PHOTO.src` and `PHOTO.alt` set the picture. `PHOTO.focusY` slides it up or down behind the opening, and `PHOTO.fallback` is the colour shown before it loads.",
    "`CLOTH` is the canvas colour as red, green and blue. `[28, 34, 52]` gives navy, `[122, 84, 44]` a tan duck.",
    "`LINING` and `STRIPE` colour the turned-back edges. Set both to the same triple for a plain lining.",
    "`OPEN_AT_REST` is how far the demo leaves the zip and where reduced motion parks it. The opening width comes from `reach`, `64 + 66 * s.z`: raise the second number for wider lapels.",
    "`LABEL` is the text woven into the tag at the lower right. Keep it to eight characters or widen the 66 unit rectangle.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The photograph is a real `img` with alt text, and the zip is a native range input labelled with how far it is open.",
    "Arrow keys move the zip in steps of five percent, and a ring appears around the bag while the range input has keyboard focus.",
    "Only the narrow column over the zip uses `touch-none`, so a thumb on the rest of the bag still scrolls the page.",
    "With reduced motion the bag is drawn once, already open, with no swing and no self-running demo. Dragging and the keyboard still work and move the zip instantly.",
  ],
  faqs: [
    {
      question: "How does the zip know how far the page has scrolled?",
      answer: "A passive scroll listener measures where the bag sits in the window. The zip starts to open once a little under half the bag is on screen and is fully open after another 55 percent of the window height. Until the page scrolls for the first time, a timed demo opens and closes it instead.",
    },
    {
      question: "Why does the cloth look folded back instead of just cut away?",
      answer: "Each side of the opening is two curves. The inner one is the fold, the outer one is where the zip tape now lies. The strip between them is filled with the lining pattern, shaded with a dark crease and a light roll next to the fold, and edged with its half of the teeth. It also drops a shadow on the canvas, which is what gives it thickness.",
    },
    {
      question: "Can I put something other than a photo inside?",
      answer: "Anything a canvas can draw. Replace the `drawImage` call in the block that starts with the comment about what is inside. A flat colour with a word set in large type works well for an announcement.",
    },
    {
      question: "Is the fabric texture an image file?",
      answer: "No. Two small tiles are generated in the browser when the component mounts: a plain weave for the canvas and a finer weave with stripes for the lining. They are used as repeating patterns, so there is nothing to download except the photograph.",
    },
    {
      question: "Does it keep drawing while nothing moves?",
      answer: "No. Once the zip, the swing and the pull tab have all come to rest the loop stops asking for animation frames and only checks a few times a second whether the demo should run again. It also stops when the bag leaves the screen or the tab is hidden.",
    },
  ],
  related: ["velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway", "press-stud-snap-toggle-on-a-waxed-canvas-strap-that-pops-open-and-curls-back", "photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table"],
  tags: ["zip", "zipper", "fabric", "canvas", "scroll", "reveal", "photo", "skeuomorphic"],
  height: 790,
  section: true,
  interactive: true,
};

export default meta;
