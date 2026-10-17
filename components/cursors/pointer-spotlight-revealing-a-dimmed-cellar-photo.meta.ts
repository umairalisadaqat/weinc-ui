export default {
  slug: "pointer-spotlight-revealing-a-dimmed-cellar-photo",
  category: "cursors",
  name: "Pointer Spotlight Over a Dimmed Photo",
  keyword: "cursor spotlight effect",
  title: "",
  description: "",
  intro:
    "A barrel room photograph sits in near darkness and a soft pool of light follows the pointer, so visitors explore the racks the way a cellar hand would with a lamp. The darkness is one oversized gradient layer that slides with transform, which keeps it smooth on large screens. On phones the light rests in place and jumps to wherever you tap.",
  useWhen: ["A winery, gallery, museum or venue hero where the room itself is the thing worth exploring."],
  customize: [
    "Change `--w2spt-r` (or `RADIUS` in React) to widen or tighten the pool of light.",
    "Edit the last stop of the shade gradient, `.9`, to make the unlit area darker or let more of the photo show through.",
    "Raise `EASE` toward 0.25 so the light keeps up with fast hands, or lower it for a lazier lamp.",
  ],
  accessibility: [
    "The heading, copy and buttons sit above the darkened layer on their own solid gradient, so they stay readable wherever the light is, and the photo keeps its full alt text.",
  ],
  faqs: [],
  related: [],
  tags: ["spotlight", "cursor spotlight", "flashlight effect", "photo hero"],
  height: 600,
  section: true,
  collection: "cursor-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The darkened layer is removed and the whole photo shows behind the copy.",
  perf: "A single gradient layer moved with transform, so the gradient is painted once and only composited after that.",
} satisfies UiMeta;
