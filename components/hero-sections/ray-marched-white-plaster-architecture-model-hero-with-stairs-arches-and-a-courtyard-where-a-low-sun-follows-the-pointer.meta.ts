const meta = {
  slug: "ray-marched-white-plaster-architecture-model-hero-with-stairs-arches-and-a-courtyard-where-a-low-sun-follows-the-pointer",
  category: "hero-sections",
  name: "Ray-Marched White Plaster Architecture Model Hero With Stairs, Arches and a Courtyard Where a Low Sun Follows the Pointer",
  keyword: "architecture studio website hero react",
  title: "Plaster Architecture Model Hero for Studios (React) | We.Inc",
  description: "Free React hero for an architecture practice: a shader-lit plaster study model whose long sun shadows sweep across it as the pointer moves.",
  intro: "A first screen for an architect, landscape designer or builder of considered houses, made around the thing those studios actually keep on their desks: a white study model. A cast plaster plinth carries an arcade of round-headed openings, a wing wall pierced by slot windows, a pergola of slender columns and rafters, a stair of eight treads climbing to a terrace and a tower with a deep niche. The courtyard floor is the only colour, small terracotta tiles that echo the button. One fragment shader traces every pixel with nearly hard sun shadows, so the arches and rafters lay sharp stripes over the tiles and the whole model throws a long shadow across the paper. Move the pointer and the low sun swings around the model like the hand of a sundial; leave it alone and the day passes slowly by itself.",
  useWhen: [
    "An architecture or interiors practice wants its first screen to feel like the studio itself rather than a stock render of a glass tower.",
    "A landscape or courtyard-house designer needs a hero that says light and shade are the material they work in.",
    "A builder of bespoke homes wants something calm and serious, with one clear way to start a conversation.",
    "A design school or exhibition page wants a quiet, monochrome picture that rewards a visitor for moving the mouse.",
  ],
  customize: [
    "`brand` at the top holds the studio name, trade, the small line above the headline, the three headline lines, which word turns terracotta, the paragraph, both link labels and the model caption.",
    "`PLASTER` and `CLAY` are the two materials in linear light. A cooler plaster such as `[0.78, 0.79, 0.8]` reads as fresh gypsum; keep values under 1.",
    "`SUN` is the colour of the light and `START` where it opens on its arc. 0.64 is late afternoon; 0.3 is mid-morning with the shadows thrown the other way.",
    "The building pieces are separate functions in the shader (`arcade`, `wing`, `pergola`, `stairs`, `tower`). Change a box size or a spacing value to make your own scheme.",
    "The button colour is `bg-[#a5432a]` and the section fallback is `bg-[#ece7df]`. Change the button, the italic word and the slider thumb together so the accent stays single.",
  ],
  accessibility: [
    "The headline is a real `h1` and all copy is HTML; the canvas is hidden from assistive technology.",
    "A native range input labelled Sun moves the light from the keyboard, and announces the time of day it stands for.",
    "With reduced motion the camera holds still and the sun stops sweeping by itself; moving the slider renders one sharp frame and the loop rests.",
    "Near-black text on warm white is far above 4.5 to 1, and the cream button label on terracotta passes for its size.",
  ],
  faqs: [
    {
      question: "How is the model built without a 3D file?",
      answer: "Each part is a distance function. Walls are rounded boxes, arched openings are a rectangle capped with a circle and subtracted from the wall, and repeated openings, columns and rafters come from folding space so one shape is reused along a row.",
    },
    {
      question: "Why are the shadows so crisp?",
      answer: "The shadow ray treats the sun as a very small source, so the edge stays sharp near the object that casts it and softens only slightly with distance, which is how sunlight behaves on a real model.",
    },
    {
      question: "Why does the shade look slightly cool next to the lit plaster?",
      answer: "Shaded faces are lit only by the sky and by light bounced off nearby walls, and the sky term is a touch cooler than the sun. That small temperature shift is what makes white plaster read as white in both light and shade.",
    },
    {
      question: "What moves the sun?",
      answer: "The pointer's position across the section sets where the sun stands, from low on the left in the morning to low on the right in the evening, and it eases there with a little lag. When the pointer leaves, the sun stays put and the slider takes over.",
    },
    {
      question: "Will it run on an ordinary laptop?",
      answer: "Tracing is capped near 1.3 million pixels and 1.5 device pixels per CSS pixel, the bounds of the model are tested before marching, the frame rate is written to the canvas, resolution drops if frames run long, and rendering stops when the section is off screen.",
    },
  ],
  related: [
    "white-card-architectural-model-of-a-corner-shop-whose-windows-light-blue-as-a-booking-an-order-and-a-message-arrive",
    "bronze-garden-sundial-whose-shadow-points-at-the-time-and-polished-arc-marks-opening-hours",
  ],
  tags: ["hero", "webgl", "ray marching", "shader", "architecture", "plaster", "studio", "serif"],
  height: 780,
  interactive: true,
  section: true,
};

export default meta;
