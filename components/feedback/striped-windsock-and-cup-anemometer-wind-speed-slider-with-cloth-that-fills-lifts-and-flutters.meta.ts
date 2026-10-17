const meta = {
  slug: "striped-windsock-and-cup-anemometer-wind-speed-slider-with-cloth-that-fills-lifts-and-flutters",
  category: "feedback",
  name: "Striped Windsock and Cup Anemometer Wind Speed Slider with Cloth That Fills, Lifts and Flutters",
  keyword: "react windsock animation canvas",
  title: "React Windsock Animation as a Level Indicator | We.Inc",
  description: "Level indicator as a windsock under a cup anemometer: set the wind with a slider and the cloth fills, lifts and flutters. Free React and HTML code.",
  intro: "A level shown by something that already means level to anyone who has stood on an airfield. An orange and white windsock hangs from a steel hoop on a white mast, with a three cup anemometer turning above it. A slider under the mast sets the wind from 0 to 30 knots. In still air the sock hangs slack beside the mast with its cloth creased. As the number rises the cloth fills out to a round tube, lifts stripe by stripe and finally stands straight out, shivering along its length, while the cups spin faster and the clouds behind cross the sky more quickly. The sock is a chain of sixteen points with real weight, so it swings and overshoots when the wind changes and never stops moving in a breeze. Under the slider the same reading is written three ways: knots, the Beaufort name and how many of the five stripes are flying. On a phone the mast moves to the left edge and the control panel takes the full width.",
  useWhen: [
    "A dashboard has one live intensity, such as traffic, load, queue length or demand, and a number alone does not give the feel of it.",
    "A sailing, kite, drone, paragliding or airfield site wants a wind display in the visitor's own vocabulary.",
    "A product page needs a hands-on demo of low, medium and high where the visitor moves the control and sees the result.",
    "A status or uptime page wants a calm object that shows how busy things are without charts.",
  ],
  customize: [
    "`ORANGE` and `WHITE` are the two stripe colours as red, green and blue. `[214, 32, 40]` gives the red and white sock used at some airfields.",
    "`BANDS` sets the number of stripes and `KNOTS_PER_BAND` sets how many knots lift each one. The caption follows both.",
    "`MAX` is the top of the slider and `START` is the wind on load. To show a live value, write it to `live.current.wind` and remove the range input.",
    "The flutter is the `1.5` in the `sim` function. Lower it to 0.6 for a heavy canvas sock, raise it to 2.2 for thin nylon.",
    "The sky is the three colour stops in the `sky` function, and `bg-[#a5cdea]` on the root is what shows before the canvas paints.",
  ],
  accessibility: [
    "The control is a native range input with a visible label, so arrow keys, Home, End and Page Up or Down all work without extra code.",
    "`aria-valuetext` reads the value as knots, the Beaufort name and the number of stripes flying, which is everything the drawing shows.",
    "The canvas is hidden from assistive technology and the same three facts are printed in the panel under it in dark text on white.",
    "With reduced motion the sock is drawn once in the resting shape for the chosen wind and redrawn when the slider moves, with no flutter, spin or drifting cloud.",
  ],
  faqs: [
    {
      question: "Is the stripe rule accurate enough for real flying or sailing?",
      answer: "No. One stripe for every three knots, and a fully extended sock at about fifteen, is a common rule of thumb for standard airfield socks, and this drawing follows it loosely. It is a visual indicator for a web page and must not be used to judge real conditions.",
    },
    {
      question: "How is the cloth simulated?",
      answer: "As a chain of points one link apart. Every step each point is pulled down by its weight and pushed sideways by a force that grows with the square of the wind, a little less toward the tail. The links are then pulled back to their fixed length fourteen times. A travelling wave is added to the weight to make the flutter.",
    },
    {
      question: "Why does the sock look round and not like a flat ribbon?",
      answer: "Each short slice of the tube is filled with a gradient that runs across it, from its upper edge to its lower edge, with twelve colour stops. The stops go from full colour where the light lands to a deeper tone underneath, with a touch of sky light at the very bottom. In still air the tube is drawn narrower and the stops are given uneven creases.",
    },
    {
      question: "How do the anemometer cups keep their shape as they turn?",
      answer: "Each cup is a half ball whose open face points along its path. The outline is a half circle joined to an ellipse that gets thinner as the cup turns side-on, and the dark inside is only painted while the open face is toward you. The three cups are sorted so the far ones are drawn before the hub and the near ones after.",
    },
    {
      question: "Can the wind come from the other side?",
      answer: "Not with a setting. The quickest way is to add the Tailwind class `-scale-x-100` to the canvas, which mirrors the whole scene so the sock streams to the left.",
    },
  ],
  related: ["brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target", "steel-tape-measure-range-slider-with-a-blade-that-sags-a-thumb-lock-and-spring-rewind"],
  tags: ["windsock", "anemometer", "wind", "slider", "canvas", "cloth", "weather"],
  height: 760,
  interactive: true,
};

export default meta;
