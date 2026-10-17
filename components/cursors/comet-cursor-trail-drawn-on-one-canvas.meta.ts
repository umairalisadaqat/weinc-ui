export default {
  slug: "comet-cursor-trail-drawn-on-one-canvas",
  category: "cursors",
  name: "Comet Cursor Trail on Canvas",
  keyword: "comet cursor trail",
  title: "",
  description: "",
  intro:
    "A warm comet with a glowing head and a tapering tail streaks after the pointer across a starry navy sky, behind the listings for a small observatory's public nights. The whole tail is redrawn on a single canvas each frame from a short list of recent positions, so it bends smoothly through curves instead of breaking into separate dots.",
  useWhen: ["A night-themed event, astronomy club, music venue or launch page with a dark hero."],
  customize: [
    "Raise `LEN` for a longer tail or lower it for a quick spark.",
    "Change `RGB` to recolour the tail, for example a cool `190,220,255` for an icy comet.",
    "Edit `WIDTH` to make the tail thicker at the head.",
  ],
  accessibility: [
    "The canvas is aria-hidden, sits behind the text and fades away while a link has keyboard focus, so the white focus outline is never crossed by the tail.",
  ],
  faqs: [],
  related: [],
  tags: ["comet trail", "canvas cursor", "mouse trail", "night sky"],
  height: 640,
  section: true,
  collection: "cursor-effects",
  tech: "canvas",
  support: "All current browsers",
  reducedMotion: "No canvas is drawn; the starry background and listings show as a still page.",
  perf: "About thirty short line strokes and one small gradient per frame on a canvas capped at 2x pixel ratio, stopped off screen.",
} satisfies UiMeta;
