const meta = {
  slug: "steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded",
  category: "loaders",
  name: "Steel Ball Bearing Loader That Drops a Ball into the Race for Every Tenth Loaded",
  keyword: "react progress loader canvas",
  title: "React Canvas Progress Loader: Ball Bearing | We.Inc",
  description: "Loader on a canvas: a steel bearing whose brass cage takes another ball for each tenth loaded, with the percentage in the bore. Free React and HTML code.",
  intro: "A progress loader shaped like a deep groove ball bearing lying on a blue table. The brass cage starts empty. Each time another tenth of the work is finished a chrome ball falls into the next pocket, lands with a small bounce and nudges the bearing round, so ten balls means the job is complete. The inner ring turns faster as the count climbs, the cage follows at a little under half that speed as it does in a real bearing, and the percentage is printed on the table inside the bore. You can grab the bearing and flick it; it coasts and then returns to its own pace. The drawing is a 340 pixel square on phones and a quarter larger from tablet width up.",
  useWhen: [
    "An upload, import or export reports real progress and a thin bar would feel too slight for a wait of several seconds.",
    "A tool for engineers, makers or hardware buyers wants its waiting state to look like something from the workshop.",
    "A multi step job has about ten stages and you want each finished stage to be countable at a glance.",
    "A splash screen needs one object in the middle of the page and nothing else.",
  ],
  customize: [
    "`BALLS` sets how many pockets the cage has. Eight or twelve also fit the race; the engraving on the outer ring updates to match.",
    "`STAGE` and the three blues in the root `bg-[radial-gradient(...)]` class are the table. Change them together, because the bore is filled with `STAGE` so the table shows through.",
    "Feed real progress by writing a number from 0 to 1 into `progress.current`, then delete the block marked as the demo clock inside `frame`.",
    "`LABEL` and `DONE_LABEL` are the two lines under the bearing and the names a screen reader hears.",
    "The cruise speed is `1.1 + 2.3 * p` radians a second. Lower both numbers for a calmer bearing.",
  ],
  accessibility: [
    "The wrapper is a `progressbar` with `aria-valuenow` from 0 to 100 and an `aria-valuetext` that also says how many balls are seated.",
    "The caption is a `status` region that changes only twice per run, so the finished message is announced without a stream of numbers.",
    "With reduced motion the bearing is drawn once, full and at rest, showing 100 percent.",
    "Dragging the bearing is decoration. Nothing is learned from it that the caption and the progress value do not already say.",
  ],
  faqs: [
    {
      question: "Why does the cage turn slower than the inner ring?",
      answer: "In a bearing with a fixed outer ring the balls roll between the two raceways, so their centres travel at roughly the average of the two surface speeds. That puts the cage at a little under half the speed of the inner ring. The loop multiplies the ring speed by 0.42 to get it.",
    },
    {
      question: "How do I make a ball drop at my own milestones instead of every ten percent?",
      answer: "The number of seated balls is `Math.floor(p * BALLS + 1e-6)`. Replace that line with your own count, for example the number of finished files, and set `BALLS` to the total.",
    },
    {
      question: "Why do the bright bands on the rings not rotate?",
      answer: "A ground steel ring is the same at every angle, so its reflections depend on the lamp and not on how far it has turned. Only the engraved size marking and the two dimples on the inner ring move, which is what shows the rotation.",
    },
    {
      question: "Can it run without a known percentage?",
      answer: "Yes. Leave `progress.current` at a fixed value such as 0.5 and the bearing spins with five balls. Hide the number in the bore by removing the overlay element, and drop `aria-valuenow` so assistive software treats it as indeterminate.",
    },
    {
      question: "What happens when the tab is in the background?",
      answer: "The animation frame loop stops when the page is hidden or the bearing is scrolled out of view and starts again when it returns. The demo clock pauses with it.",
    },
  ],
  related: ["mechanical-watch-movement-loader-with-swinging-balance-wheel-and-breathing-hairspring", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["loader", "progress", "bearing", "steel", "canvas", "skeuomorphic", "percentage"],
  height: 720,
  interactive: true,
};

export default meta;
