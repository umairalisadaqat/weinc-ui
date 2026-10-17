const meta = {
  slug: "page-tabs-with-gliding-underline-and-rising-content",
  category: "navigation",
  name: "Page Tabs With Gliding Underline and Rising Content",
  keyword: "tab page transition",
  title: "",
  description: "",
  intro: "A plant nursery site with four pages in a tab-style menu. Choosing a page makes the green underline glide and stretch from the old link to the new one, while the old content dips out and the new content rises into place. It is a light, quick change for sections that people flick between often.",
  useWhen: [
    "Sections of one site or app that sit side by side in a row of links, like plants, workshops, delivery and visiting.",
  ],
  customize: [
    "Change `MS` in the script for a slower or quicker underline glide.",
    "Edit the `16px` in `w6tab-rise` and the `-8px` in `w6tab-drop` to change how far the content moves.",
    "Recolour the underline, heading accents and focus ring with `--w6tab-moss`.",
  ],
  accessibility: [
    "These are links with aria-current=\"page\", not ARIA tabs, and focus moves to the new heading so screen readers start on the fresh content.",
    "Reduced motion stops the glide and the rise and switches content at once.",
  ],
  faqs: [],
  related: [],
  tags: ["tab transition", "view transitions", "animated underline", "section navigation"],
  height: 500,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "The underline jumps to the new link and the new content appears without any movement.",
  perf: "One thin bar and one content snapshot move by transform for under half a second; there is no work between clicks.",
};

export default meta;
