const meta = {
  slug: "portrait-studio-hero-with-a-giant-headline-that-passes-behind-the-sitter-and-in-front-of-her",
  category: "hero-sections",
  name: "Portrait Studio Hero with a Giant Headline That Passes Behind the Sitter and in Front of Her",
  keyword: "text behind image hero react",
  title: "React Text Behind Image Hero with Real Depth | We.Inc",
  description: "Hero with a giant headline around a studio portrait: one word passes behind the sitter and one in front, cut out in the browser. Free React and HTML code.",
  intro: "A red studio wall, one portrait and two enormous words. FACE sits behind the sitter so her hair covers the middle of it, and VALUE runs across her in front. Nobody prepared a transparent image for this: when the photograph loads, the component studies the plain backdrop around the edges of the frame, works out where the backdrop stops and the person starts, and draws only the person on a canvas between the two words. The three layers then slide by different amounts as the pointer moves, the sitter drops a soft shadow onto the word behind her and the front word drops one onto her, so the stack reads as three sheets with space between them. Left alone, the view drifts slowly from side to side. On a phone the words are refitted to the screen width and the copy line and button stay pinned to the bottom corners.",
  useWhen: [
    "A photographer, stylist or casting agency has one strong studio portrait and a name short enough to set at poster size.",
    "A fashion or beauty launch page needs a first screen that looks art directed without commissioning a retouched cut-out.",
    "You are building a speaker, artist or founder page and want the person to physically interrupt the headline.",
    "A lookbook cover needs a single figure and a season name, with the rest of the page left quiet.",
  ],
  customize: [
    "Swap `hero.photo` for any picture shot on one plain backdrop colour, with the backdrop visible along the top and both sides. Set the section background (`bg-[#d62a28]` and the radial gradient) to that same colour so the cut edge disappears.",
    "`KEY_FROM` and `KEY_TO` set how different from the backdrop a pixel must be to count as the sitter. Raise both if bits of wall survive around the hair; lower them if a pale sleeve is being eaten.",
    "`hero.behind` and `hero.inFront` are the two words. Both are scaled to the same measure, `Math.min(el.clientWidth * 0.8, 960)`, so a longer word simply comes out shorter in height.",
    "The depth of the parallax is the three multipliers `-26`, `12` and `46` in the `useTransform` lines. Keep the front one largest and the back one negative, or the layers stop reading as near and far.",
    "Where each word crosses the figure is `sm:top-[5%]` on the back word and `sm:bottom-[15%]` on the front one.",
  ],
  accessibility: [
    "The headline is a real `h1` holding both words in reading order; the two giant painted words are hidden from assistive technology so the phrase is announced once.",
    "The photograph stays in the page as an `img` with its alt text even after the canvas version takes over visually.",
    "The pointer only shifts decoration. The copy line and the button never move, and the button has a visible focus ring against the red.",
    "With reduced motion the layers hold still in their composed positions, and the cut-out and both shadows are still drawn.",
  ],
  faqs: [
    { question: "How is the person separated from the background without a transparent PNG?", answer: "The component reads the pixels along the top and sides of the photo, fits a smooth colour surface to them so that uneven studio lighting is accounted for, and measures how far every other pixel is from that surface. Pixels close to it are backdrop. It then floods inward from the frame edges so that only backdrop connected to the outside is removed, which stops lips or jewellery in a similar colour from being punched out. Larger enclosed gaps, such as the space between an arm and the neck, are cleared in a second pass." },
    { question: "What kind of photo works for a text-behind-subject effect like this?", answer: "A studio shot on seamless paper or a painted wall in one colour that the subject is not wearing. Dark hair on a bright wall, or bright clothes on a dark wall, cut most cleanly. A busy street scene will not work with this method; for that you need an image that was cut out beforehand." },
    { question: "Can I use an image that already has a transparent background?", answer: "Yes. Put it in a plain `img` where the canvas is and delete the `cutOut` call. The layering, parallax and both shadows are ordinary CSS on the three stacked elements, and a drop-shadow filter follows the transparent outline of a PNG just as it does the canvas." },
    { question: "What happens if the photograph cannot be read by the canvas?", answer: "Reading pixels needs the image host to allow cross-origin access. If it does not, the attempt throws, the component catches it and shows the untouched photograph with soft faded edges, and the page is still a complete hero with both words in place." },
    { question: "Does the cut-out cost anything while the page is running?", answer: "No. It runs once when the image loads, on a copy 560 pixels wide, and the result is kept in a canvas. After that the browser is only moving three layers with transforms." },
  ],
  related: ["layered-paper-cut-word-with-a-photograph-drifting-behind-the-letters", "app-landing-hero-with-phone-mockup", "bakery-hero-whose-headline-is-the-shadow-of-window-lettering-thrown-on-a-wall-by-a-moving-sun"],
  tags: ["hero", "text behind image", "portrait", "parallax", "depth", "cut-out", "canvas", "editorial"],
  height: 800,
  section: true,
};

export default meta;
