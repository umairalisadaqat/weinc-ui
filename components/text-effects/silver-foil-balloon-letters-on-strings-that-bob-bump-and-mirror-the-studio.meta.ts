const meta = {
  slug: "silver-foil-balloon-letters-on-strings-that-bob-bump-and-mirror-the-studio",
  category: "text-effects",
  name: "Silver Foil Balloon Letters on Strings That Bob, Bump and Mirror the Studio",
  keyword: "balloon text effect react",
  title: "React Balloon Text Effect in WebGL | We.Inc",
  description: "WebGL text effect: a word as foil balloons on strings that bob, bump each other and mirror a studio softbox near the pointer. Free React and HTML code.",
  intro: "A word spelled in the silver letter balloons people tape up for birthdays, floating in front of a pink paper sweep. Each letter is puffed up from the real glyph when the page loads, with a flat welded seam round its outline and creases running in from that seam, then shaded as a mirror of a small photo studio: a white softbox overhead, strip lights at the sides, a dark band at the horizon and the pink floor underneath. The balloons bob on their strings, lean when they drift, squash when they are hit and pass a knock along to their neighbours. Moving the pointer slides the softbox across every letter at once. On a phone the whole word scales down to fit the screen width and a tap gives the nearest balloon a shove.",
  useWhen: [
    "A launch, birthday, anniversary or sale page needs a one word opener that feels like a party without confetti falling over the copy.",
    "An events or venue-hire site wants a playful centrepiece above the booking form.",
    "A portfolio or agency home page wants its name as an object visitors can knock about.",
    "A thank you or order confirmation screen should reward the visitor with something to play with for a moment.",
  ],
  customize: [
    "`WORD` is the text. Each character becomes one balloon, so keep it to a single short word in capitals.",
    "`WALL` is the backdrop colour as a hex value. The same colour is fed to the shader as the floor the foil reflects, so the undersides of the letters always match the stage.",
    "`STANDOFF` sets how far the balloons float from the wall. 0.3 gives a long detached shadow, 0.06 looks taped on.",
    "For gold or rose foil, multiply `col` by a tint just before the last line of the fragment shader, for example `col *= vec3(1.0, 0.82, 0.5);`.",
    "The tether is the pair `34` (pull) and `2.6` (drag) in `step`. Raise the drag to 6 for heavy balloons that settle quickly.",
  ],
  accessibility: [
    "The word is a real `h2` in the page. It is transparent while the balloons are on show, and becomes a visible chrome gradient heading if WebGL is not available.",
    "The canvas and the strings are hidden from assistive technology, so a screen reader hears the word once and nothing else.",
    "The Bounce them button is a normal button, so the motion can be triggered from the keyboard.",
    "With reduced motion the balloons are drawn once, at rest, and the button is not rendered.",
  ],
  faqs: [
    {
      question: "How do flat letters become inflated balloons without a 3D library?",
      answer: "Each glyph is drawn to a small 2D canvas and blurred at two sizes on the processor. The blurred values are turned into a height with a circular profile, which gives the pillow shape, and the slope of that height is stored in a texture as the direction each point faces. The fragment shader only has to reflect a view ray off that direction and look up the studio.",
    },
    {
      question: "Is there an environment image to load?",
      answer: "No. The studio is a short function in the shader that returns a colour for any direction: floor, mid wall, dark band, softbox and ceiling, plus two strip lights. Edit the `room` function to change the lighting set-up.",
    },
    {
      question: "Why do the reflections keep moving when the balloons are still?",
      answer: "Every balloon is tilted a few degrees on a slow cycle of its own, and the softbox drifts from side to side when nobody is steering it. Foil shows a small tilt as a large shift in reflection, which is what makes it read as metal film and not grey plastic.",
    },
    {
      question: "Can I use a different font?",
      answer: "Yes. Change the `face` string in `inflate`. Heavy, round faces inflate best because thin strokes leave no room for a pillow. Load your web font before the component mounts, as the letters are baked once.",
    },
    {
      question: "How heavy is it?",
      answer: "The baking takes a few milliseconds per letter and happens once. After that each frame draws two small quads per letter, one for the shadow and one for the foil, and the loop stops when the section is off screen or the tab is hidden.",
    },
  ],
  related: ["word-embroidered-in-satin-stitch-on-hooped-linen-by-a-travelling-needle", "word-stamped-into-wet-concrete-that-cures-pale-takes-finger-marks-and-is-trowelled-smooth-for-a-new-word", "blind-embossed-paragraph-that-inks-in-under-a-passing-lamp"],
  tags: ["balloon", "foil", "chrome", "webgl", "physics", "letters", "reflection"],
  height: 740,
  interactive: true,
};

export default meta;
