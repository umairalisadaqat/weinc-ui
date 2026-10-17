const meta = {
  slug: "dot-grid-fabric-background-that-presses-and-springs-under-the-pointer",
  category: "backgrounds",
  name: "Dot Grid Fabric",
  keyword: "interactive dot grid background",
  title: "",
  description: "",
  intro: "A grid of ink dots behaves like stretched cloth: the pointer presses into it, the weave opens into larger rust-coloured dots, and the fabric springs back with a small wobble when you move away. When nobody is pointing, an unseen hand drifts across it on its own. It suits textile, interior and design studio pages.",
  useWhen: [
    "A design studio wants a hero that rewards moving the mouse without hiding anything behind it.",
    "A light, minimal page needs texture with a tactile feel."
  ],
  customize: [
    "Change `SETTINGS.gap` to 16 for a finer weave or 30 for a looser one.",
    "Raise `SETTINGS.push` to 50 for a deeper press.",
    "Lower `SETTINGS.spring` to 12 for a looser, slower recovery."
  ],
  accessibility: [
    "The pointer effect is decoration only and works the same with touch; a soft paper glow behind the centred copy keeps it readable."
  ],
  faqs: [],
  related: [],
  tags: [
    "dot grid",
    "interactive",
    "cursor",
    "canvas",
    "light"
  ],
  height: 600,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "The grid of dots rests almost flat and still, with no idle hand moving across it.",
  perf: "One spring per dot, about 1,700 at desktop size, updated each frame and filled in three batched paths."
};

export default meta;
