const meta = {
  slug: "photo-gallery-on-a-cotton-paper-sheet-where-each-portrait-blooms-in-like-ink-through-wet-fibres",
  category: "galleries",
  name: "Photo Gallery on a Cotton Paper Sheet Where Each Portrait Blooms In Like Ink Through Wet Fibres",
  keyword: "image transition effect react slider",
  title: "React Image Transition Slider with Ink Bleed | We.Inc",
  description: "Photo slider in WebGL: each portrait soaks across a sheet of cotton paper like ink through wet fibres, then its colours develop. Free React and HTML code.",
  intro: "A sheet of heavy paper with a plate printed on it and a title set underneath in italics. Changing plate does not slide or fade. A stain starts at one point and creeps outward in uneven lobes with feathered edges, the way ink travels through damp paper. Just ahead of it the old picture darkens as it gets wet. At the front the new picture appears in a single dark ink with a line of gathered pigment along the edge, and a moment behind that its real colours come up. The grain of the sheet stays visible through every plate. Four round pots of ink below the sheet pick a plate, each in the ink that plate arrives in, and a pause button stops the automatic change. On a phone the sheet takes the width of the screen and the pots stay thumb sized.",
  useWhen: [
    "A portfolio, exhibition or print shop page wants a slideshow whose transition says something about the medium.",
    "You have three to six strong portraits or posters and would sooner show them one at a time than as a grid.",
    "A hero needs a slow, self-running image change that does not look like a stock crossfade.",
    "An editorial feature opens on a sequence of plates with short titles.",
  ],
  customize: [
    "Edit `plates`: each has a `src`, an `alt`, a `title` for the caption and an `ink` colour used for the wash and for its pot. Dark, low saturation inks look most like the real thing.",
    "`BLOOM` is the length of one transition in seconds and `REST` is the pause before the next. Set `BLOOM` near `1.2` for a brisk change.",
    "`SEEDS` lists where blooms start, as fractions of the sheet. A single entry of `[0.5, 0.5]` makes every plate grow from the centre.",
    "In the shader, `warp * 0.34` controls how lopsided the stain is and the `0.46` beside it how ragged its edge. Lower both for a rounder, calmer spread.",
    "The sheet is the `figure`: `bg-[#f8f4ea]` is the paper, `p-[22px]` the margin, and `rounded-[3px]` the corner. The bench behind it is `bg-[#e9e2d3]`.",
  ],
  accessibility: [
    "Every plate is a real image with alt text. Only the current one is exposed to assistive technology and the title is announced politely when it changes.",
    "The ink pots are native buttons with labels that name the plate, and the current one carries `aria-current`.",
    "Because the sheet changes by itself, there is a pause button, and choosing a plate by hand holds the slideshow for seven seconds.",
    "With reduced motion nothing plays automatically and the pots switch plates instantly using the plain images. The same happens without WebGL.",
  ],
  faqs: [
    { question: "How is the ink edge shaped?", answer: "Every pixel gets an arrival time. It starts as the distance from the seed point, measured after the page has been pushed around by slow noise so the stain grows in lobes. Finer noise is added for the ragged edge, plus a little of the paper fibre pattern so the front feathers along the grain. Progress then sweeps through those arrival times." },
    { question: "Why does the picture arrive in one colour first?", answer: "Because that is how wet media behave: the carrier runs ahead and the pigment follows. The shader turns the incoming picture into a density, mixes paper toward the ink colour by that density, and only blends to the full colour photograph some way behind the front. It gives the eye two events to follow where a plain wipe has one." },
    { question: "Can I drive the transition from scroll position?", answer: "Yes. The shader takes a single progress number between 0 and 1. Replace the clock based value passed to `u_p` with your scroll progress and remove the automatic advance, and the stain will grow and shrink with the scrollbar." },
    { question: "What happens if a picture is slow to load?", answer: "Each picture becomes a texture when it finishes loading. A transition to a plate that is not ready waits, and the automatic advance skips starting until the next plate has arrived, so the sheet never blooms into an empty frame." },
    { question: "Is the paper texture an image?", answer: "No. The fibres and tooth are a few octaves of value noise stretched along one axis, computed in the shader. That keeps the component to the photographs alone and lets the same pattern steer the feathering of the ink." },
  ],
  related: ["photograph-in-an-enamel-darkroom-tray-under-water-that-ripples-where-the-pointer-drags", "portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph"],
  tags: ["image transition", "gallery", "slider", "ink", "webgl", "shader", "paper", "portrait"],
  height: 820,
  section: true,
  interactive: true,
};

export default meta;
