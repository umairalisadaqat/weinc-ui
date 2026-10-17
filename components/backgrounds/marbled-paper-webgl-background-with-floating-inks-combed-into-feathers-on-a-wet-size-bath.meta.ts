const meta = {
  slug: "marbled-paper-webgl-background-with-floating-inks-combed-into-feathers-on-a-wet-size-bath",
  category: "backgrounds",
  name: "Marbled Paper WebGL Background with Floating Inks Combed into Feathers on a Wet Size Bath",
  keyword: "marbled paper shader background react",
  title: "React Shader Background: Marbled Paper Inks | We.Inc",
  description: "Marbling background in WebGL: a shader floats inks on a wet bath, combs them into feathers and lets the pointer drag a stylus. Free React and HTML code.",
  intro: "A bookbinder's marbling tray seen from above, filling the block edge to edge. Indigo was laid first, then vermilion, ochre, bone white and bottle green were thrown on as drops, raked left and right, and pulled through a fine comb into rows of pointed feathers. The bath is still wet, so the pattern creeps a little and the surface mirrors a four-pane window over the bench. Drag the pointer across it and a stylus pulls the inks into a curl that slowly relaxes; leave it alone and an unseen stylus draws loops of its own. The only text is a caption pill in one corner. On a phone the teeth of the comb keep their spacing, so you see fewer columns of feathers at the same size.",
  useWhen: [
    "A bookshop, stationer, bindery or letterpress studio wants its craft on the first screen without commissioning a photograph.",
    "An editorial or publishing page needs an endpaper behind a title, the way a hardback has one inside its cover.",
    "You want visitors to have something to play with while a page loads, and a swirl of ink costs them nothing.",
    "A packaging or fragrance brand built on pattern needs a moving version of its print for a campaign page.",
  ],
  customize: [
    "The five rows in `bath.inks` are the colours thrown onto the tray and `bath.ground` is the one laid first. For a Turkish red sheet set the ground to `[0.42, 0.06, 0.07]` and swap the vermilion row for a dark blue.",
    "`bath.teeth` is the gap between comb teeth. `0.12` gives tight nonpareil feathers, `0.4` wide scallops.",
    "`bath.comb` is how far the comb travelled. At `0` you get the raked bands on their own; past `0.7` the arches stretch into long quills.",
    "`bath.rake` sets the sideways pull of the first pass, which decides how much each colour is drawn out before the comb reaches it.",
    "`SEGMENT_LIFE` is how many seconds a pointer swirl lasts. Raise it to `30` for marks that linger, or set `bath.stylus` to `0` to keep visitors from disturbing the pattern at all.",
  ],
  accessibility: [
    "Both the canvas and the CSS pattern under it carry `aria-hidden`, and the canvas layer ignores pointer events, so buttons you put over the tray receive their clicks.",
    "The pattern contains bone white and near-black within a few pixels of each other, so no text colour is safe on it directly. Keep the caption's solid pill, and give anything you add its own panel.",
    "When the visitor asks for reduced motion the tray is drawn once with a finished flourish in it and the pointer no longer drags ink.",
  ],
  faqs: [
    { question: "How does a shader comb ink without simulating a fluid?", answer: "It works backwards. For each pixel it asks where that speck of ink was before each tool went through, undoing the newest stroke first: the pointer moves, then the comb, then the rake. A tool shifts ink along its own direction by an amount that fades with distance from the tine, so the shift can be subtracted exactly. What is left is a position in the untouched tray, where the colour is looked up from four scatterings of round drops." },
    { question: "Why do the feathers have points?", answer: "Ink right at a comb tooth is carried the full distance and ink between teeth is carried much less, with the pull falling off sharply to either side. That profile turns every straight band into a row of arches with a sharp tip at each tooth, which is the nonpareil pattern found on old book edges." },
    { question: "Why does my swirl fade away?", answer: "The shader keeps the last 24 short stylus moves and nothing else, so there is no stored image of the tray to carry a mark forever. Each move eases out over `SEGMENT_LIFE` seconds and the oldest are released first, which reads as the bath settling." },
    { question: "What is the pale rectangle on the surface?", answer: "A window reflected in the liquid. The surface has a faint swell, so the panes and glazing bars wobble as it moves. `bath.gloss` scales it, and `0` gives a dry printed sheet." },
    { question: "What do browsers without WebGL show?", answer: "A sheet of repeating arches built from one radial CSS gradient in the same five colours, with a soft patch of light over it. Every browser paints that first and the canvas fades in on top once it has drawn a frame." },
    { question: "Is four samples per pixel expensive?", answer: "The feathers thin to less than a pixel, so each pixel averages four nearby lookups to stop them flickering. The canvas is held to `bath.maxPixels`, one million, and the loop stops when the block leaves the screen or the tab is hidden. If you need it lighter, lower `bath.quality` to `0.6` before touching the sample count." },
  ],
  related: ["oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer", "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light"],
  tags: ["webgl", "shader", "marbling", "marbled paper", "ink", "background", "pointer"],
  height: 760,
  section: true,
};

export default meta;
