const meta = {
  slug: "lava-lamp-background-with-soft-wax-rising-and-sinking-in-warm-glass",
  category: "backgrounds",
  name: "Lava Lamp Wax",
  keyword: "lava lamp background",
  title: "",
  description: "",
  intro: "Soft orange wax rises, stretches and sinks through dark warm glass, merging and splitting as blobs meet, with a pool resting at the bottom and a red glow around every piece. It is a slower, warmer take on blob backgrounds, made for record shops, bars, late-night radio and retro brands.",
  useWhen: [
    "A nightlife, music or retro brand wants a lazy, hypnotic hero.",
    "A dark page needs one warm moving element that leaves room for the copy."
  ],
  customize: [
    "Swap `SETTINGS.hot` and `SETTINGS.cool` for `[140, 220, 200]` and `[40, 140, 130]` for a sea-green lamp.",
    "Lower `SETTINGS.speed` to 0.6 for an even lazier rise.",
    "Change `SETTINGS.blobs` to 5 for fewer, larger shapes."
  ],
  accessibility: [
    "On wide screens the wax keeps to the right of the copy; on phones it stays in the lower half, below the text."
  ],
  faqs: [],
  related: [],
  tags: [
    "lava lamp",
    "metaballs",
    "retro",
    "canvas",
    "warm"
  ],
  height: 640,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "The wax is frozen mid-rise as a single warm still frame.",
  perf: "A coarse field of samples, one per five pixels, summed over eight blobs at 30 frames a second and scaled up."
};

export default meta;
