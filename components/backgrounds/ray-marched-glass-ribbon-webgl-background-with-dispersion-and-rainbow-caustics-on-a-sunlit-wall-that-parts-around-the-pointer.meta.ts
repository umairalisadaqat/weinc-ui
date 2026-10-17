const meta = {
  slug: "ray-marched-glass-ribbon-webgl-background-with-dispersion-and-rainbow-caustics-on-a-sunlit-wall-that-parts-around-the-pointer",
  category: "backgrounds",
  name: "Ray-Marched Glass Ribbon WebGL Background with Dispersion and Rainbow Caustics on a Sunlit Wall That Parts Around the Pointer",
  keyword: "webgl glass background react",
  title: "Ray-Marched Glass Ribbon Background (React, WebGL) | We.Inc",
  description: "Free React background: three twisted glass ribbons ray-marched in one WebGL shader, with real refraction, split colour and spectrum caustics on a warm plaster wall.",
  intro: "A bright full-bleed background that looks like a studio photograph of pulled glass. One fragment shader ray-marches three long ribbons of tinted glass hanging in front of a lime plaster wall. Each ray is refracted into the glass, carried through it, refracted out again and followed to the wall, so you see the wall bent and tinted through every pane, and red and blue are sent along slightly different paths so the edges carry a thin spectrum. A warm lamp high on the left comes through a tall window, so it lands on the wall as one slanted pane of light with a single glazing bar, and a blue fill keeps the shade around it a soft violet. Inside the pane the lamp throws each ribbon's shadow complete with a dark rim, a tinted face and a bright focused line that breaks into colour. The ribbons fold slowly without input. Move a pointer through them and they lean away and turn; click and one half turn runs off along the glass in both directions. On phones the same scene is framed with a wider lens, a tap sends the twist, and vertical swipes still scroll the page.",
  useWhen: [
    "A light-themed landing page needs a first screen with real depth behind a short headline, and a gradient mesh would look like everyone else's.",
    "A studio, glassmaker, fragrance or interiors brand wants a backdrop that reads as a photograph of a physical set.",
    "You are building a sign-in or waitlist page with almost no content and the background has to carry the whole impression.",
    "A portfolio wants one shader piece that visitors can disturb with the pointer and then watch settle.",
  ],
  customize: [
    "`caption` at the top holds the two lines of text. Delete the `<p>` and place your own hero content in the same absolutely positioned layer.",
    "`sizeOf` in the shader gives each ribbon its half width, half thickness and depth. `vec3(0.9, 0.05, 0.0)` makes the middle one a wide thin sheet.",
    "`soakOf` is what each glass absorbs per unit of travel in red, green and blue. Set all three to `vec3(0.05)` for water-clear glass, or raise one channel for a deeper tint.",
    "`KEYCOL` and `FILLCOL` are the lamp and the fill. Swapping them gives a cool pane of light with warm shade around it.",
    "The window is the `pane` line in `wallCol`. Delete the line that subtracts the glazing bar for a plain shaft, or set `pane` to `1.0` to light the whole wall.",
    "`DISP` is how far red and blue separate. `0.03` is close to real crown glass and `0.085` is the exaggerated default.",
    "`SPEED` scales the idle fold and `START_TIME` picks the pose the piece opens in.",
  ],
  accessibility: [
    "The canvas is `aria-hidden`, so a screen reader meets only the caption and the two buttons.",
    "Because the picture moves for longer than five seconds, a real Pause button is always present with `aria-pressed`, and it settles the frame into a clean still when used.",
    "The Twist button is a keyboard route to the same travelling turn a click produces, so nothing is reachable by pointer alone. On narrow screens both buttons shrink to labelled icons 40 pixels across.",
    "With reduced motion the scene is exposed once in its opening pose and the loop stops. The buttons are removed in that case since there is nothing to pause.",
  ],
  faqs: [
    {
      question: "How is the glass refraction calculated?",
      answer: "Each ribbon is a signed-distance shape: a flat strip with rounded, slightly beaded edges, swept along a wandering centre line and twisted as it goes. A ray is marched to the first surface, bent with Snell's law at an index of 1.52, marched through the inside to the far surface, bent again and sent on. That is repeated for up to three panes, with Fresnel reflection of the studio lights added at each front face.",
    },
    {
      question: "Where do the rainbow edges come from?",
      answer: "After the last pane the shader knows how far the glass has turned the ray from its original heading. It looks up the scene three times, once along that heading for green and twice more with the turn made a little smaller for red and a little larger for blue. Wherever the view through the glass crosses a shadow line or the end of the wall, the three colours land in different places.",
    },
    {
      question: "How are the shadows and bright lines on the wall made without tracing photons?",
      answer: "For every point on the wall, the ray toward the lamp is tested against each ribbon's middle sheet with a short root search. That gives the exact distance in from the ribbon's edge, and a profile is applied there: a dark rim where the rounded edge throws light aside, a narrow bright line where it lands, offset per colour, and the tinted transmission of the flat face. The marks blur with distance from the wall because the lamp has a size.",
    },
    {
      question: "Will this hold a smooth frame rate behind real content?",
      answer: "The drawing buffer is capped at roughly 0.9 million pixels and 1.5 device pixels per CSS pixel, and each frame is blended onto a half-float buffer with sub-pixel jitter, which gives clean edges from one ray per pixel. Half a second after it starts the loop reads its own frame times and, if they are long, drops straight to a buffer the machine can carry; after that it gives up one more step whenever frames run long for a while, down to about a third of the width. On an Apple M4 Pro a 1280 by 760 frame costs between five and seven milliseconds. Drawing stops entirely when the section scrolls out of view or the tab is hidden.",
    },
    {
      question: "What is shown if WebGL is not available?",
      answer: "An inline SVG of the same set: the violet wall with its pane of light, three bands that open and close as they turn, and their shadows edged in a spectrum and drifting a few pixels. It uses no images. Software renderers and reduced motion get one real exposure from the shader instead, refined over twenty passes and then left alone.",
    },
    {
      question: "Can I put a headline on top of it?",
      answer: "Yes. The stage is a relatively positioned block with the canvas filling it, so any absolutely positioned layer above the canvas will sit over the glass. Dark text reads best across the top third, where the wall is bare, and the `RISE` constant moves the glass up or down to make room. Keep `pointer-events-none` on wrappers so the ribbons still feel the pointer.",
    },
  ],
  related: [
    "oxblood-silk-satin-webgl-background-with-folds-lit-by-a-lamp-that-follows-the-pointer",
    "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light",
    "ray-traced-glass-cabochon-button-over-a-fashion-print-that-splits-colour-throws-caustics-and-drops-when-pressed",
  ],
  tags: ["background", "webgl", "shader", "ray marching", "glass", "refraction", "dispersion", "caustics"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
