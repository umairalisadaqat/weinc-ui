const meta = {
  slug: "ray-traced-light-box-history-timeline-with-a-sliding-film-negative-strip-and-a-print-that-develops-beside-it",
  category: "timelines",
  name: "Ray-Traced Light Box History Timeline with a Sliding Film Negative Strip and a Print That Develops Beside It",
  keyword: "react company history timeline",
  title: "Light Box Company History Timeline (React, WebGL) | We.Inc",
  description: "Free React history timeline: pick a year and a strip of colour negatives slides across a glowing light box while its print develops on the desk.",
  intro: "A company story told the way an archivist would go through it. In a dim room a long light box glows on a walnut desk, and a strip of colour negatives lies across the opal glass, one frame for each year. Pick a year and the strip slides along until that frame rests over the brighter lamp in the middle of the box. The lamp dims while the strip is moving and swells again once it stops. On the desk under a warm lamp, the print of that frame clears back to white paper and then comes up again the way a print does in developer: shadows first, then mid tones, then the colour settles. The year, a short heading and a sentence are set in real type beside it. The whole scene is traced in a single fragment shader using your own photographs, which are turned into true negatives on the strip. On phones the box gets shorter, the camera rises to look down on it, and the print and text sit underneath.",
  useWhen: [
    "An about page for a family firm, workshop or studio that has decades of photographs and wants them to feel like an archive rather than a slideshow.",
    "An anniversary page where each milestone has one good picture and two lines of text.",
    "A brand story section that should hold a visitor for a few seconds and reward a click with something that changes physically.",
    "A portfolio piece that shows a photograph used as a texture inside a ray-traced WebGL scene, without any 3D library.",
  ],
  customize: [
    "Edit the `years` array: `year`, `title` and `body` are the words, `photo` is the picture used for both the negative and the print, and `tone` is the colour shown before that photo loads. Six entries fill the atlas exactly; for more, raise the atlas from 3 by 2 cells in both the canvas size and the `photo()` lookup in the shader.",
    "`START` is the year the timeline opens on, and `COMPANY` and `STRAP` fill the small line in the top corner.",
    "`BASE` in the shader is the orange mask of the film, `vec3(0.98, 0.6, 0.3)`. Set it to `vec3(0.9)` for a neutral black and white negative.",
    "`GLOW` is the colour of the light box and `LAMP` the desk lamp. A cooler `vec3(0.9, 0.95, 1.0)` for `GLOW` makes the box feel like daylight tubes.",
    "The strip's spring is in the frame loop: `38` is how hard it is pulled to the chosen frame and `9.5` the drag. Drop the drag to 6 for a strip that coasts further past before settling.",
  ],
  accessibility: [
    "Each year is a real button in an ordered list with a label that gives the year and its heading, and the chosen one carries `aria-current=\"step\"`. The canvas is hidden from assistive technology.",
    "Only the chosen year is in the tab order. Arrow keys, Home and End move between years and take the focus with them.",
    "The year, heading and sentence sit in a polite live region, so the new story is read out after each choice.",
    "With reduced motion the strip jumps straight to the chosen frame, the print shows fully developed and the demo never runs.",
  ],
  faqs: [
    {
      question: "How are the negatives made from ordinary photographs?",
      answer: "The six photos are drawn once into a single atlas texture. Where the strip covers a frame, the shader takes the photo, inverts it and multiplies it by the orange base of colour film, then lets the light box shine through it. So bright skies become dense, dark corners turn clear, and the colours flip to their opposites as on real stock.",
    },
    {
      question: "Why does the print go white before the next one appears?",
      answer: "It reads as a fresh sheet going into the developer. A value runs down to zero, the frame is swapped while the paper is blank, and then it climbs again over about two and a half seconds. Darker parts of the picture pass the threshold sooner, so the shadows show before the highlights.",
    },
    {
      question: "Where do the soft shadows and the blurred reflections come from?",
      answer: "Each frame is one exposure added to a floating point buffer. Every exposure moves the lamp a little, tilts the varnish on the desk a little and shifts the lens, so the hard shadow behind the box and the sharp reflection of its glowing edge both soften as the exposures add up. It is the same idea as a path tracer, spread over time.",
    },
    {
      question: "Do the photos need special hosting?",
      answer: "They must be served with cross-origin access allowed, because WebGL cannot read a picture from another site without it. The Pexels addresses in the demo already do this. If a picture cannot load, its frame and print show the flat `tone` colour instead of breaking.",
    },
    {
      question: "How heavy is it?",
      answer: "The canvas is held to about 1.4 million traced pixels and lowers its own resolution if frames keep running long. The scene is solved with flat planes and a box rather than marching, so each pixel costs only a few texture reads. It stops drawing when the timeline scrolls out of view or the tab is hidden, and goes quiet once a picture has settled.",
    },
    {
      question: "What does a browser without WebGL see?",
      answer: "A pale glowing panel with the strip drawn using CSS filters on the same photographs, the print as an ordinary image, and the year buttons in a row. Choosing a year still slides the strip and changes the story.",
    },
  ],
  related: [
    "ray-marched-oak-groove-stepper-with-a-steel-ball-that-rolls-to-turned-brass-posts-in-raking-window-light",
    "knitted-scarf-project-timeline-that-knits-one-wool-stripe-per-step-as-each-ball-of-yarn-runs-out",
    "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
  ],
  tags: ["timeline", "history", "webgl", "ray tracing", "film", "photography", "about page", "skeuomorphic"],
  height: 740,
  interactive: true,
  section: true,
};

export default meta;
