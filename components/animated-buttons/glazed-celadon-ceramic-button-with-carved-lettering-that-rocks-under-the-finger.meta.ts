const meta = {
  slug: "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
  category: "animated-buttons",
  name: "Glazed Celadon Ceramic Button with Carved Lettering That Rocks Under the Finger",
  keyword: "ceramic button react",
  title: "React Ceramic Button with Carved Lettering | We.Inc",
  description: "Button fired in celadon glaze on a canvas: carved letters where the green pools, a crackle net and a rock under the finger. Free React and HTML to copy.",
  intro: "A single button made to look like a small piece of stoneware under a pale green celadon glaze, lying on a plaster shelf. Nothing in it is a picture. When it mounts, the component builds a height for every pixel of the piece: a rounded bar with a soft dome, a line scored round the rim and your label cut into the clay. From that height it works out where glaze would run thin and where it would pool, so the letters fill with deeper green and the ridges beside them go pale, the way carved celadon really fires. A crackle net, a scatter of iron specks and a bare clay foot are baked in on top. Each frame the surface is lit again, and the gloss mirrors a studio window with its glazing bars. Press the button and it knocks down onto the shelf and rocks toward the side you touched, so the window slides across the glaze. It toggles between two states and stays slightly sunk while on. The piece is 340 pixels wide on phones and half as large again from tablet width.",
  useWhen: [
    "A pottery studio, homeware shop or cafe site wants its one booking button to look like the things it sells.",
    "A landing page is calm and mostly empty, and a single handmade-looking object should carry the first screen.",
    "You need a toggle that feels weighty, such as holding a place, saving a piece or joining a waiting list.",
    "A portfolio wants to show per-pixel lighting done on a plain 2D canvas with no graphics library.",
  ],
  customize: [
    "`LABEL` is the text carved into the clay. Around fourteen characters fit; longer text is squeezed to the width, so drop the `41` in the font line to about 34 instead.",
    "`THIN` and `DEEP` are the glaze colours where it is shallow and where it pools. `[226, 214, 190]` with `[150, 96, 52]` gives a honey glaze, `[206, 220, 236]` with `[52, 86, 150]` a cobalt one.",
    "The crackle is controlled by `cell` (the size of each crackle island, 10) and the final `0.34` on the `craze` line (how dark the lines are). Set that number to 0 for a clean glaze.",
    "`IDLE_NOTE` and `HELD_NOTE` are the two captions. The second shows while `aria-pressed` is true.",
    "How far the piece rocks is the `0.06` and `0.045` in the frame loop. Halve them for a heavier, flatter tile.",
  ],
  accessibility: [
    "The canvas is hidden from assistive tech. A real `button` lies over it with the label as screen reader text and `aria-pressed` for the held state.",
    "Space and Enter work as on any button, and a keyboard press still plays the knock so sighted keyboard users get the same feedback.",
    "The caption under the piece is a polite live region, so the change from six seats to five is spoken.",
    "With reduced motion the glaze is lit once, the window stops drifting and the button simply sits lower when it is on.",
  ],
  faqs: [
    {
      question: "How does the glaze know to go darker inside the letters?",
      answer: "After the height map is built, the code measures how much each point curves. A hollow has positive curvature and a ridge has negative. That one number is blurred a little and used as glaze thickness, which then picks a colour between `THIN` and `DEEP`. Carved strokes are hollows, so they collect colour, and their upper edges are ridges, so they break pale.",
    },
    {
      question: "Is the carved text a font or an image?",
      answer: "It is live text. The label is drawn once to an offscreen canvas in an italic serif from the visitor's system, softened, and subtracted from the height map. Change `LABEL` and the new words are carved the next time the component mounts.",
    },
    {
      question: "Why does a hard ceramic piece move at all when I press it?",
      answer: "It does not bend. It behaves like a tile resting on a soft pad: it drops a few pixels, its shadow tightens, and it tips toward your finger. The tip is added to every surface normal before lighting, which is why the reflected window slides instead of the piece changing shape.",
    },
    {
      question: "Will lighting every pixel on each frame slow a page down?",
      answer: "The loop touches only the pixels of the piece itself, uses typed arrays prepared once, and avoids any per-frame allocation. It pauses when the button is scrolled out of view or the tab is hidden. On a page with many of these, keep one animated and render the others with reduced motion behaviour.",
    },
    {
      question: "Can I use it as a plain action button instead of a toggle?",
      answer: "Yes. Remove `aria-pressed` and the `heldRef` line in `toggle`, then call your own handler there. The press animation is driven by pointer and key events, so it keeps working without the state.",
    },
  ],
  related: ["thick-glass-pill-button-that-refracts-a-portrait-and-flattens-when-pressed", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["ceramic", "glaze", "canvas", "skeuomorphic", "toggle", "press", "material"],
  height: 800,
  interactive: true,
};

export default meta;
