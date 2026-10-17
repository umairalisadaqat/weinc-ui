const meta = {
  slug: "arched-stained-glass-window-webgl-background-that-pours-coloured-light-across-a-stone-floor-as-the-sun-moves",
  category: "backgrounds",
  name: "Arched Stained Glass Window WebGL Background That Pours Coloured Light Across a Stone Floor as the Sun Moves",
  keyword: "stained glass webgl background react",
  title: "React WebGL Background: Stained Glass Light | We.Inc",
  description: "WebGL background where leaded windows cast coloured light across a stone floor, sliding as the sun moves. Copy the React code or the HTML version free.",
  intro: "A plain plastered room with a pair of arched windows of leaded glass, one the mirror image of the other: a red and gold sun rising behind four ranges of hills, with wedges of blue sky fanning out above it. The real sun is behind the glass, so the windows are the bright things in the picture and everything else is lit by what comes through them. The two patterns lie stretched across the limestone flags, one of them wraps over a pale stone ball and throws its shadow, and late in the day they climb the side wall. Shafts in the dusty air carry the colour of the pane they passed through, and the worn floor mirrors the window faintly. Move the pointer from left to right, or use the time slider, and the sun crosses the sky: the pool slides, lengthens and turns warmer towards evening, and its edges are softer the further the light has travelled. The glass is painted by a short canvas routine, so you can redesign it. On a phone the view narrows to the window and the floor in front of it.",
  useWhen: [
    "A church, concert hall, museum or heritage venue wants an opening screen with atmosphere and no stock photograph.",
    "A glass studio or restoration workshop needs a backdrop that shows what the craft does to a room.",
    "A meditation, reading or writing product wants a calm scene that changes slowly through a visit.",
    "A long article about architecture or light needs a full-width interlude between chapters.",
  ],
  customize: [
    "`glass.sky`, `glass.sun`, `glass.rays` and `glass.hills` are the pane colours. The floor pattern is the same picture, so one edit recolours the window and its light together.",
    "`paintGlass` draws the design with ordinary canvas calls, back to front, and each pane is filled then given a lead line. Replace its middle with your own shapes to make a different window.",
    "`room.haze` is the dust in the air. 0 switches the shafts off and saves about a third of the drawing cost; 0.1 fills the room with coloured beams.",
    "`room.from`, `room.to` and `room.start` set the hours on the slider and the moment the scene opens at.",
    "`room.floor` and `room.wall` are the stone and plaster colours. A dark floor such as `[0.12, 0.11, 0.1]` makes the reflection of the window stronger than the cast pattern.",
  ],
  accessibility: [
    "The sun is on a labelled range input, so arrow keys move it, and `aria-valuetext` reads the time of day instead of a bare percentage.",
    "With reduced motion the afternoon does not drift by itself. The scene holds still until the slider or pointer moves the sun, and then jumps without easing.",
    "The canvas is decorative and hidden from assistive technology. Text you place over it needs its own dark or light panel, because the pool of colour moves underneath.",
  ],
  faqs: [
    {
      question: "How does the pattern on the floor stay correct as the sun moves?",
      answer: "For every pixel of floor, wall or ball the shader follows a line back towards the sun until it meets the plane of the window wall. If that point is inside the opening, the pixel takes the colour of the glass there; if not, it is in shadow. Nothing is projected or warped by hand, which is why the light bends properly over the ball and up the side wall.",
    },
    {
      question: "Why do the edges of the light get softer further from the window?",
      answer: "The window picture is stored three times, at full sharpness and at two smaller sizes. The shader blends between them according to how far the light has travelled, so a lead line is crisp just under the sill and has dissolved by the far side of the pool.",
    },
    {
      question: "Can I use a photograph of real stained glass?",
      answer: "Yes, if you own it or its licence allows. Draw the image into the canvas inside `paintGlass` with `drawImage`, keep the black outside the arch, and the rest works unchanged. The image must be served with cross-origin headers or WebGL will refuse to read it.",
    },
    {
      question: "How do I place a heading over this?",
      answer: "Add your content as a sibling of the stage with `absolute inset-0` and a higher stacking order, and leave the stage's pointer handlers alone. The right half of the wall is the calmest area for text at wide sizes.",
    },
    {
      question: "What does a browser without WebGL show?",
      answer: "A flat version made of three plain layers: wall and floor, an arched shape in the sky colours, and a blurred slanted patch of colour on the floor. The canvas only fades in once it has drawn a frame.",
    },
  ],
  related: ["raked-zen-sand-garden-webgl-background-with-basalt-stones-and-a-slow-turning-sun-shadow", "glass-prism-that-splits-a-beam-carrying-one-sentence-into-a-homepage-made-of-light"],
  tags: ["stained glass", "webgl", "light", "background", "sun", "shader", "window"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
