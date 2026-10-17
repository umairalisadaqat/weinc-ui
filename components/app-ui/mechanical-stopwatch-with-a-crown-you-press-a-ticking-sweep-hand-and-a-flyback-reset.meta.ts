const meta = {
  slug: "mechanical-stopwatch-with-a-crown-you-press-a-ticking-sweep-hand-and-a-flyback-reset",
  category: "app-ui",
  name: "Mechanical Stopwatch with a Crown You Press, a Ticking Sweep Hand and a Flyback Reset",
  keyword: "react stopwatch component",
  title: "React Stopwatch Component with Flyback Reset | We.Inc",
  description: "Stopwatch drawn on a canvas: a chrome case and enamel dial, a crown you press to start and stop the hand, and a flyback reset. Free React and HTML to copy.",
  intro: "A working stopwatch drawn as the object a track coach carries: a polished steel case with a bow, a cream enamel dial printed with a fifth-second scale, a blued hand, and a sunk recorder that counts thirty minutes. Pressing the crown starts or stops it. The hand does not glide. It steps five times each second, the way a real lever movement does, and each step lands with a trace of bounce. The pusher at one o'clock sends both hands back to zero by the shortest way round, overshooting a hair before they settle. Reflections in the steel and the bloom on the crystal follow the pointer. Time is kept from the clock, so it stays correct after the tab has been hidden. The piece is 520 pixels wide at most and scales down as one picture on phones, where the crown and pusher remain large enough to tap.",
  useWhen: [
    "A workout, interval or study app needs a timer screen with more character than four digits and two buttons.",
    "A game has a timed round and the remaining seconds should be something the player watches, such as a lap or a quiz clock.",
    "A landing page for a coaching, running or swimming club wants one object in the hero that visitors can press.",
    "A kiosk or classroom page needs a large timer that reads from across a room by the angle of a hand.",
  ],
  customize: [
    "`START_AT` is the number of seconds on the dial when the page loads. Set it to `0` and change `running: !reduce` to `running: false` for a watch that waits at zero.",
    "`BEATS` is how many steps the hand takes each second and how many divisions are printed between second marks. `10` gives a tenth-second watch.",
    "`MINUTES` is one full turn of the small dial. `15` suits short intervals and the three printed numbers adjust to match.",
    "`ACCENT` colours the hand tip, the four quarter triangles and the keyboard focus ring. `#1f7a5c` gives a racing green.",
    "The enamel is the three colour stops named `enamel` in `paintFace`. Swap them for `#20242b`, `#181b20` and `#0e1013` and set `ink` to `#f2efe6` for a black dial.",
    "Set `DEMO` to `false` to stop the watch pressing its own buttons before a visitor does.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. Two real buttons lie over the crown and the pusher, so Tab reaches them and Space or Enter presses them.",
    "The crown button carries `aria-pressed` and its label switches between start and stop, so the state is spoken as well as shown.",
    "The line under the watch is a polite live region. It changes only when the watch starts, stops or resets and gives the held time in words, so a screen reader is not interrupted every fifth of a second.",
    "With reduced motion the watch loads stopped, the demo never runs, and a running hand is redrawn once a second with no spring or bounce.",
  ],
  faqs: [
    {
      question: "Why does the hand move in small jumps and not smoothly?",
      answer: "A mechanical stopwatch releases its gear train one tooth at a time, usually five times a second, so the hand advances in fifths. The component rounds the elapsed time down to the nearest beat and drives the hand to that angle with a stiff spring, which produces the same stepped sweep.",
    },
    {
      question: "How do I read the elapsed time in my own code?",
      answer: "Inside the effect, `elapsed(performance.now())` returns the seconds as a number. The `shown` state holds the value at the last stop or reset. To report it to a parent, call your own callback where `setShown` is called in the `crown` and `reset` functions.",
    },
    {
      question: "Does the time drift if the browser tab is in the background?",
      answer: "No. The watch stores the moment it was started and works out the elapsed time from the system clock on every draw. Animation frames pause when the tab is hidden, but when you return the hand jumps to the correct position.",
    },
    {
      question: "Can it count down from a set time?",
      answer: "Yes, with a small change. Replace the value passed to `beat` in the frame loop with a target minus the elapsed time, clamp it at zero, and call the `crown` function when it reaches zero so the watch stops itself.",
    },
    {
      question: "How heavy is the drawing?",
      answer: "The printed dial is painted once to an off-screen canvas and reused. Each frame draws that image, a few gradient fills for the steel and glass, and two hands. The loop stops when the watch scrolls out of view or the tab is hidden.",
    },
  ],
  related: [
    "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put",
    "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob",
    "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target",
  ],
  tags: ["stopwatch", "timer", "canvas", "chrome", "skeuomorphic", "sport", "dial"],
  height: 780,
  interactive: true,
};

export default meta;
