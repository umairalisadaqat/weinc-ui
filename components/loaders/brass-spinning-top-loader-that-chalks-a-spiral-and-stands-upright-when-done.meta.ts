const meta = {
  slug: "brass-spinning-top-loader-that-chalks-a-spiral-and-stands-upright-when-done",
  category: "loaders",
  name: "Brass Spinning Top Loader That Chalks a Spiral and Stands Upright When Done",
  keyword: "spinning top loading animation react",
  title: "React Loading Animation: Spinning Top on Canvas | We.Inc",
  description: "A brass top wobbles round a green table, chalks a shrinking spiral and stands still when loading ends. Copy the React code or the HTML version free.",
  intro: "A loader built round one toy. A brass top with a red enamel band is set spinning on a green table and starts out leaning hard, walking a wide circle. As the work gets done the circle tightens and the top straightens, the way a real one climbs onto its point, until at the end it stands upright in the middle and looks as if it is not moving at all. Its steel tip leaves a chalk line, so the whole wait is recorded as a spiral, and a ring of chalk marks round the edge fills in clockwise as a plain progress scale. The percentage and a status line sit underneath. Tapping the top, or the Flick it button, knocks it off balance for a second. The drawing fills a 328 pixel square on phones and 520 pixels from tablet width up.",
  useWhen: [
    "A save, sync or publish step takes a few seconds and you want the wait to end on a clear picture of things coming to rest.",
    "A children's product, toy shop or game menu needs a loading state with some play in it.",
    "A meditation, focus or writing app wants its progress indicator to calm down as it goes instead of speeding up.",
    "A full screen splash needs a single object and a number, with no layout round it.",
  ],
  customize: [
    "`PROFILE` is the outline of the top as pairs of height and half-width. Move the widest pair lower for a squat top or stretch the last few pairs for a longer stem.",
    "`BAND` holds the eight reds of the enamel from shadow to highlight. Swap them for blues such as `#0b2a5c` to `#2f6fe0` and keep the pale fourth entry as the shine.",
    "The table is the root `bg-[#0e3a2c]` class and its radial gradient. On a pale table also darken the chalk colour `rgba(244,240,226,...)` in the two stroke lines.",
    "`66 * Math.pow(left, 1.1)` is how wide the top wanders at the start, in drawing units. `0.36` on the next line is the starting lean in radians.",
    "Feed real progress by writing 0 to 1 into `progress.current` and removing the block marked as the demo clock in `advance`.",
  ],
  accessibility: [
    "The stage is a `progressbar` with a live `aria-valuenow`, and the line under the number is a `status` region that speaks once when the top has settled.",
    "The big percentage is hidden from assistive software because the progress bar already carries the same value.",
    "With reduced motion nothing spins: the finished spiral, the full chalk ring and the upright top are drawn once as a still picture.",
    "Flick it and Run again are real buttons with a visible focus ring, so the pointer is never the only way to disturb or restart the top.",
  ],
  faqs: [
    {
      question: "How is a round, shaded top drawn without a 3D library?",
      answer: "The top is a stack of about three hundred thin discs placed along its tilted axis, each drawn as an ellipse on a plain 2D canvas. Every disc is filled with a strip of shading that runs from one side to the other, so the highlights line up into a lathe-turned surface. Discs on a part that narrows upward get a little extra light and discs on the underside get darker.",
    },
    {
      question: "Do real tops straighten up like this?",
      answer: "Yes. Friction where the tip slides on the table produces a twisting force that raises the axis, and a well made top ends up 'sleeping' upright before it finally slows. Here the angle is tied to progress instead of to friction so the upright moment lands exactly on one hundred percent.",
    },
    {
      question: "Can I keep the spiral from being cleared between runs?",
      answer: "The line `if (p < s.p - 0.2) s.trail = []` wipes the table whenever progress jumps backwards. Remove it and each new run draws over the last one. The trail is capped at 1,600 points so it cannot grow without limit.",
    },
    {
      question: "Why does the top look still at the end if it is supposed to be spinning?",
      answer: "A smooth turned object looks the same at every angle, so a fast, steady top shows almost no movement. The only clue left is the highlight on the shoulder, which is given a slight shiver. That stillness is the signal that loading has finished.",
    },
  ],
  related: ["steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded", "mechanical-watch-movement-loader-with-swinging-balance-wheel-and-breathing-hairspring"],
  tags: ["loader", "spinning top", "brass", "canvas", "progress", "physics", "toy"],
  height: 720,
  interactive: true,
};

export default meta;
