export default {
  slug: "main-slide-with-synced-draggable-thumbnail-strip",
  category: "galleries",
  name: "Main Slide With Synced Draggable Thumbnail Strip",
  keyword: "slider with thumbnails",
  tags: ["thumbnail slider", "product gallery", "drag slider", "momentum", "synced carousel"],
  height: 836,
  collection: "carousel-slider",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The main photo and the strip jump straight to the chosen piece; dragging still follows the pointer without a glide.",
  perf: "Two rails share one short physics routine and each runs a frame loop only while it is moving.",
  intro: "A furniture showroom's main photo above a strip of thumbnails, kept in step both ways. Drag the big photo and it coasts onto a whole slide while the strip slides to centre the matching thumbnail; drag the strip on its own and it free-scrolls with momentum and stops wherever you leave it, then a tap on any thumbnail brings that piece up. Fits product pages and room galleries.",
  customize: [
    "Change thumbnail width with `--w2thm-th` and the strip gap on `.w2thm-thumbs`; the centring maths reads real sizes, so no other edit is needed.",
    "Lower `FRICTION` if the free strip coasts too far, or raise `RUBBER` for a looser pull at the ends.",
    "Swap the slate accent ring and buttons through `--w2thm-acc`.",
  ],
  accessibility: [
    "Every thumbnail is a real button named after its piece with aria-current on the active one, focusing a thumbnail scrolls it into the middle of the strip, and a drag across thumbnails never counts as a tap.",
  ],
  useWhen: [
    "A product or property needs one large photo with quick access to the rest of the set.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
