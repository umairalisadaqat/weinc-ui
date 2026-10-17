const meta = {
  slug: "linen-weave-texture-under-slow-moving-lamp-background",
  category: "backgrounds",
  name: "Linen Weave Under a Moving Lamp",
  keyword: "css background animation",
  title: "",
  description: "",
  intro: "A close view of oatmeal linen, with crossing threads, uneven slubs and a soft fold, while a warm lamp glow circles slowly over the cloth and brings the weave forward wherever it lands. The texture comes from layered gradients and generated noise, so there is no image to load. It suits bedding, clothing, interiors and slow living brands.",
  useWhen: ["A textile or home goods store wants its hero to feel like cloth you could touch.", "A calm, warm background is needed behind dark serif or sans headings."],
  customize: ["Dye the cloth by changing `--lnw-cloth`; a sage `#b9c2ad` or a slate `#9ea7ad` both keep the weave visible.", "Tighten or loosen the weave with `--lnw-thread`, which sets the gap between threads in pixels.", "Change the light with `--lnw-lamp` and its pace with `--lnw-speed`."],
  accessibility: ["Dark brown copy on light linen stays well above 4.5:1, and the lamp only brightens the cloth around it.", "The weave, fold, lamp and vignette sit inside a hidden decorative wrapper that cannot be focused or clicked."],
  faqs: [],
  related: [],
  tags: ["linen", "fabric", "texture", "lamp light", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  tech: "css",
  reducedMotion: "The lamp stays over the upper right of the cloth, so the weave is lit there and shaded toward the edges.",
  perf: "One glow layer moves by transform with an overlay blend; the weave and noise are painted once.",
};

export default meta;
