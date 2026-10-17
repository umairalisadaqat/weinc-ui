export default {
  slug: "label-cursor-reading-view-drag-or-play-on-cards",
  category: "cursors",
  name: "Label Cursor for View, Drag and Play",
  keyword: "custom cursor with text",
  title: "",
  description: "",
  intro:
    "A dark disc grows under the pointer whenever it enters a card and spells out what a click will do there: View on a project photo, Drag on a sideways plant palette, Play on a film still. Each card also carries a small printed chip with the same words, so nothing depends on hovering. The palette really does drag with a mouse and scrolls with a finger or the arrow keys.",
  useWhen: ["A portfolio or case study grid that mixes links, carousels and video in one row."],
  customize: [
    "Change any card's `data-label` attribute to set its word; the disc reads it live.",
    "Resize the disc with `--w2lbl-size` (92px in React) and recolour it with `--w2lbl-ink`.",
    "Raise `IDLE_MS` to let the preview demo linger longer on each card.",
  ],
  accessibility: [
    "Printed chips repeat each label for touch and screen reader users, the play control is a real toggle button with aria-pressed, and the disc hides while anything has keyboard focus.",
  ],
  faqs: [],
  related: [],
  tags: ["label cursor", "custom cursor", "portfolio cards", "drag carousel"],
  height: 660,
  section: true,
  collection: "cursor-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "No disc appears; the printed chips and normal cursors explain each card.",
  perf: "One element moved with transform and a rectangle read per frame; the loop stops off screen.",
} satisfies UiMeta;
