const meta = {
  slug: "three-sided-billboard-photo-gallery-with-prism-slats-that-rotate-in-a-wave-between-pictures",
  category: "galleries",
  name: "Three-Sided Billboard Photo Gallery with Prism Slats That Rotate in a Wave Between Pictures",
  keyword: "rotating slats image transition react",
  title: "React Image Transition with Rotating Slats | We.Inc",
  description: "Gallery built like a three-sided roadside billboard in WebGL: prism slats rotate in a wave to change between photographs. Free React and HTML code to copy.",
  intro: "A roadside sign of the kind that shows three adverts in turn, shrunk to a card. The picture is cut into fourteen upright prisms held between two aluminium rails. Each prism carries a strip of all three photographs, one per side, and to change picture they turn a third of the way round, each starting a moment after its neighbour, so a ripple crosses the board and the next photograph assembles itself strip by strip. Every prism is on a spring that overshoots and knocks back onto its stop. While a face is edge-on it falls into shadow, its metal lip shows, and a band of lamp light slides over the glossy print. Running the pointer over the board nudges the prisms beneath it part of the way round. A click turns the board starting from the prism you clicked, and three named pills below jump to a picture. On phones the board fits the screen width and a tap turns it.",
  useWhen: [
    "Three campaign images share one slot and you want the change to be an event, not a fade.",
    "A homepage for an outdoor advertising, signage or print business needs a hero that is plainly about the trade.",
    "A retro or mechanical brand wants its gallery to feel built from parts.",
    "You have exactly three options to present, such as three colourways or three plans, and each deserves the full frame in turn.",
  ],
  customize: [
    "Replace the three entries in `sides`. Keep it to three, since a prism has three faces, and set each `tone` to the picture's main colour for the pill dot and the loading state.",
    "`SLATS` is the number of prisms, up to 20. Eight gives wide, slow-looking panels; eighteen is close to a real sign.",
    "`STAGGER` is the delay between neighbouring prisms in seconds. `0` turns the whole board at once and `0.12` makes a long lazy ripple.",
    "The spring is the pair `95` and `9.6` in the loop. Raise the second number to about `19` to stop the overshoot, or lower it to `6` for a looser rattle.",
    "`REST` is how long the board waits on a picture before turning by itself. The timer also holds off for a few seconds after any click or pointer movement.",
  ],
  accessibility: [
    "The board is a button whose label names the photograph on show and its position out of three, and the label updates as soon as a turn starts.",
    "Right and left arrow keys turn the board forwards and backwards, and the three pills are buttons with `aria-pressed`, so any picture can be reached from the keyboard.",
    "All three photographs are real images with alt text stacked under the canvas. With reduced motion, or without WebGL, the pictures swap directly beneath a pattern of fixed seams.",
  ],
  faqs: [
    { question: "How are the prisms drawn without a 3D library?", answer: "One fragment shader does it in flat arithmetic. For each pixel it works out which prism it falls in and that prism's angle, then tests the three faces. A face turned towards the viewer covers a span of the prism's width that follows from its angle, and where the pixel lands inside that span says which part of the photograph to show. The same angle gives the shading." },
    { question: "Can it show more than three images?", answer: "Not on one board, because the mechanism is a triangle. For a longer set, swap a new photograph into whichever face is at the back after each turn. The textures are bound as `u_t0`, `u_t1` and `u_t2`, and the face hidden from view is the one two steps behind `step`." },
    { question: "Why do the prisms overshoot?", answer: "Each angle is driven by a spring that is a little under-damped, so it swings a few degrees past the stop and settles. Real signs of this kind land with a clack, and without the overshoot the turn reads as a slide effect." },
    { question: "Does the pointer change the picture or only disturb it?", answer: "Moving over the board only leans the nearest prisms by up to about thirty degrees, falling off over three or four slats, and they spring back when the pointer leaves. Clicking is what commits a turn." },
    { question: "Is the uneven brightness between slats a bug?", answer: "It is deliberate. Each prism hangs a fraction of a degree off true and takes the light slightly differently, as the panels of a real sign do. Set the `off` array to zeros and remove the last `hash` line in the shader for a perfectly even face." },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "glossy-photo-print-that-peels-off-a-second-photograph-with-a-lit-curling-underside"],
  tags: ["image transition", "slats", "billboard", "prism", "webgl", "gallery", "rotate", "spring"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
