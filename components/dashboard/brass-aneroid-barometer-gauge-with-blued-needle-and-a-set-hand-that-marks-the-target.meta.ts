const meta = {
  slug: "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target",
  category: "dashboard",
  name: "Brass Aneroid Barometer Gauge with Blued Needle and a Set Hand That Marks the Target",
  keyword: "react gauge component with target marker",
  title: "React Gauge Component with a Target Marker | We.Inc",
  description: "Gauge drawn as a brass wall barometer: a blued needle swings to the reading and a set hand marks the target. Copy the React code or an HTML version free.",
  intro: "A single metric shown the way weather used to be: a brass-cased wall barometer hanging from its loop on a dark green wall. The silvered dial carries a scale from 0 to 600 and four words printed round the inside, Slow, Steady, Brisk and Rush, where a weather dial would say Rain and Fair. A blued steel needle swings to the current reading with the quiver of a real movement. Over it, riding on the glass, sits the second hand every aneroid barometer has: a brass pointer you park by turning the knurled knob in the centre, so the gap between the two hands is the gap between where you are and where you meant to be. Tap the glass, as people do, and the needle jumps and settles on the next reading. The same three facts are printed underneath as ordinary text. On a phone the instrument shrinks to the width of the screen and stays round.",
  useWhen: [
    "A dashboard has one headline number with a goal, such as weekly orders, bookings or sign-ups, and it deserves more than a tile.",
    "A shop, cafe or studio site wants a status object on its about or wholesale page that suits brass and wood better than a neon chart.",
    "You need to show actual against target at a glance and a bullet chart feels too clinical for the brand.",
    "A report or year-in-review page wants one hero instrument that readers can poke while they scroll past.",
  ],
  customize: [
    "`readings` is the list the needle visits. Replace it with a single live number by setting `live.current.reading` from your own data and calling `api.current?.poke()`.",
    "`MIN` and `MAX` set the ends of the scale. Numbers are printed at every 100 and ticks at every 10, so pick a range that divides cleanly or change those two steps in the tick loop.",
    "`bands` holds the four words and the value each one is centred on. Three or five words work if you also move the divider values listed just below them.",
    "`W0` and `ZETA` shape the swing. Raise `ZETA` towards 0.8 for a needle that walks to its mark without quivering.",
    "The wall is the `bg-[#14271f]` class and the gradient next to it on the root element. Oxblood or navy both flatter brass.",
  ],
  accessibility: [
    "The drawing is hidden from assistive technology. The reading, the target and how far ahead or behind you are sit below it as plain text, so nothing depends on reading a needle.",
    "The centre knob is a `slider` named for the target. Arrow keys move it by ten, Page Up and Page Down by fifty, Home and End to either end of the scale.",
    "Tapping the glass is a real `button`, reachable by Tab and worked with Enter or Space. A polite live region speaks only after you act, never on the automatic change of reading.",
    "With reduced motion the needle is drawn straight at its reading, the automatic cycle of readings is off, and the reflections on the glass stay still.",
  ],
  faqs: [
    {
      question: "What is the second hand on a barometer for?",
      answer: "It is called the set hand. You turn it by the knob on the glass until it sits over the needle, then come back later and see which way the needle has moved away from it. Here it does the same job for a business number: park it on the goal and the distance between brass and blue is your surplus or shortfall.",
    },
    {
      question: "Why does the needle wobble before it stops?",
      answer: "The needle is modelled as a light arm on a hairspring with very little friction. Each frame the code pulls it towards the reading, adds that pull to its speed and moves it, in four small steps. With `ZETA` at 0.3 it overshoots about a third of the way and rings twice before resting, which is how a tapped aneroid behaves.",
    },
    {
      question: "How is the brass made without an image file?",
      answer: "A conic gradient gives the alternating bright and dark sectors that a turned ring shows under one lamp. On top of that sit radial gradients that round the outer edge and slope the bezel, and two hundred short strokes that form the coin-milled band, each lit according to which way it faces.",
    },
    {
      question: "Can the dial show a percentage instead of a count?",
      answer: "Yes. Set `MIN` to 0 and `MAX` to 100, change the two modulo tests in the tick loop from 100 and 50 to 10 and 5, and print a tick every 1. Then rewrite `bands` with values inside the new range.",
    },
    {
      question: "Does it keep animating when nobody is looking?",
      answer: "No. An intersection observer stops the frame loop when the instrument leaves the viewport and a visibility listener stops it when the tab is hidden. The case, bezel and printed dial are painted once to an off-screen canvas, so a running frame only draws two hands, the knob and the glass.",
    },
  ],
  related: ["stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob", "bronze-garden-sundial-whose-shadow-points-at-the-time-and-polished-arc-marks-opening-hours", "phosphor-oscilloscope-live-metric-display-with-a-lingering-trace-and-persistence-knob"],
  tags: ["gauge", "barometer", "brass", "dashboard", "target", "canvas", "needle", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
