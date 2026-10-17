const meta = {
  slug: "brushed-steel-plate-with-sliding-light-sheen-background",
  category: "backgrounds",
  name: "Brushed Steel with a Sliding Sheen",
  keyword: "css animated background",
  title: "",
  description: "",
  intro: "A dark graphite steel plate with fine horizontal brush marks, crossed every few seconds by a slanted sheen that lifts the grain as it travels, followed by a wider, softer reflection. The brushing is generated noise stretched along one axis. It fits machine shops, hardware, tools, watches and any industrial brand.",
  useWhen: ["A manufacturer or tool maker wants a hero that looks machined rather than painted.", "A dark product launch page needs a single sweep of light to draw attention."],
  customize: ["Change `--bst-metal` for another finish; `#3a3631` turns it to bronze toned steel, `#8d949b` makes a light aluminium (switch to dark text).", "Set `--bst-speed` to the time between sheens, since each sweep crosses in the first part of the cycle and then rests.", "Tone the brushing up or down with `--bst-grain`, a value from 0 to 1."],
  accessibility: ["Light text stays over 4.5:1 against the metal even at the moment the sheen passes behind it.", "The plate texture and both sheens are inside a decorative wrapper hidden from assistive tools."],
  faqs: [],
  related: [],
  tags: ["brushed metal", "steel", "sheen", "graphite", "pure css"],
  height: 560,
  section: true,
  collection: "animated-background-css",
  tech: "css",
  reducedMotion: "One sheen rests across the middle of the plate, so the brushing still shows its direction.",
  perf: "Two skewed bands move by transform with blend modes; the brushed noise is painted once.",
};

export default meta;
