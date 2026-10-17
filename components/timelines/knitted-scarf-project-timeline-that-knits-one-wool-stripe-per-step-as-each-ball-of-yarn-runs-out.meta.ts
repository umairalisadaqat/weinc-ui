const meta = {
  slug: "knitted-scarf-project-timeline-that-knits-one-wool-stripe-per-step-as-each-ball-of-yarn-runs-out",
  category: "timelines",
  name: "Knitted Scarf Project Timeline That Knits One Wool Stripe per Step as Each Ball of Yarn Runs Out",
  keyword: "react project timeline stepper",
  title: "React Project Timeline Stepper: Knitted Scarf | We.Inc",
  description: "Stepper on a canvas: a scarf on needles gains a wool stripe for every project step while that step's ball of yarn runs out. Free React and HTML to copy.",
  intro: "A four step project tracker laid out like knitting on a table. Each step owns a colour and a ball of wool. The scarf at the top is the record of what has been done: eight rows of stitches per step, knitted one stitch at a time by a second needle that dips along the row. Under it the balls sit in a line above their step names. The ball in use turns and shrinks as its yarn is drawn up to the needles, so a glance tells you which steps are waiting (full balls), which one is under way (a small one with a strand leading off it) and which are finished (an empty place and a tick). When the last row is done the scarf is cast off, the needles slide out and a short tail is left at the corner. The working yarn lies slack and moves aside when the pointer crosses it. Every step name is a button that replays the project from that step. The drawing scales to its container, and the four labels stay under their balls on a phone.",
  useWhen: [
    "A client portal or studio page shows a handful of project stages and you want finished work to pile up visibly instead of ticking a row of circles.",
    "A craft, textile or slow fashion brand needs an order or commission tracker in its own material.",
    "An onboarding flow has three to five stages and each should leave something behind when it is complete.",
    "A case study wants to replay how a job went, stage by stage, with a control to jump to any point.",
  ],
  customize: [
    "`STEPS` holds the title, date and `wool` colour of each step. Add or remove entries freely; the balls and labels space themselves, though more than five gets tight on a phone.",
    "`ROWS_PER_STEP` is how tall each stripe is and `STITCHES` how wide the scarf is. Twelve rows and thirteen stitches give a longer, narrower scarf; keep rows times steps under about 40 so it clears the balls.",
    "The table is `STAGE` plus the three pinks in the root `bg-[radial-gradient(...)]` class. The shadows are `rgba(92,44,30,...)` in `shadowed`; shift that toward grey on a cool table.",
    "The needles are bamboo, set by the four colour stops in `needle`. Use `#f4f5f7`, `#c9ccd3`, `#8d929c` and `#4d5159` for aluminium.",
    "To drive it from real data, set `progress.current` to the finished share of the whole project (0.5 is two of four steps) and remove the demo clock at the top of `frame`.",
  ],
  accessibility: [
    "The steps are an ordered list of real buttons. The one under way carries `aria-current=\"step\"`, and each has hidden text saying finished, in progress or not started.",
    "A `status` line under the list names the current step and changes once per step, so progress is announced without reading out every row.",
    "The canvas is hidden from assistive software because the list already holds everything it shows.",
    "With reduced motion the finished, cast off scarf is drawn once and the step buttons do not start an animation.",
  ],
  faqs: [
    {
      question: "How is each stitch drawn?",
      answer: "A stitch is two short lengths of yarn leaning together. For every colour the component paints three slightly different stitches into small off-screen canvases, each strand shaded round with slanted nicks for the twist and a few loose fibres. The scarf is then built by stamping those pictures in rows, which keeps a few hundred stitches cheap to redraw.",
    },
    {
      question: "Can a step be longer than the others?",
      answer: "As written every step gets `ROWS_PER_STEP` rows. To weight them, replace the places that divide by `ROWS_PER_STEP` with a lookup into a list of row counts per step and size the balls from the same list.",
    },
    {
      question: "What happens when progress moves backwards?",
      answer: "The rows are ripped out quickly, top speed about 46 rows a second, the ball for that step grows again and the needle moves back up. Clicking an earlier step name uses the same path.",
    },
    {
      question: "How does the loose yarn react to the pointer?",
      answer: "The strand is a chain of eighteen points held at the needle and at the ball, kept a little longer than the straight distance so it lies slack. Each frame the points are pushed out of a small circle round the pointer and then pulled back to their spacing. Motion is damped hard so it behaves like wool on a table, not a swinging rope.",
    },
    {
      question: "Why do the rows grow in alternate directions?",
      answer: "Flat knitting is worked across and back. Even rows fill from the right and odd rows from the left, which also keeps the working needle and the yarn moving smoothly instead of snapping back at the end of each row.",
    },
  ],
  related: [
    "steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded",
    "beehive-frame-progress-meter-whose-wax-cells-fill-with-honey-and-cap-over-as-the-job-finishes",
    "banding-wheel-loader-that-throws-a-wet-terracotta-vase-up-to-a-brass-height-gauge",
  ],
  tags: ["timeline", "stepper", "knitting", "wool", "canvas", "skeuomorphic", "progress"],
  height: 800,
  interactive: true,
};

export default meta;
