const meta = {
  slug: "sibling-pages-slide-in-reading-direction",
  category: "navigation",
  name: "Sibling Pages Slide in Reading Direction",
  keyword: "page slide transition",
  title: "",
  description: "",
  intro: "A small bookshop site with four pages that sit side by side. Going to a later page slides the old one out to the left while the new one arrives from the right, and going back reverses it, so the motion always agrees with the order in the menu. Only the content area moves; the header and menu stay still.",
  useWhen: [
    "A short run of sibling pages, such as shop, events, visit and orders, where visitors step forward and back in a known order.",
  ],
  customize: [
    "Change `--w6sld-paper`, `--w6sld-ink` and `--w6sld-red` on `.w6sld` to recolour the page, text and accent.",
    "Edit the 22% and 12% in the `w6sld-in` and `w6sld-out` keyframes to make pages travel further or less.",
    "Set `DEMO` to `[]` in the script to stop the automatic page turns in the preview.",
  ],
  accessibility: [
    "After a page change the new page heading takes focus, and the active menu link carries aria-current=\"page\".",
    "With reduced motion the pages swap instantly and the slide keyframes are switched off.",
  ],
  faqs: [],
  related: [],
  tags: ["view transitions", "page slide", "directional transition", "multi page navigation"],
  height: 600,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "Pages change instantly with no sliding, and focus still moves to the new heading.",
  perf: "The browser slides two snapshots of one area for half a second; nothing runs between page changes.",
};

export default meta;
