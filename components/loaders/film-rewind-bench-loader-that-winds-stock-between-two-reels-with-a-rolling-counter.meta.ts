const meta = {
  slug: "film-rewind-bench-loader-that-winds-stock-between-two-reels-with-a-rolling-counter",
  category: "loaders",
  name: "Film Rewind Bench Loader That Winds Stock Between Two Reels with a Rolling Counter",
  keyword: "film reel loading animation react",
  title: "React Loading Animation: Film Reel and Counter | We.Inc",
  description: "Film reel loader on a canvas: stock winds from one reel to the other while a mechanical drum counter rolls up. Free React code and an HTML version to copy.",
  intro: "A progress loader seen from above an editor's rewind bench. Two spun aluminium reels sit on a black plate with a strand of film running between them over a pair of chrome rollers and a small lit gate. Progress is the film itself: the pack on the left reel shrinks, the pack on the right grows, and the strand changes angle as the two sizes cross. Because the same length of stock leaves one reel and arrives on the other, whichever pack is smaller turns faster, exactly as on a real bench. Under the reels a mechanical counter with three number drums rolls from 000 to 100, each drum carrying into the next as it passes nine. In the demo the film winds across, rests, then rewinds at speed. The bench scales with its container, from 328 pixels wide on a phone up to 860 on a desktop.",
  useWhen: [
    "A video editor, screen recorder or podcast tool is rendering or exporting and can report how far along it is.",
    "A film festival, cinema or photo lab site wants a loading state that belongs to its trade.",
    "A file is being moved from one place to another and you want the transfer itself to be the picture.",
    "A long job needs a readout people can check from across the room, which the drum counter gives.",
  ],
  customize: [
    "`FILM` is the four browns of the wound stock from shadow to shine. For black and white stock use greys such as `#0c0c0d`, `#26272a`, `#55575c`, `#a9acb2`.",
    "`LAMP` is the gate light. The glow next to it uses the same amber as `rgba(255,180,74,...)`, so change both for a cool white lamp.",
    "`FLANGE`, `HUB` and `FULL` are the reel radius, the bare core and the full pack. Lower `FULL` to 80 if you want the reels to look half loaded at the start.",
    "The stage is the root `bg-[#f0b31c]` class with its gradient. On a dark stage change the caption and button from `#221a02` to a pale colour.",
    "Feed real progress by writing 0 to 1 into `progress.current` and deleting the demo clock block, which also removes the rewind.",
  ],
  accessibility: [
    "The bench is wrapped in a `progressbar` whose `aria-valuenow` matches the drum counter, with `aria-valuetext` reading as percent wound.",
    "The caption below is a `status` region. It switches to the finished message at one hundred, so the end of the export is spoken once.",
    "The counter digits are painted on the canvas, which is hidden from assistive software; the progress bar value is the accessible copy of them.",
    "With reduced motion the bench is drawn once with the right reel full and the counter at 100.",
  ],
  faqs: [
    {
      question: "Why do the two reels turn at different speeds?",
      answer: "Film moves past the gate at one speed, so each reel has to turn at that speed divided by the radius of its pack. A nearly empty reel spins several times for each turn of a full one. The loop converts each step of progress into a length of film and divides it by each pack radius.",
    },
    {
      question: "How are the pack sizes worked out from the percentage?",
      answer: "Wound film is a ring, and its area is proportional to its length. So the squared radius of each pack moves in a straight line between the bare core and the full reel as progress goes from 0 to 1. That is why the take-up pack grows quickly at first and slowly near the end.",
    },
    {
      question: "How does the counter roll its digits?",
      answer: "Each drum is drawn as two numbers, the current one and the next, shifted upward by the fractional part of its value and clipped to the window. The tens drum only moves while the ones drum is between nine and zero, and the hundreds drum waits for ninety-nine. A dark gradient at the top and bottom of the window makes the drums look curved.",
    },
    {
      question: "Can the film run right to left?",
      answer: "Yes. Swap the `x` values of `FEED` and `TAKE`. The strand is routed from whichever reel is `FEED`, over the first roller and the second, to `TAKE`, so swap `ROLL_A` and `ROLL_B` as well.",
    },
    {
      question: "Is it sharp on high density screens?",
      answer: "The canvas is 680 by 460 units and is backed by up to 2.6 canvas pixels per unit, so it stays crisp when the bench is shown at its largest on a retina display.",
    },
  ],
  related: ["steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded", "brass-spinning-top-loader-that-chalks-a-spiral-and-stands-upright-when-done"],
  tags: ["loader", "film reel", "progress", "counter", "canvas", "video", "skeuomorphic"],
  height: 720,
  section: true,
};

export default meta;
