const meta = {
  slug: "article-rows-cascade-out-and-in-between-sections",
  category: "navigation",
  name: "Article Rows Cascade Out and In Between Sections",
  keyword: "staggered page transition",
  title: "",
  description: "",
  intro: "A quarterly journal in warm ink tones with three sections of articles. Switching section sends the heading and each article row out one after another, then brings the new rows in with the same short cascade, a little like pages being dealt. Each row is its own named part, which is what lets them move on separate delays.",
  useWhen: [
    "Lists of articles, episodes or listings split into sections, where a staggered change helps people notice the whole list was replaced.",
  ],
  customize: [
    "Change the 40ms steps in the `animation-delay` rules for `w6stg-r1` to `w6stg-r4` to tighten or loosen the cascade.",
    "Set `--w6stg-amber` on `.w6stg` for the active section, row numbers and focus ring.",
    "For more rows, add `w6stg-r5` with its own delay and the matching `data-vt` attribute.",
  ],
  accessibility: [
    "Rows are links in an ordered list, and after a change focus lands on the new section heading.",
    "Reduced motion skips the cascade, so the whole new list appears in one step.",
  ],
  faqs: [],
  related: [],
  tags: ["staggered transition", "view transitions", "article list", "editorial site"],
  height: 560,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "The new section and its rows replace the old ones straight away, with no cascade.",
  perf: "Five small snapshots fade and shift for about half a second; keep the named rows to the ones on screen.",
};

export default meta;
