const meta = {
  slug: "deep-sea-teal-mesh-gradient-background",
  category: "backgrounds",
  name: "Deep Sea Teal Mesh Gradient",
  keyword: "animated mesh gradient",
  title: "",
  description: "",
  intro: "Six teal and blue-green pools wander slowly through dark water, blending into one soft mesh with no hard edges. The mesh is painted onto a tiny canvas and stretched by the browser, with a grain layer on top so the deep shades never step into bands. It suits diving, marine, wellness or any calm product that wants depth behind white type.",
  useWhen: [
    "A hero needs a moving mesh gradient where the colour points truly travel, which stacked CSS blobs cannot imitate.",
    "Your brand is cool and quiet and a bright animated backdrop would fight the headline.",
  ],
  customize: [
    "Change the six `POOLS` colours to retint the water; keep them within one hue family so the mesh stays calm.",
    "Raise `SLOWNESS` from 9000 to 15000 for a drift you barely notice, or lower it toward 5000 for visible currents.",
    "The `shade` line darkens the lower half; change `0.35` to `0` for an even tone from top to bottom.",
  ],
  accessibility: [
    "The canvas and grain carry `aria-hidden` and ignore the pointer, so the heading, copy and button read and click normally.",
  ],
  faqs: [],
  related: [],
  tags: ["mesh gradient", "canvas", "teal", "ocean", "hero background"],
  height: 600,
  section: true,
  collection: "animated-gradient-background",
  tech: "canvas",
  reducedMotion: "The mesh is painted once and stays as a single settled frame of deep teal water.",
  perf: "One 120 pixel wide canvas recomputed each frame with six colour points, well under a millisecond, paused off screen.",
};

export default meta;
