const meta = {
  slug: "cinema-marquee-headline-with-letter-tiles-that-slide-along-rails-and-chasing-bulbs",
  category: "text-effects",
  name: "Cinema Marquee Headline with Letter Tiles That Slide Along Rails and Chasing Bulbs",
  keyword: "marquee sign text effect react",
  title: "React Marquee Sign Text Effect with Bulbs | We.Inc",
  description: "Cinema marquee on a canvas: letter tiles slide along rails and clack together inside a red frame of chasing bulbs. Free React code and HTML to copy.",
  intro: "A picture-house readerboard at night. Three lines of changeable letters hang on rails in front of backlit opal glass, the top line in red, and a red enamel channel of filament bulbs runs round the outside between polished trims. The sign opens finished, with all three lines hung and every lamp lit, and holds that for four seconds. When a line is changed, its new tiles are fed in from the right hand end of the rail: every tile is pulled to its place by a spring, cannot pass the one in front, and rocks on its rail when it is hit, so the line arrives as a small pile-up that shakes itself straight. After the hold the bulbs chase two on, one off, and each filament warms from a dull ember to white and cools more slowly than it lights. One lamp is loose and flickers. The bottom line is swapped every few seconds until the visitor types their own three lines. On a phone the box is drawn taller so the letters stay legible, and long lines are narrowed to fit.",
  useWhen: [
    "A venue, cinema club, comedy night or gig listing wants tonight's bill as the first thing on the page.",
    "A launch or opening announcement needs three short lines with some showmanship.",
    "A restaurant or bar with a late licence wants a sign that suits a dark, warm page.",
    "A portfolio or event microsite wants a headline the visitor can retype and screenshot.",
  ],
  customize: [
    "`MESSAGE` is the opening text, one string per rail, and `LAST_ROW` is the list the bottom rail cycles through. Add a fourth string to `MESSAGE` and a fourth rail is drawn.",
    "`RED_ROWS` lists which rails use red letters. Use `[]` for an all black board or `[0, 2]` for red top and bottom.",
    "`ENAMEL` is three hex values for the painted channel, top to bottom. `['#2f6f6a', '#1d4a47', '#0f2c2a']` gives a teal frame.",
    "Chase speed is the `7.5` in `step += dt * 7.5`, in lamps per second. The warm-up and cool-down rates are the `20` and `8.5` on the line that eases `b.v`.",
    "The pile-up comes from the tile spring, `-150 * tl.x - 19 * tl.v`. Raise 19 towards 26 and the tiles glide in without bouncing.",
  ],
  accessibility: [
    "The three lines are a real `h2` kept for screen readers and search, updated as the visitor types. The canvas is hidden from assistive technology.",
    "The words are changed through a labelled text box and the bulb pattern through three buttons that behave as a radio group, so nothing needs a pointer.",
    "With reduced motion the tiles are already hung, the bulbs are all on at a steady level and nothing chases or flickers.",
    "Unscrewing a lamp by tapping it is a pointer extra and carries no information.",
  ],
  faqs: [
    {
      question: "How are the bulbs made to look hot instead of just yellow?",
      answer: "Each lamp has a brightness that eases towards its target, quickly when lighting and slowly when cooling, like a filament. Three small pictures are layered by that number: an orange ember that appears first, a white core that only shows above a third brightness, and a wide glow added to whatever is underneath so the enamel round the lamp picks up the light.",
    },
    {
      question: "Why do the letters bump into each other?",
      answer: "Tiles on one rail are solved in order from the left. After each spring step a tile that has slid into the one in front is moved back to touching, most of its speed is taken away and part of it is handed to the tile it hit, which also gets a small twist. The result is a clack that travels up the line.",
    },
    {
      question: "Which font does the sign use?",
      answer: "It asks for Impact, which most desktops have, and falls back to a narrow bold sans. The capital H is measured when the sign is built: the type is sized so capitals fill seven tenths of a tile, and a wide fallback face is squeezed sideways to marquee proportions.",
    },
    {
      question: "Does it redraw everything each frame?",
      answer: "No. The frame, enamel, glass, rails and tube glow are painted once to a hidden canvas and copied each frame. Only the tiles and lamps are drawn live, and the loop stops when the sign is off screen or the tab is hidden.",
    },
    {
      question: "Can I stop the bottom line changing?",
      answer: "Yes. Leave `LAST_ROW` with a single entry, or remove the interval effect near the end of the component. It also stops for good as soon as the visitor edits the text.",
    },
  ],
  related: ["split-flap-station-board-countdown-that-clatters-down-to-a-launch-date", "finger-written-words-in-window-condensation-that-drip-fog-over-and-wipe-clear", "hand-gilded-shop-fascia-headline-where-gold-leaf-is-laid-brushed-off-and-burnished"],
  tags: ["marquee", "cinema", "bulbs", "sign", "canvas", "letters", "physics"],
  height: 760,
  interactive: true,
};

export default meta;
