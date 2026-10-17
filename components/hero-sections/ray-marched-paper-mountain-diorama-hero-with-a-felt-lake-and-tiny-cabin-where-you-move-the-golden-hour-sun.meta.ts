const meta = {
  slug: "ray-marched-paper-mountain-diorama-hero-with-a-felt-lake-and-tiny-cabin-where-you-move-the-golden-hour-sun",
  category: "hero-sections",
  name: "Ray-Marched Paper Mountain Diorama Hero With a Felt Lake and Tiny Cabin Where You Move the Golden Hour Sun",
  keyword: "travel website hero react webgl",
  title: "Paper Mountain Diorama Hero for Travel Sites (React) | We.Inc",
  description: "Free React hero for a travel or outdoor brand: a shader-rendered tabletop diorama of folded paper peaks and a felt lake, lit by a sun you can move.",
  intro: "A first screen for a cabin rental, tour operator or outdoor shop, built around a model on a kitchen table rather than a stock photo. Folded paper mountains in cream, white, sage and terracotta stand at the back of a felt-covered plywood board, with a stitched felt lake, a little orange canoe, a red board-and-batten cabin with lit windows and a ring of stacked felt pines. One fragment shader traces every pixel: soft sun shadows run long across the oak, the paper glows where light passes through a fold, and a shallow focus blurs the front and back of the table the way a close photograph of a miniature does. The camera leans slowly over the set. A slider, the pointer and scrolling the page all move the sun along its low arc. On phones the headline and buttons sit on top and the diorama fills the lower half.",
  useWhen: [
    "A cabin, glamping or lakeside rental brand wants a hero that feels handmade and warm instead of another drone shot of a forest.",
    "A tour or trail company needs a playful first screen that still reads as calm and trustworthy, with one clear booking button.",
    "You have no location photography yet and want a picture that clearly stands for the trip without pretending to be a real place.",
    "A seasonal campaign page wants something visitors fiddle with: dragging the sun from morning to dusk is an invitation to stay a moment.",
  ],
  customize: [
    "`brand` at the top holds the company name, the small line above the headline, both headline lines, the paragraph and the two link labels.",
    "`LAKE`, `MEADOW` and `CABIN` are the felt and paint colours in linear light. A `LAKE` of `[0.02, 0.06, 0.16]` gives a deep night-blue tarn; keep values well under 1.",
    "`SUN` is the colour of the light and `START` where it sits when the page opens. The default of 0.86 opens just after six in the evening; 0.3 gives a cooler mid-morning with the shadows thrown the other way.",
    "Paper colours for each peak live in `shadeHit` in the shader, in the line that picks a colour per `sheet`. The peaks themselves are the five `peak(...)` calls in `mountains`: position, height, base radius and number of folds.",
    "The button colour is `bg-[#1f3b2c]` and the section fallback is `bg-[#f3cfa8]`; change both together with the gradient on the stage so a slow first frame matches.",
  ],
  accessibility: [
    "The headline is a real `h1` and every word on the page is HTML. The canvas is hidden from assistive technology, so a screen reader hears the brand, the headline, the paragraph, two links and a labelled slider.",
    "The sun is moved with a native range input labelled Sun, so arrow keys, Page Up and Page Down all work, and it announces the time of day it stands for rather than a bare number.",
    "With reduced motion the camera holds still and the sun jumps to the slider position instead of easing; each change renders a sharp frame and then the loop stops.",
    "Dark brown text sits on warm cream well above 4.5 to 1. If you darken the backdrop, lighten the text and the slider pill with it.",
  ],
  faqs: [
    {
      question: "How is the diorama drawn without a 3D model or library?",
      answer: "Every object is a distance function in one fragment shader. Each mountain is a cone with a set number of flat sides, so it reads as a sheet folded along straight creases. The lake is a rounded ellipse, the cabin is boxes and a hollow prism roof, and the pines are stacked cones. Rays step through those functions until they touch a surface, then the shader works out its material and light.",
    },
    {
      question: "Where does the miniature look come from?",
      answer: "Mostly from a shallow depth of field. Each frame the lens is moved to a slightly different point on a wide aperture and the results are averaged on a float texture, so only the board is sharp and the table edge and the far room melt away, which the eye reads as something small photographed close up.",
    },
    {
      question: "Why do the paper folds glow on the side away from the sun?",
      answer: "Thin paper and felt let some light through. Faces turned away from the sun receive a share of it, tinted by the paper colour, so a backlit fold looks warm instead of falling to flat grey.",
    },
    {
      question: "What moves the sun?",
      answer: "Three things added together: the slider value, a small amount from the pointer's horizontal position over the section, and how far the section has scrolled through the window. The total eases toward its target with a little lag so the shadows sweep rather than jump.",
    },
    {
      question: "Will it slow a laptop down?",
      answer: "The traced area is capped near one and a half million pixels and one and a half device pixels per CSS pixel. The loop measures its own frame time, drops resolution in steps if frames run long, writes the current frame rate to a data attribute on the canvas and stops when the section is off screen or the tab is hidden.",
    },
  ],
  related: [
    "ray-marched-glass-perfume-bottle-hero-that-bends-a-giant-painted-headline-through-amber-scent-on-a-pink-paper-sweep",
    "mountain-lodge-photo-hero-with-drifting-cloud-headline-and-glass-booking-cards",
    "snow-globe-you-shake-with-drifting-flakes-over-a-tiny-cabin-on-a-turned-walnut-base",
  ],
  tags: ["hero", "webgl", "ray marching", "shader", "diorama", "travel", "outdoor", "paper craft"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
