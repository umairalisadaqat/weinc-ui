export default {
  slug: "chalk-dust-cursor-trail-on-a-slate-menu-board",
  category: "cursors",
  name: "Chalk Dust Cursor Trail",
  keyword: "chalk cursor effect",
  title: "",
  description: "",
  intro:
    "Moving across a café's slate menu board sheds fine chalk dust that drifts down and fades, as if the pointer were a stick of chalk dragged lightly over the surface. Specks come from a fixed pool of a few hundred particles on one canvas, so a long scribble never piles up work. A tap on a phone knocks a small puff loose instead.",
  useWhen: ["A café, bakery, school or market stall page with a handwritten, homely feel."],
  customize: [
    "Raise `DUST` for heavier chalk or lower it for a faint trace.",
    "Change `RGB` to tint the dust, such as a pale yellow chalk, and match `--w2chk-chalk`.",
    "Swap the slate colour `--w2chk-slate` for a deep green board.",
  ],
  accessibility: [
    "The menu is a real list with prices as text, the dust canvas is aria-hidden behind it, and it fades out while the booking link has keyboard focus.",
  ],
  faqs: [],
  related: [],
  tags: ["chalk effect", "particle trail", "canvas cursor", "menu board"],
  height: 620,
  section: true,
  collection: "cursor-effects",
  tech: "canvas",
  support: "All current browsers",
  reducedMotion: "No dust is drawn and the board shows as a still, readable menu.",
  perf: "Up to five hundred one-pixel rectangles per frame from a fixed pool; the loop pauses off screen and stops once a tap puff settles.",
} satisfies UiMeta;
