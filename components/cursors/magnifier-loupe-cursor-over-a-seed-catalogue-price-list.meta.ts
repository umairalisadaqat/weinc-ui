export default {
  slug: "magnifier-loupe-cursor-over-a-seed-catalogue-price-list",
  category: "cursors",
  name: "Magnifier Loupe Over a Price List",
  keyword: "magnifying glass cursor",
  title: "",
  description: "",
  intro:
    "A round brass-rimmed loupe glides over a seed merchant's printed price list and shows the lines beneath it at almost twice the size. Inside the lens is a second copy of the same list, scaled and slid with transform so it lines up exactly with the spot under the pointer. Handy for dense menus, spec sheets or catalogue pages with lots of small print.",
  useWhen: ["A menu, price list, timetable or spec sheet that people like to read closely."],
  customize: [
    "Change `ZOOM` to 1.5 for a gentle lens or 3 for a strong one.",
    "Resize the loupe with `--w2lup-lens` and keep `LENS` in the script at the same number.",
    "Swap the list items for your own; the copy inside the lens is made from the same markup, so it updates with them.",
  ],
  accessibility: [
    "The magnified copy sits inside an aria-hidden lens, so screen readers meet each price once, and the list itself is printed at a comfortable size for anyone without a mouse.",
  ],
  faqs: [],
  related: [],
  tags: ["magnifier", "loupe", "zoom lens", "price list"],
  height: 760,
  section: true,
  collection: "cursor-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The loupe stays hidden and the list reads at its normal size.",
  perf: "Two elements moved with transform per frame, though the scaled copy doubles the text the browser keeps in memory.",
} satisfies UiMeta;
