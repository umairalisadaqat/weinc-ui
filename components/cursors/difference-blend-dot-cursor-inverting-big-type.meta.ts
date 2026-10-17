export default {
  slug: "difference-blend-dot-cursor-inverting-big-type",
  category: "cursors",
  name: "Difference Blend Dot Cursor",
  keyword: "mix blend mode cursor",
  title: "",
  description: "",
  intro:
    "A white disc set to mix-blend-mode difference rides along with the pointer over a type specimen, flipping black letters to cream and the bone paper to near black wherever it passes. It stays a small bead over empty space and swells to full size across the giant headline and links. Good for a type foundry, poster studio or any page built around one huge word.",
  useWhen: ["A specimen page, studio splash or campaign hero whose headline is large enough to play with."],
  customize: [
    "Set `--w2dif-size` (or `SIZE` in React) for the full disc, and `REST` for how small it shrinks between words.",
    "Swap `--w2dif-paper` and `--w2dif-ink`; the inverted colours follow automatically because difference subtracts the disc from whatever lies beneath.",
    "Add `data-grow` to any other element that should make the disc swell.",
  ],
  accessibility: [
    "The disc is aria-hidden and fades out when a link takes keyboard focus, so the orange focus outline is never inverted into a different colour.",
  ],
  faqs: [],
  related: [],
  tags: ["mix-blend-mode", "invert cursor", "custom cursor", "typography"],
  height: 731,
  section: true,
  collection: "cursor-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The disc never appears and the specimen reads as plain black type on paper.",
  perf: "One element moved with transform; the blend is done by the compositor, though a very large disc does cost a little more to blend.",
} satisfies UiMeta;
