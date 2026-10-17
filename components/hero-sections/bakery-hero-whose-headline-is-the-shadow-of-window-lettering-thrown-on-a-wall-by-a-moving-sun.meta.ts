const meta = {
  slug: "bakery-hero-whose-headline-is-the-shadow-of-window-lettering-thrown-on-a-wall-by-a-moving-sun",
  category: "hero-sections",
  name: "Bakery Hero Whose Headline Is the Shadow of Window Lettering Thrown on a Wall by a Moving Sun",
  keyword: "window light shadow hero css",
  title: "React Hero Section with a Window Shadow Headline | We.Inc",
  description: "Hero section where sun through a shop window warms a plaster wall and the headline is the shadow of lettering on the glass. Free React and HTML to copy.",
  intro: "A dim plaster wall with one patch of morning sun on it. The patch has the outline of a shop window, with a row of small panes across the top, and inside it the headline appears as shadow: the words are signwriting on the glass, and what you read is where they stop the light. The sun moves. As it drops, the patch stretches along the wall, its slope flattens and the light turns more orange, so the lettering leans and lengthens the way a real shadow does through a morning. A branch outside sways and throws a softer shadow across one corner, and the edge of a second, plain window shows further along the wall. Moving the pointer left and right drags the sun by hand. The wall has a trowelled plaster grain laid over light and shade alike, which is what stops it looking like a flat colour. On a phone the window narrows, the type scales with it, and the line of copy and the button sit in the shade at the bottom left.",
  useWhen: [
    "A bakery, cafe or florist that opens early wants the first screen to feel like the shop at that hour.",
    "A boutique hotel, studio or gallery has a short line to say and would rather set a mood than show a photograph.",
    "You need a hero with atmosphere but no image budget and no image weight: everything here is text, colour and one filter.",
    "A seasonal or opening-soon page wants a quiet screen with a single action.",
  ],
  customize: [
    "`SHADE` is the wall out of the sun and `SUNLIT` is the wall in it. Every shadow, including the headline, is drawn in `SHADE`, so change the pair together and keep them far apart in lightness.",
    "The headline is `hero.lines`, one entry per line, and its size is the `.bakery-shadow-hero-head` rule in the style block (`14vw` on phones, `min(10.6vw, 140px)` above).",
    "The reach of the sun is in the `cast` line: `0.8 + 0.5 * a` is how far the patch stretches and `0.21 - 0.13 * a` is its slope. Make both second numbers `0` for a patch that never changes shape.",
    "The pace of the unaided pass is `t / 3800` in `useAnimationFrame`; a larger divisor gives a slower morning.",
    "Remove the `svg` that holds the branch for bare glass, or edit the `leaves` array to thin it out. Its softness is the `sm:blur-[6px]` class on that element.",
  ],
  accessibility: [
    "The headline is a real `h1` made of live text, so it is read, selected and translated like any heading even though it is styled as a shadow.",
    "The shadow colour against the sunlit colour is kept above three to one, the level asked of large text. Check that again if you change either constant.",
    "The copy and the link sit on the dark wall in near white and do not move with the light; the link shows a white focus ring.",
    "With reduced motion the sun holds at the middle of its pass and the branch is still.",
  ],
  faqs: [
    { question: "How is the shadow text made without an image?", answer: "The lit patch is a block in the sunlit colour and the heading inside it is set in exactly the wall's shade colour, so each letter reads as a hole in the light. A small blur on the whole patch softens the letters and the window's outline by the same amount, and one matrix transform leans and stretches all of it together." },
    { question: "Why does the patch of light slant instead of sitting square?", answer: "The window is imagined at right angles to the wall, a little way along it. Sunlight coming in at an angle lands further along the wall the further it started from the corner, and lower the further it travels. That gives a stretch along the wall and a downhill slope, both set by the sun's angle, which is what the two changing numbers in the matrix are." },
    { question: "What gives the wall its plaster look?", answer: "An SVG filter. One layer of fine noise is lit from the side to raise a grain, a second layer of very broad noise adds uneven staining, and the result is multiplied over the whole section. Because it lies on top of the light as well as the shade, the sun appears to fall on a surface." },
    { question: "Does the blur filter make it slow?", answer: "The patch is blurred once and kept as a single layer. Moving the sun only changes that layer's transform and the opacity of an orange tint, which the browser can do without repainting. The plaster filter is also computed once, since nothing inside it changes." },
    { question: "Can I put a logo in the window instead of words?", answer: "Yes. Place an inline SVG in the patch with its fill set to `SHADE`. Keep a text heading in the page for search engines and screen readers, visually hidden if it would repeat the logo." },
  ],
  related: ["portrait-studio-hero-with-a-giant-headline-that-passes-behind-the-sitter-and-in-front-of-her", "olive-oil-bottle-hero-turning-on-a-seamless-backdrop-with-the-headline-orbiting-round-the-glass"],
  tags: ["hero", "shadow", "window light", "sunlight", "plaster", "text effect", "svg filter", "bakery"],
  height: 800,
  section: true,
};

export default meta;
