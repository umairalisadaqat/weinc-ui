export default {
  slug: "canvas-tile-image-transition-drag-slider-with-momentum",
  category: "galleries",
  name: "Canvas Tile Image Transition Drag Slider",
  keyword: "image transition slider",
  tags: ["image slider", "canvas", "drag slider", "momentum", "tile transition"],
  height: 756,
  collection: "carousel-slider",
  tech: "canvas",
  support: "All current browsers; plain image swap if the canvas cannot draw",
  reducedMotion: "Photos and captions swap straight to the chosen slide with no tile sweep and no glide.",
  perf: "The canvas paints forty tiles only during a change of under a second, then a plain image takes over.",
  intro: "A pottery studio's year told in five photos, with a numbered caption list under the picture. Pulling the photo or the list sideways moves the captions with momentum, and every time a new caption lands the photo breaks into a grid of tiles that slide and fade into the next shot. Suits a portfolio or process story with a handful of strong images.",
  customize: [
    "Change `COLS` and `ROWS` for coarser or finer tiles, and `DUR` for a slower or quicker sweep.",
    "Lower `FRICTION` toward 0.9 so a flick stops sooner, or raise it to 0.95 for a longer coast.",
    "Recolour the paper, ink and rust accent with `--w2til-bg`, `--w2til-ink` and `--w2til-acc` in the HTML version, and set caption width with `--w2til-item`.",
  ],
  accessibility: [
    "Each photo keeps its own alt text and only the visible one is exposed; the caption list items are labelled slides, and buttons or arrow keys announce the new caption politely.",
  ],
  useWhen: [
    "A maker or studio wants a few large process photos to feel crafted without loading a slider library.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
