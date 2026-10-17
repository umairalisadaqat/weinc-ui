const meta = {
  slug: "hero-number-counter-with-motion-blur-on-fast-digits",
  category: "text-effects",
  name: "Hero Number Counter With Motion Blur",
  keyword: "number counter animation",
  title: "",
  description: "",
  intro:
    "One very large figure for a window cleaning firm, slate ink on near white. While it counts, each digit is blurred by how fast it is changing: the ones place smears first, the tens a little less, and the leading digits stay crisp, then everything sharpens as the count eases to rest. Made for a single proud number in a hero.",
  useWhen: [
    "The whole section is about one figure and you want the count to feel physical rather than a flicker of numbers.",
  ],
  customize: [
    "Set the figure with `VALUE` and the caption beneath it; the heading's hidden text should say the same thing.",
    "Dial the smear up or down with `MAX_BLUR`, or remove it by setting it to 0.",
    "Change `DURATION` to slow the count; longer counts keep the blur on fewer digits for more of the time.",
  ],
  accessibility: [
    "The heading holds the whole statement, 23,418 windows cleaned since 2019, as hidden text; the large blurred digits and their visible caption are aria-hidden.",
  ],
  faqs: [],
  related: [],
  tags: ["hero number", "count up animation", "motion blur text", "big stat counter"],
  height: 680,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "The full figure shows sharp and settled, with no blur and no counting.",
  perf: "Rebuilds five or six digit spans per frame for about two seconds; the blur filter is applied to those spans only.",
};

export default meta;
