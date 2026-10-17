const meta = {
  slug: "typed-sentence-of-blue-light-on-a-dark-studio-floor-that-stands-up-as-a-ray-marched-homepage-with-floating-layers",
  category: "originals",
  name: "Typed Sentence of Blue Light on a Dark Studio Floor That Stands Up as a Ray Marched Homepage with Floating Layers",
  keyword: "webgl ray marching hero react prompt to website",
  title: "React WebGL Hero: A Sentence Becomes a Homepage | We.Inc",
  description: "WebGL piece: type a sentence, watch it glow on a dark studio floor, then a ray-marched homepage stands up with floating layers. Free React and HTML code.",
  intro: "One rendered photograph of a dark studio that happens to be live. A sentence about a surf school lies on a polished graphite floor, written in pale blue light and stretched the way road lettering is so it reads from where the camera stands. Behind it a thick warm white sheet stands on its bottom edge. Its menu bar, its headline, a black and white photograph and a blue button each hover a different distance in front of the paper and drop soft shadows back onto it, and the button is the only coloured lamp in the room. Everything is drawn by a fragment shader that marches rays through distance fields, so the floor mirrors the sheet, the glossy parts mirror two softboxes, and the foreground falls out of focus. The field at the bottom is a real text input: whatever you type is laid on the floor letter by letter, and pressing return folds the sheet onto its back and stands it up again with your sentence as the headline. Left alone, it types three sentences of its own. On a phone the camera steps back, the sheet is centred and the sentence wraps to three lines.",
  useWhen: [
    "The first screen of a product that turns a written request into a page, when you want visitors to try the idea with their own words before they scroll.",
    "A launch or waitlist page that needs one dark, cinematic object instead of a product screenshot.",
    "A conference title slide or studio homepage where a single live render is the whole composition.",
    "A playground for a text field whose result should feel physical: point `compose` at your own function and the sheet prints whatever it returns.",
  ],
  customize: [
    "`DEMOS` holds the three self-typed sentences and the page written for each: brand, menu items, headline with a line break, small print, button label and which photograph to use.",
    "`compose` decides what an arbitrary sentence becomes. It is a plain function of keywords today; replace its body to call your own logic and return the same `Site` shape.",
    "In the `SCENE` shader, `BLUE` is the accent in linear colour, `PAPER` the sheet and `KEY` the direction of the white light. The `uEx` multipliers inside `map` (0.11, 0.30 and 0.44) are how far the menu, photograph and button float.",
    "`HOLD` is the pause on a finished page in seconds. The spring pairs in `tilt` and `ex` are stiffness and damping: lower the second number for more swing when the sheet lands.",
    "Camera position, lens and the floor rectangle that holds the sentence are the `az`, `el`, `dist`, `tgt` and `sent` values at the top of `draw`, with separate numbers for phones.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The same page exists as real markup underneath it, with an `h2`, the small print and the photograph with alt text, and a polite live region reads out the brand and headline each time a new page stands up.",
    "The input has a label, a visible focus state on its pill and a named submit button, so typing a sentence and pressing return works without a pointer. Moving the pointer only nudges the camera.",
    "With reduced motion the loop never runs: one frame of the finished scene is rendered, and return swaps to the new finished page without the fold, the swing or the ink line.",
    "If WebGL 2 is missing or the context is lost, the element version of the scene stays on screen and the form keeps updating it.",
  ],
  faqs: [
    {
      question: "How is the scene drawn without a 3D library?",
      answer: "Two fragment shaders on one full screen triangle. The first marches each pixel's ray through signed distance functions for the floor, the curved back wall, the sheet and three rounded slabs, then shades the hit with a soft shadow march, five ambient occlusion taps, a procedural softbox environment and one mirror bounce for the floor. The second blurs by depth, adds bloom from the mip chain, a vignette and grain.",
    },
    {
      question: "How does typed text get into a shader?",
      answer: "Text is set on offscreen 2D canvases and uploaded as textures: one for the sentence, one for the small print on the sheet, and one sheet of parts holding the headline, menu labels, button label and photograph. The sentence canvas is redrawn and uploaded again on every keystroke, which is a few milliseconds of work.",
    },
    {
      question: "Why do the headline letters cast shadows if they are only a texture?",
      answer: "The headline is treated as a cut sheet floating at its own depth. The camera ray and the shadow ray are each intersected with that plane and the letter mask is sampled there. For shadows the mask is read from a blurrier mip level the further the light has travelled, which gives the soft edge.",
    },
    {
      question: "Will it run on a phone or an older laptop?",
      answer: "The renderer never pushes more than about one and a half million pixels and starts at the screen's pixel ratio capped by `MAX_SCALE`. When frames take longer than 30 milliseconds for a short while it lowers the internal resolution in steps down to `MIN_SCALE` and lets the browser scale the canvas up. It stops completely when scrolled out of view or when the tab is hidden.",
    },
    {
      question: "Does the page really come from my sentence?",
      answer: "The headline is your sentence, set as large as it fits in the headline area, and the button label, menu and photograph are picked by matching a few words such as bakery, studio or surf. It is a demonstration of the gesture, so wire `compose` to your own generator if you want real copy.",
    },
    {
      question: "Can I use my own photographs?",
      answer: "Yes. Replace the addresses in `PHOTOS`. They are loaded with `crossOrigin` set to anonymous because the image is copied into a texture, so the host has to allow that; if it does not, the card falls back to a drawn study of light and shade. The shader converts whatever you supply to black and white so the blue stays the only colour.",
    },
  ],
  related: ["glass-prism-that-splits-a-beam-carrying-one-sentence-into-a-homepage-made-of-light", "pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage", "machined-aluminium-prompt-block-with-a-slot-that-swallows-a-typed-card-and-hands-back-a-printed-homepage"],
  tags: ["webgl", "ray marching", "shader", "3d", "prompt", "hero", "text input", "originals"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
