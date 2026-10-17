const meta = {
  slug: "beehive-frame-progress-meter-whose-wax-cells-fill-with-honey-and-cap-over-as-the-job-finishes",
  category: "feedback",
  name: "Beehive Frame Progress Meter Whose Wax Cells Fill with Honey and Cap Over as the Job Finishes",
  keyword: "honeycomb progress bar react",
  title: "React Progress Bar: Honeycomb That Fills | We.Inc",
  description: "Progress meter on a canvas: wax cells in a hive frame fill with honey, then seal under pale caps as the job ends. Free React code and HTML to copy.",
  intro: "A progress meter drawn as one frame lifted out of a beehive and hung on two brass pegs. Inside the pine bars are a little over two hundred wax cells. Progress pours honey into them in the order bees use, an arc that spreads down from the top bar, so the share of gold on the comb is the share of the job that is done. Behind the front of fresh honey a second wave lays a pale wax cap over each cell, which means a nearly finished job looks sealed and a job in the middle shows all three states at once: dark empty cups, wet honey and capped stores. A bead of honey swells under the bottom bar and drops away while work is coming in. A warm lamp glances across the comb and follows the pointer. The frame scales with its container down to phone width, with the percentage and a status line below it.",
  useWhen: [
    "A backup, sync or migration runs for a while and you want the remaining share to be readable from across the room.",
    "A food brand, farm shop or beekeeping supplier needs feedback that looks like its own produce.",
    "A storage or quota screen should show how full something is as a quantity you could count, cell by cell.",
    "A long job has a clear finished state and you want that state to look different from 99 percent, here a fully capped comb.",
  ],
  customize: [
    "`R` is the radius of a cell in drawing units. Raise it to 14 for about half as many, larger cells; the layout loop refills the frame by itself.",
    "The honey colours are the four stops of `body` in the honey picture, from `#ffd65c` at the bright spot to `#6d3004` at the rim. Use reds for a berry jam or pale greens for something stranger.",
    "`OPEN` is the share of cells that stay uncapped at the end. Set it to 0 for a completely sealed comb.",
    "The number `0.34` in `targets` is when capping starts and `1.7` is how late it bunches up. A lower first number seals the comb sooner behind the honey.",
    "For a real job, write the completed fraction into `progress.current` whenever it changes and cut the demo clock lines out of `frame`; the cells catch up by themselves.",
  ],
  accessibility: [
    "The frame is wrapped in a `progressbar` with `aria-valuenow` from 0 to 100 and an `aria-valuetext` that adds how many cells hold honey.",
    "The caption is a `status` region whose words change only at the start and when the comb is sealed, so a screen reader hears the result once.",
    "Under reduced motion the comb is drawn a single time in its finished, capped state and the drip is left out.",
    "The lamp that follows the pointer changes nothing but a highlight. Fill again is a real button with a focus ring.",
  ],
  faqs: [
    {
      question: "How are two hundred cells drawn every frame without slowing the page?",
      answer: "Each kind of cell is painted once into a small off-screen canvas: the empty cup, the honey and four slightly different caps. The loop then stamps those pictures with `drawImage`, changing only size and opacity, which is far cheaper than building gradients for every cell on every frame. The wooden bars are painted once too.",
    },
    {
      question: "Can each cell stand for one file or one task instead of a percentage?",
      answer: "Yes. Every cell has an `order` number from 0 upward. A cell fills when its order is below `p * N`, so replace that product with your count of finished items and size the frame so the number of cells matches your total.",
    },
    {
      question: "Why does honey start at the top instead of the left like a bar?",
      answer: "Bees store honey in a band along the top of the frame and work downward and outward. The order is the distance from a point above the top bar plus a little noise, which gives that ragged arc. For a plain left to right fill, set `order` to the cell's `x`.",
    },
    {
      question: "Does the meter work on a light background?",
      answer: "It does, but the shadow behind the frame is tuned for a dark wall. Change `STAGE` and the three greens in the root gradient, then lower the `0.62` in the shadow colour so it does not look like a hole.",
    },
    {
      question: "What does the drip do?",
      answer: "It is a sign that work is still arriving. The bead grows while progress is between 20 and 100 percent, falls when it is heavy and stops once the comb is sealed. Remove the block that mentions the bead if you want a stiller meter.",
    },
  ],
  related: ["steel-ball-bearing-loader-that-drops-a-ball-into-the-race-for-every-tenth-loaded", "brass-counter-bell-notification-that-rings-and-raises-a-message-card-from-a-slot-in-the-desk", "brass-doorbell-push-notification-with-walnut-door-chime-tubes-that-swing-shimmer-and-knock-together"],
  tags: ["progress", "honeycomb", "honey", "feedback", "canvas", "skeuomorphic", "meter"],
  height: 780,
  interactive: true,
};

export default meta;
