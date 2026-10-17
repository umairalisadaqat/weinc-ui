const meta = {
  slug: "brass-pendulum-wall-clock-that-beats-once-a-second-in-true-time-and-throws-a-moving-shadow",
  category: "content",
  name: "Brass Pendulum Wall Clock That Beats Once a Second in True Time and Throws a Moving Shadow",
  keyword: "react pendulum clock animation",
  title: "React Pendulum Clock Animation in Real Time | We.Inc",
  description: "Pendulum clock drawn on a canvas: a brass wall clock whose bob beats once every real second and casts a moving shadow. Free React and HTML code to copy.",
  intro: "A round brass clock with a white enamel dial hangs on a dark green wall, and a long pendulum swings beneath it. The swing is not a decorative loop. Its angle is worked out from the system clock, so the bob arrives at one side exactly as each second begins, and two of these on different screens swing together. A lamp somewhere above throws the clock's shadow on the wall, and the pendulum's shadow falls a little further away because it hangs further from the plaster. Move the pointer and the lamp slides, taking the shadows and the brass highlights with it. You can catch the bob, pull it to one side and let go: it swings wide, then loses height and drifts back into step with the seconds over about ten seconds. The time is printed below in digits, and a button gives the same push for keyboard users. On a narrow screen the whole clock scales down in proportion.",
  useWhen: [
    "A hotel, restaurant or heritage brand wants a quiet moving object on a page that otherwise holds still.",
    "A countdown or opening hours section needs something that visibly marks each second without digits flashing.",
    "A 404 or waiting page should keep people company for a moment.",
    "A footer or contact block shows local time and has room for a tall, narrow piece.",
  ],
  customize: [
    "`SWING` is the resting swing in degrees either side of centre. 3 looks like a heavy regulator, 9 like a small kitchen clock.",
    "`PUSH` is how far the button throws the bob, and `SETTLE` how fast a wide swing dies down. Halve `SETTLE` for a pendulum that takes its time.",
    "`FACE` is the enamel colour and `NUMERALS` the twelve labels starting at the top. Swap in `\"12\", \"1\", \"2\"` for Arabic figures.",
    "`ROD` and `BOB` set the pendulum length and disc radius in canvas units. If you lengthen the rod, raise `H` by the same amount.",
    "The wall is the two colour values in the root `bg-[...]` classes. A warm plaster such as `#d9cfc0` works if you also darken the text colours under the clock.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The current time is ordinary text in a `time` element directly below it.",
    "Pulling the bob is a pointer gesture, so the Give it a push button does the same thing from the keyboard and has a visible gold focus ring.",
    "With reduced motion the pendulum hangs straight down, the lamp stops drifting and the push button is removed, since it would do nothing.",
    "Caption text is pale green on the dark wall at a contrast above 4.5 to 1. Check it again if you change the wall colour.",
  ],
  faqs: [
    {
      question: "How is the swing tied to real time?",
      answer: "The angle is the swing size multiplied by the cosine of pi times the current time in seconds. A cosine is at its peak when its input is a whole multiple of two pi, so the bob is at one extreme on even seconds and the other on odd ones, whatever the frame rate.",
    },
    {
      question: "What happens to the timing after I pull the bob?",
      answer: "On release the code solves for a swing size and a phase that leave the bob exactly where your finger left it, so nothing jumps. Both values then ease back towards the resting swing and zero phase. It is not a full physics simulation, but it looks like an escapement bringing the pendulum back under control.",
    },
    {
      question: "Why are there two shadows?",
      answer: "The case sits against the wall and the pendulum hangs a few centimetres in front of it. Shadows of things further from a surface land further from them, so the pendulum's shadow gets a longer offset from the same lamp direction. That gap is most of what makes the wall feel real.",
    },
    {
      question: "Does it chime on the hour?",
      answer: "No, and it never plays sound. If you want a chime, compare the minutes and seconds to zero inside the frame loop and call your own audio there, behind a setting the visitor turns on.",
    },
    {
      question: "How heavy is it to run?",
      answer: "Each frame fills a few gradients, draws about seventy short strokes for the dial and four blurred shadows. Canvas resolution is capped at twice the screen's, and the loop stops when the clock is off screen or the tab is hidden.",
    },
  ],
  related: ["twin-bell-alarm-clock-with-an-alarm-hand-you-drag-to-set-and-bells-that-shake-when-it-rings", "brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target", "posable-desk-lamp-on-a-jointed-arm-that-lights-a-still-life-and-throws-its-true-shadow-up-the-wall"],
  tags: ["pendulum", "wall clock", "canvas", "brass", "shadow", "live time", "roman numerals"],
  height: 800,
  interactive: true,
};

export default meta;
