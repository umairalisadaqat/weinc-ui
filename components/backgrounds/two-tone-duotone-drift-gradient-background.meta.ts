const meta = {
  slug: "two-tone-duotone-drift-gradient-background",
  category: "backgrounds",
  name: "Two-Tone Duotone Drift",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "Just two inks, harbour navy and fired clay, share the frame and the line between them keeps wandering. The boundary is a linear gradient whose angle and midpoint are registered properties, so both animate, while two soft pools of each colour drift across the seam. A fine dot screen and grain make it look like a two-colour print. Fits record labels, posters, events and bold editorial brands.",
  useWhen: [
    "Your brand has exactly two colours and you want a background that uses nothing else.",
    "A poster-like hero with heavy type suits the page better than a soft multicolour mesh.",
  ],
  customize: [
    "Set `--duo-ink` and `--duo-clay` to your two brand colours; both must stay dark enough for the cream text.",
    "Widen the blend by changing `- 22%` and `+ 26%` in `.duo-field` to larger numbers, or shrink them for a crisper edge.",
    "Hide the print texture by setting `.duo-screen` opacity to `0`, or enlarge the dots with `background-size: 7px 7px`.",
  ],
  accessibility: [
    "Both tones were picked so the cream headline and copy pass 4.5 to 1 on either side of the moving boundary.",
  ],
  faqs: [],
  related: [],
  tags: ["duotone", "two colour", "halftone", "css @property", "poster"],
  height: 580,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The two tones meet along one fixed diagonal, with the dot screen and grain still in place.",
  perf: "One gradient repaints as its angle and midpoint animate, and two pools move by transform; light, with no script per frame.",
};

export default meta;
