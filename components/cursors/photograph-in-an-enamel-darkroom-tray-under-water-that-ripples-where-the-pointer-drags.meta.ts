const meta = {
  slug: "photograph-in-an-enamel-darkroom-tray-under-water-that-ripples-where-the-pointer-drags",
  category: "cursors",
  name: "Photograph in an Enamel Darkroom Tray Under Water That Ripples Where the Pointer Drags",
  keyword: "water ripple image effect react",
  title: "React Water Ripple Image Effect in WebGL | We.Inc",
  description: "Water ripple effect: a print lies in an enamel darkroom tray and the pointer drags waves across it, bending the photo beneath. Free React and HTML to copy.",
  intro: "A single object on a plain bench: a white enamel tray with a navy rim, a few millimetres of water, and a bordered print resting slightly askew on the bottom. The water is a small height-field simulation, so a pointer dragged through it leaves a proper wake that spreads, bounces off the four walls and crosses itself before it dies down. The print, its paper border and its shadow are all seen through that surface and bend with it, a window above the bench is mirrored in one corner and breaks apart as waves pass, and crests throw bright lines onto the tray floor. Left alone, something unseen keeps stirring it. On a phone the tray shrinks to the screen width, a tap makes a ring and the page still scrolls normally.",
  useWhen: [
    "A photographer, printmaker or film lab wants one hero image that visitors can physically disturb.",
    "An about page or case study needs a single still to hold attention without a carousel.",
    "You are showing a product shot or poster and want a tactile moment that is not another tilt card.",
    "A loading or holding page should have something to play with while the real content is prepared.",
  ],
  customize: [
    "Change `PHOTO` and `PHOTO_ALT`. Any proportions work: the picture is cropped to fill the print, whose shape is the `0.36` and `0.45` pair in the shader and `w-[72%] aspect-[4/5]` on the still print.",
    "`CALM` decides how long the water keeps moving. `0.983` rings for about three seconds; `0.975` settles almost at once and `0.992` sloshes for a long time.",
    "Refraction strength is the three numbers `0.040`, `0.043` and `0.046` in the shader. Bring them closer together to remove the colour fringe, or scale all three for deeper water.",
    "The tray is plain CSS on the outer div: the navy rim is the first `0 0 0 3px #1c2740` shadow and the enamel is the `linear-gradient`. The bench colour is `bg-[#d9d5cd]`.",
    "Delete the block that starts `if (stamp - hand.current.at > 2600)` to stop the water stirring by itself, or raise `2600` to wait longer after the last touch.",
  ],
  accessibility: [
    "The print is a real image with alt text underneath the canvas, and the canvas is hidden from assistive technology.",
    "A native button below the tray drops a bead of water, so the effect can be triggered from the keyboard, and a polite live region says how many have fallen.",
    "With reduced motion the simulation never starts and the dry print is shown in the tray at the same angle. The same still appears when WebGL is missing.",
    "The well uses `touch-pan-y`, so a finger on the tray can still scroll the page vertically.",
  ],
  faqs: [
    { question: "Is the water a real simulation or a set of fake rings?", answer: "It is a real one, of the simplest kind. A grid of 168 by 210 heights is advanced sixty times a second: every cell moves toward the average of its four neighbours, overshoots, and loses a little energy. Because the edges copy their own value, waves reflect off the walls exactly as they do in a shallow dish." },
    { question: "Why run the waves in JavaScript and not on the graphics card?", answer: "A grid this small costs well under a millisecond a frame on the processor, and it avoids floating point render targets, which older phones do not all support. The grid is packed into an ordinary 8 bit texture as two slopes and a curvature value and the shader does the rest." },
    { question: "How is the reflection of the window made?", answer: "It is a soft rounded rectangle drawn in the shader and looked up at a position pushed sideways by the slope of the water. On still water it sits quietly in the corner. When a wave tilts the surface the lookup moves, so the shape stretches and tears the way a reflection does." },
    { question: "Can I put text or a logo in the tray?", answer: "Not directly, because the bottom of the tray is drawn by the shader from one photograph. The simplest route is to bake the wording into the picture you pass as `PHOTO`. It will then refract with everything else." },
    { question: "Does it keep running when I scroll past it?", answer: "No. An intersection observer stops the frame loop when the tray leaves the screen and a visibility listener does the same for a hidden tab. Both start it again without resetting the water." },
  ],
  related: ["portrait-print-with-a-liquid-glass-bead-that-chases-the-pointer-and-shows-a-second-photograph", "photo-gallery-on-a-cotton-paper-sheet-where-each-portrait-blooms-in-like-ink-through-wet-fibres"],
  tags: ["water ripple", "photo", "webgl", "pointer", "refraction", "simulation", "darkroom", "image effect"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
