const meta = {
  "slug": "geometric-block-mark-slides-together-in-hero-corner",
  "category": "motion-graphics",
  "name": "Geometric Block Mark Sliding Together",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "Four stone-cut blocks, two squares and two quarter rounds, slide in from four sides and lock into a square mark in the corner of a masonry hero. A small inset square drops in last like a mason's chisel mark. It is a fit for any logo built from a grid of solid shapes.",
  "useWhen": [
    "A hero whose logo is made of separate filled blocks, where assembling the parts says something about the trade."
  ],
  "customize": [
    "Set the block colours with `--m1blk-a` to `--m1blk-d` and the travel with `--m1blk-far`.",
    "Swap the rects and paths for your own blocks; give each one a class and an `m1blk-in` keyframe with the direction it should arrive from."
  ],
  "accessibility": [
    "The mark is one `role=\"img\"` with the business name as its label, and the hero keeps a real heading, nav list and link."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "geometric logo animation",
    "logo assemble",
    "svg blocks",
    "hero logo"
  ],
  "height": 540,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The assembled square mark sits in the corner from the first frame, already complete.",
  "perf": "Five filled shapes move and fade on the compositor for about 1.5 seconds, then the hero is static."
} satisfies UiMeta;

export default meta;
