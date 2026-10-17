const meta = {
  slug: "wireframe-topographic-terrain-background-gliding-under-a-low-camera",
  category: "backgrounds",
  name: "Wireframe Terrain Glide",
  keyword: "animated terrain background",
  title: "",
  description: "",
  intro: "A graphite wireframe of hills rolls toward a low camera on warm paper, fading into mist at the horizon, with one contour height traced in rust. Hidden lines behind each ridge are removed, so it reads like a survey drawing rather than a neon grid. It suits architects, surveyors, mapping tools and outdoor brands.",
  useWhen: [
    "A technical or engineering brand wants motion that looks drawn rather than glowing.",
    "A light, editorial page needs depth below a centred headline."
  ],
  customize: [
    "Set `SETTINGS.relief` to 1.6 for steep alpine ridges or 0.5 for rolling farmland.",
    "Change `SETTINGS.accent` to a blue such as `rgba(40, 90, 170, 0.85)` to recolour the traced contour.",
    "Lower `SETTINGS.rows` to 32 to shorten the view and lighten the drawing."
  ],
  accessibility: [
    "A paper-coloured fade covers the upper part of the block, so the headline never sits on top of busy lines."
  ],
  faqs: [],
  related: [],
  tags: [
    "terrain",
    "wireframe",
    "topography",
    "canvas",
    "light"
  ],
  height: 640,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "The terrain is drawn once, held still at its starting position.",
  perf: "About 4,400 projected points drawn as line paths each frame on canvas 2D, with no per-pixel work."
};

export default meta;
