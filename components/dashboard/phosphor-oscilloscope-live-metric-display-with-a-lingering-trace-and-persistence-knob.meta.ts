const meta = {
  slug: "phosphor-oscilloscope-live-metric-display-with-a-lingering-trace-and-persistence-knob",
  category: "dashboard",
  name: "Phosphor Oscilloscope Live Metric Display with a Lingering Trace and Persistence Knob",
  keyword: "react oscilloscope component",
  title: "React Oscilloscope Component for Live Metrics | We.Inc",
  description: "Oscilloscope on a canvas: a beam sweeps a ruled tube and leaves a fading afterglow, with source keys and a persistence knob. Free React and HTML code.",
  intro: "A bench oscilloscope in cream enamel with a deep black hood around a green tube. A bright spot crosses the ruled screen from left to right, drawing whichever signal is selected, and the light it leaves behind does not vanish at once. It cools from blue-white to yellow-green and fades over a couple of seconds, so earlier sweeps hang behind the new one as ghosts. That afterglow is the whole point of the piece: it shows where a number has just been as well as where it is. Three square keys choose the source, each with a lamp above it. One knob sets how long the beam takes to cross a square, the other how long the glow lasts. The current figure is written under the instrument as text and refreshed four times a second. Below 700 pixels the case is rebuilt upright, screen on top and controls beneath, so the keys stay big enough for a thumb.",
  useWhen: [
    "An operations or status page wants live traffic, response time or load shown as something with more life than a line chart.",
    "A developer tool, hosting or hardware brand needs a hero object that says measurement without a single stock photo.",
    "You are showing a fast-changing value where the recent past matters as much as the present, such as audio level, sensor output or queue length.",
    "A landing page for electronics, synths or repair work wants an instrument visitors can switch and turn.",
  ],
  customize: [
    "`sources` lists the signals. Each has a `name`, a `unit`, the `min` and `max` that map to the bottom and top of the screen, and an `at(t)` function. Return your newest sample from `at` to plot real data.",
    "`PERSIST` holds the three glow times in seconds as `tau`. A value of 6 leaves five or six ghost sweeps on screen. 0.15 gives a clean modern trace.",
    "`FRESH` and `OLD` are the colour of the beam and of its afterglow. Try amber, `[255, 214, 150]` cooling to `[255, 140, 40]`, for a radar look.",
    "`TIMEBASES` are the seconds per square for the three knob positions, and `START` picks which key and knob positions are set on load.",
    "The enamel is the three stops of the `body` gradient in `build`. Change them to greys near `#2a2c30` and flip the `ink` colour to white for a black rack unit.",
  ],
  accessibility: [
    "The canvas is decorative to a screen reader. The selected source and its live value, the time setting and the glow setting are a normal paragraph beneath the case.",
    "Source keys are buttons carrying `aria-pressed`, so the chosen one is announced. Their hit areas include the lamp above and the name below, which keeps them taller than 40 pixels on phones.",
    "Each knob is a three-step `slider` with a spoken value such as 0.2 seconds per division. Arrow keys step it, Home and End jump to the ends, and Enter, Space or a click move to the next stop.",
    "When the visitor prefers reduced motion the beam does not travel. One complete sweep is drawn at full brightness and redrawn only when a control changes.",
  ],
  faqs: [
    {
      question: "How is the afterglow drawn?",
      answer: "The beam appends a dated point to a list about every two pixels. Each frame the list is drawn again from oldest to newest in forty age groups, and each group is stroked three times, wide and faint, medium, then thin and bright, with an opacity that falls off exponentially with age. Additive blending makes overlapping ghosts add up the way light does.",
    },
    {
      question: "Why not fade the canvas a little every frame instead?",
      answer: "That common trick multiplies eight-bit pixels by a number just under one, and dim pixels round back to the same value, so a grey smear stays on screen for good. Redrawing from stored points fades all the way to black and lets the persistence knob change the fade of light that is already on the tube.",
    },
    {
      question: "The waveform does not stand still. Is that a bug?",
      answer: "No. The sweep free-runs, as an untriggered scope does, so each pass starts at a different point in the signal. For a steady picture set the timebase to a whole multiple of your signal period, or restart the sweep (`sim.p = 0`) whenever the value crosses the centre line going up.",
    },
    {
      question: "How do I plot a value that arrives from a server every second?",
      answer: "Keep the latest two samples in a ref and have `at(t)` return a blend of them based on how far `t` is past the last arrival. The beam then glides between readings instead of stepping, and `min` and `max` decide how much of the screen the swing fills.",
    },
    {
      question: "What does it cost to run?",
      answer: "With long glow at the slowest sweep there are around two thousand stored points, drawn as 120 short strokes with no blur filters. The case, hood and lettering come from one off-screen image. The loop pauses when the scope is scrolled away or the tab is in the background.",
    },
  ],
  related: ["stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob", "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target", "motorised-mixing-desk-fader-with-led-meter-and-engraved-decibel-scale"],
  tags: ["oscilloscope", "live chart", "canvas", "phosphor", "crt", "dashboard", "retro", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
