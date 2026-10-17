const meta = {
  slug: "bakery-stats-row-that-counts-up-with-an-ease-out",
  category: "text-effects",
  name: "Bakery Stats Row That Counts Up",
  keyword: "number counter animation",
  title: "",
  description: "",
  intro:
    "Four figures for a neighbourhood bakery set on warm, lightly grained paper. When the row scrolls into view each serif numeral climbs from zero with a cubic ease-out, one a beat after the other, while a thin rust rule above it grows in step. It suits an about page or a quiet trust strip under a hero.",
  useWhen: [
    "You have three or four plain facts about a small business and want them to land with a little ceremony.",
  ],
  customize: [
    "Change figures, decimals and labels in the `stats` array; a decimal count of 1 lets a rating like 4.9 count through tenths.",
    "Tune the pacing with `DURATION` and `STAGGER` at the top of the file (or the script in the HTML version).",
    "Recolour the growing rule by swapping `bg-[#b4532a]`, or `--bkc-accent` in the plain version.",
  ],
  accessibility: [
    "Each figure sits in a visually hidden span holding the finished number, and the ticking copy is aria-hidden, so a screen reader hears 18,240 once rather than a stream of values.",
  ],
  faqs: [],
  related: [],
  tags: ["number counter animation", "stats counter", "count up on scroll", "ease out counter"],
  height: 480,
  collection: "number-counter-animation",
  tech: "css",
  reducedMotion: "The numbers and accent rules appear already finished, with no counting at all.",
  perf: "One short requestAnimationFrame run that rewrites four text nodes and one transform each, then stops for good.",
};

export default meta;
