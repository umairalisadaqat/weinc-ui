const meta = {
  slug: "ray-marched-slide-projector-gallery-that-throws-each-35mm-slide-onto-a-white-wall-through-a-dusty-beam-in-a-dim-room",
  category: "galleries",
  name: "Ray-Marched Slide Projector Gallery That Throws Each 35mm Slide onto a White Wall Through a Dusty Beam in a Dim Room",
  keyword: "webgl image gallery react",
  title: "Slide Projector Photo Gallery in WebGL (React, Tailwind) | We.Inc",
  description: "Free React photo gallery where a carousel projector throws each slide onto a plaster wall in a dark room, with dust drifting through the beam. WebGL, no library.",
  intro: "A holiday slide show in a dim living room, rendered live in a fragment shader. A taupe carousel projector stands on a walnut cabinet with a round tray of slides on top, and its lens throws the current photograph onto a white plaster wall. Because the projector is tipped up toward the wall, the picture lands slightly wider at the top, the same keystone you get with a real machine. The beam carries the colours of the slide through drifting dust, the oak floor picks up a soft reflection of the lit wall, and lamp light leaks out of the grille at the back. Choosing a slide closes the gate, turns the tray a few notches, jolts the machine and pulls focus through the new picture until it settles sharp. Real text sits underneath: the slide number, a pencilled note and a large serif caption, then a row of cardboard mounts that act as the buttons. On phones the camera steps back to fit the wall into a taller frame and the mounts wrap into a grid of three.",
  useWhen: [
    "A photographer, travel writer or family archive wants an evening, nostalgic mood rather than a bright grid of thumbnails.",
    "A film festival, gallery or museum page needs a single picture at a time with room for a proper caption.",
    "A landing page for a scanning or photo restoration service wants old slides to feel like an event again.",
    "You need a portfolio piece that shows projection, volumetric light and reflections running in a browser without a 3D package.",
  ],
  customize: [
    "Edit the `slides` array at the top: `title` is the big caption, `note` is the small line in capitals, and `src` and `alt` describe the photograph. Landscape pictures near 3:2 fill the gate best.",
    "`HOLD_MS` sets how long the self-running show waits on each slide before it advances. It stops for good the first time a visitor picks a slide.",
    "Move `LENS` and `AIM` to change where the projector stands and where it points. Raising the y value of `AIM` tips the machine further back and strengthens the keystone.",
    "The colour of the bulb is `LAMP` in the shader and the warm room lamp is `PRAC`. A cooler `vec3(0.92, 0.95, 1.0)` lamp reads as a modern LED projector.",
    "The amount of dust is the `0.22 + 1.5 * pow(wisp, 3.0)` line inside `beam()`. Lower the first number for a cleaner room, raise the second for a smoky one.",
  ],
  accessibility: [
    "The canvas is decorative and hidden from screen readers. The current photograph is also in the page as a real image with its alt text, and a polite live region announces the slide number and caption after each change.",
    "Every mount is a button with `aria-pressed` and a label that includes its caption, arrow keys inside the row step backward and forward, and the previous and next buttons are 44 pixels tall.",
    "With reduced motion the dust stops drifting, the tray and the picture change in one step with no shutter or focus pull, and the self-running show never starts.",
  ],
  faqs: [
    {
      question: "How does the photo end up keystoned on the wall?",
      answer: "Nothing is warped by hand. For each point on the wall the shader asks where it falls in the projector's own frame, dividing by the distance along the lens axis. Because the lens points upward at the wall, points near the top are further away and spread wider, which produces the trapezoid naturally.",
    },
    {
      question: "Why can I see the picture's colours inside the beam?",
      answer: "The beam is marched in thirty steps along each camera ray. At every step that falls inside the cone of light, the shader looks up the slide at that position, blurred through a lower mipmap level, and multiplies it by the density of a slowly drifting dust field and the falloff with distance from the lens.",
    },
    {
      question: "Where do the photographs need to come from?",
      answer: "Any host that sends cross-origin headers, because the image is uploaded as a WebGL texture. Each photo is cropped to 3:2 on a hidden canvas and stretched into a square so mipmaps work in WebGL 1. The same pass measures its average colour, which tints the light bounced back into the room.",
    },
    {
      question: "Will this slow down a laptop?",
      answer: "The canvas is capped at about nine hundred thousand pixels, the loop stops when the section scrolls out of view or the tab is hidden, and if frames keep taking longer than about 24 milliseconds the render resolution steps down until they do not.",
    },
    {
      question: "What appears in a browser without WebGL?",
      answer: "A still version of the room made with gradients, with the current photograph clipped into a keystone shape on the wall. The captions, the mounts and the buttons work the same way because none of them rely on the canvas.",
    },
  ],
  related: [
    "slide-projector-photo-carousel-with-a-tray-that-clicks-round-and-drops-each-frame-into-the-beam",
    "sixteen-millimetre-film-projector-gallery-with-turning-reels-a-dusty-beam-and-stills-that-flicker-onto-a-tripod-screen",
    "light-table-slide-gallery-with-a-glass-loupe-that-glides-between-mounted-transparencies",
  ],
  tags: ["gallery", "carousel", "webgl", "ray marching", "projector", "volumetric light", "shader", "photography"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
