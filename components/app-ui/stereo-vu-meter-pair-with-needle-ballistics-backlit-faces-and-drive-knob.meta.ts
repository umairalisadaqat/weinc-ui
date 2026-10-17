const meta = {
  slug: "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob",
  category: "app-ui",
  name: "Stereo VU Meter Pair with Needle Ballistics, Backlit Faces and Drive Knob",
  keyword: "react vu meter component",
  title: "React VU Meter Component with Needle Ballistics | We.Inc",
  description: "VU meters on a canvas: backlit faces behind glass, needles that swing with real weight, a peak lamp and a drive knob. Copy the React code or the HTML free.",
  intro: "Two analogue level meters set into a brushed black rack plate. Each window has a cream card lit from below, a printed scale that crowds on the left and opens out towards the red zone, a needle that throws a soft shadow on the card behind it, and a sheet of glass with slanted reflections that drift as the pointer crosses the panel. No audio is played. A small built-in rhythm of kick, snare and a swelling bass line stands in for the programme, and the needles chase it the way a mechanical movement does: about three tenths of a second to reach a steady tone, a hair of overshoot, and a tap against the end pin when pushed too hard. Turn the knob to drive the input from minus twelve to plus six decibels. Throw the lever and the lamps cool while both needles fall back to rest. Under 640 pixels the plate is rebuilt as a tall unit with one meter above the other, so the scale stays readable on a phone.",
  useWhen: [
    "A music, podcast or studio site wants a hero object that says audio without autoplaying any sound.",
    "A recording or streaming app needs a level display with more character than a row of green bars.",
    "You are building a retro hi-fi or synth themed page and want one centrepiece visitors can play with.",
    "A dashboard has a single live number, such as load or throughput, that would be fun to show on a needle.",
  ],
  customize: [
    "Replace the body of `signal(t, ch)` with your own level between 0 and about 1.4 for each channel. Feed it from a Web Audio analyser if you do have sound.",
    "`W0` and `ZETA` set the movement. 13.2 and 0.8 match a standard VU; lower `ZETA` to 0.4 for a loose, bouncy needle or raise `W0` for a fast peak meter.",
    "`MARKS` lists the numbers printed on the arc and `SPAN` is how far the needle swings either side of upright, in degrees.",
    "The lit card colour is the five stops of the `glow` gradient. Swap the ambers for pale blue and change `LAMP` to get a cold, later-era look.",
    "`DB_MIN` and `DB_MAX` set the range of the drive knob, and `TEMPO` changes how fast the stand-in rhythm plays.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The lever is a real `button` with `aria-pressed`, and the knob is a `slider` with its value read out in decibels.",
    "With the knob focused, the arrow keys move one decibel, Page Up and Page Down move three, and Home and End go to either end of its travel.",
    "The line under the unit is a polite live region that reports power and drive only. The needle positions are never announced, because they change many times a second.",
    "Reduced motion stops the loop: the needles are drawn once at a level that matches the drive setting, and they move only when you change a control.",
  ],
  faqs: [
    {
      question: "What does needle ballistics mean here?",
      answer: "Each needle is a mass on a spring with friction. Every frame the code works out the force pulling it towards the current level, adds that to its speed and moves it, in four small steps for stability. That is why a drum hit makes the needle lag, swing past and settle, when a plain CSS transition would glide straight to the value.",
    },
    {
      question: "Why are the numbers on the scale not evenly spaced?",
      answer: "A VU movement answers to voltage, and decibels are a logarithm of voltage. Zero VU therefore lands about seventy percent of the way across and minus twenty sits close to the left stop. The `frac` function does that conversion, so every tick is where it would be on a real meter.",
    },
    {
      question: "Can I connect it to real audio?",
      answer: "Yes. Create an `AnalyserNode` per channel, take the root mean square of its time domain data each frame and return that from `signal`. Start the audio context from a click, as browsers require, and leave the rest of the drawing code alone.",
    },
    {
      question: "How is the glass made without an image?",
      answer: "It is four fills over the card: a dark gradient under the top lip of the bezel, a radial darkening towards the corners, and two slanted white bands that fade towards the bottom. The bands slide sideways with the pointer, which is what makes the surface read as a separate sheet in front of the needle.",
    },
    {
      question: "Will it slow my page down?",
      answer: "The plate, screws, sockets and printed scales are painted once into two off-screen canvases. A frame then costs two image copies, two needles, the knob flutes and a few gradients. Drawing stops when the unit scrolls out of view or the tab is in the background.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "turntable-with-a-tonearm-you-lift-and-drop-onto-a-spinning-record", "village-scoreboard-with-enamel-number-plates-that-drop-onto-brass-hooks-and-swing"],
  tags: ["vu meter", "audio", "canvas", "analog", "needle", "skeuomorphic", "knob"],
  height: 720,
  interactive: true,
};

export default meta;
