const meta = {
  slug: "olive-oil-bottle-hero-turning-on-a-seamless-backdrop-with-the-headline-orbiting-round-the-glass",
  category: "hero-sections",
  name: "Olive Oil Bottle Hero Turning on a Seamless Backdrop with the Headline Orbiting Round the Glass",
  keyword: "rotating product hero section react",
  title: "React Rotating Product Hero with Orbiting Text | We.Inc",
  description: "Product hero where a dark glass bottle turns on a yellow backdrop and the headline circles it as a ring of type, passing behind. Free React and HTML code.",
  intro: "A single bottle of olive oil stands on a butter-yellow paper sweep and turns slowly, the way a product does on a photographer's turntable. There is no image file: the bottle is computed in a canvas from a side profile, with a matte black capsule, dark green glass that mirrors a studio window, oil glowing where light gets through the far edge, and a printed paper label that wraps the curve and travels round with the glass, followed by a smaller back label. The headline is not set above it. It is a ring of serif letters orbiting the bottle the other way, growing as each letter comes forward and mirroring and fading as it goes round the back, where the glass hides it. Drag the bottle to spin it and it coasts before settling into its own pace again. On a phone the bottle and ring shrink to fit and the one line of copy and the button sit centred underneath.",
  useWhen: [
    "A food, drink or skincare maker sells one hero product and wants the first screen to be that product and almost nothing else.",
    "You have no product photography yet and need something that looks shot in a studio until the real pictures arrive.",
    "A limited release or pre-order page needs a single calm object and one button.",
    "A packaging or label designer wants to show a wrap-around label in the round instead of as a flat artboard.",
  ],
  customize: [
    "The words printed on the paper are in `hero.label` and `hero.back`, and the artwork is drawn in `printLabels`. Replace its drawing calls with `c.drawImage(yourArtwork, ...)` to wrap your own flat label round the glass.",
    "The silhouette is the `profile` function: it returns the radius at each height, in units of the body radius. Lengthen the `0.98` to `1.9` span for a taller neck, or change the `1` for the body to make a carafe that tapers.",
    "Glass colour is the three lines that start `cr = 9`, `cg = 17`, `cb = 12` in `paintBottle`. Raise the red figure for amber glass; raise all three evenly for clear flint.",
    "`BOTTLE_TURN` and `RING_TURN` are the seconds per revolution of the bottle and of the type. `TILT` is how far the camera looks down, and it bends the label edges and the ring together.",
    "The stage colour is `bg-[#e6d49c]` plus the two gradient layers under it; the shadow tint is `rgba(58,44,8,...)` in `pool`, which should stay a darker version of the stage.",
  ],
  accessibility: [
    "The headline is a real `h1` read once in order. The orbiting letters are decoration and hidden from assistive technology, since half of them are mirrored at any moment.",
    "The bottle is covered by a native button with a spoken label, so it can be focused and turned with the left and right arrow keys as well as dragged.",
    "The copy line and the reserve link are ordinary text and never move; the link keeps a visible focus ring on the yellow.",
    "With reduced motion nothing turns by itself: the label faces front and the headline sits centred on the near side of the ring. Dragging and the arrow keys still work.",
  ],
  faqs: [
    { question: "How can a product rotate in a hero without a 3D model or a set of turntable photos?", answer: "A bottle is a shape spun round an axis, so one side profile describes all of it. For every pixel the code works out which height and which angle round the bottle it is looking at, then shades that point. The glass looks the same from every side, so it is painted once. Only the paper label changes as the bottle turns, and that is redrawn each frame from a flat print." },
    { question: "How is the flat label wrapped round the curved glass?", answer: "The label is first drawn flat on a hidden canvas as a strip the length of the bottle's circumference. Each frame, every one-pixel column of the visible label copies the slice of that strip it faces. Columns near the edges of the bottle cover a wider slice of print, which is what squeezes the lettering as it turns away. A shading layer is then laid over the paper so it darkens toward the sides." },
    { question: "How do the letters go behind the bottle?", answer: "Each letter is its own element. A small matrix places it on a tilted circle, narrows it by the cosine of its angle so it turns edge on at the sides, and flips it once it is round the back. Letters on the near half are stacked above the canvas and letters on the far half below it, so the bottle covers them where they overlap." },
    { question: "Will a long headline work on the ring?", answer: "The type size is calculated so the phrase, set twice with a dot between, exactly closes the circle. A longer phrase therefore comes out smaller. Up to about twenty characters keeps the letters large on a desktop; beyond that, set it once round the ring by changing `letters` to a single copy." },
    { question: "Is it heavy to run?", answer: "The glass is computed one time when the section is laid out, and again only if it is resized. Each frame after that is one image copy, a few hundred thin slices for the label and a transform on each letter. The loop stops while the section is off screen or the tab is hidden." },
  ],
  related: ["portrait-studio-hero-with-a-giant-headline-that-passes-behind-the-sitter-and-in-front-of-her", "app-landing-hero-with-phone-mockup", "bakery-hero-whose-headline-is-the-shadow-of-window-lettering-thrown-on-a-wall-by-a-moving-sun"],
  tags: ["hero", "product", "bottle", "rotating", "text on a circle", "canvas", "glass", "label", "turntable"],
  height: 820,
  section: true,
  interactive: true,
};

export default meta;
