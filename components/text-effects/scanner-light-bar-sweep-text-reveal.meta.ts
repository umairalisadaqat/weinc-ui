const meta = {
  slug: "scanner-light-bar-sweep-text-reveal",
  category: "text-effects",
  name: "Scanner Light Bar Sweep",
  keyword: "text reveal animation css",
  title: "",
  description: "",
  intro: "A thin sea glass light travels down a graphite plate and leaves the headline behind it, as if a document scanner has just read it. Before the pass you see only a faint outline of the letters, so the frame is never empty. It suits archiving, document, lab and data products.",
  useWhen: ["A hero for a service that reads, scans or verifies things."],
  customize: ["Recolour the beam with `--slb-light` and the glow values in `.slb-bar` box-shadow.", "Change `--slb-cycle` to slow the scan; the pass takes the first 22% of each cycle.", "Remove `.slb-ghost` if you would rather start from a blank plate."],
  accessibility: ["A hidden span carries the headline for screen readers; the outline, lit copy and light bar are all decorative."],
  faqs: [],
  related: [],
  tags: ["scanner text effect", "clip-path text reveal", "light sweep animation", "css reveal"],
  height: 600,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "The headline shows fully lit on its plate and the light bar is hidden.",
  perf: "One clip-path animation and one transformed bar; light enough for any page, paused off screen.",
};

export default meta;
