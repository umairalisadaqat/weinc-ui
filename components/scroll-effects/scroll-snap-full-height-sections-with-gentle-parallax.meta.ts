const meta = {
  slug: "scroll-snap-full-height-sections-with-gentle-parallax",
  category: "scroll-effects",
  name: "Scroll Snap Full Height Sections With Gentle Parallax",
  keyword: "scroll snap sections",
  title: "",
  description: "",
  intro: "A three-stop desert journey where each full-height section snaps into place with CSS scroll snapping, and the photo inside each one drifts a little against the frame as it arrives and leaves. The snapping is native, so wheel, keys and touch all land cleanly on a section. Captions sit low over a warm shade for contrast on any photo.",
  useWhen: [
    "A short story told in a few big photos, such as a trip, a product range or a project case study.",
    "You want slide-like pacing without building a carousel or hijacking the wheel.",
  ],
  customize: [
    "Switch `scroll-snap-type: y mandatory` to `y proximity` if sections hold more text than fits in one screen.",
    "Change `SHIFT` for more or less drift; keep it under the 10% of spare photo set by `top: -10%`.",
    "Set `--w6snp-h` to `100vh` when the sections should fill the window.",
  ],
  accessibility: [
    "Each section has its own heading and true alt text, the box is a labelled focusable region so arrow keys and Page Down step through it, and reduced motion keeps the photos still while snapping stays.",
  ],
  faqs: [],
  related: [],
  tags: ["scroll snap", "full height sections", "parallax", "storytelling", "photo sections"],
  height: 600,
  section: true,
  collection: "smooth-scroll-and-parallax",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Sections still snap into place, but each photo stays fixed and centred in its frame.",
  perf: "Snapping is native CSS; a passive listener writes three transforms per scroll frame and idles off screen.",
};

export default meta;
