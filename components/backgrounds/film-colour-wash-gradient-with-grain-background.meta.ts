const meta = {
  slug: "film-colour-wash-gradient-with-grain-background",
  category: "backgrounds",
  name: "Film Colour Wash With Grain",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "A teal and amber colour grade pans slowly across a near-black frame, a warm light leak breathes at the right edge and a coarse grain flickers on top like a projected print. The grain tile jumps between offsets in steps, the cheapest way to fake moving film stock. Built for photographers, film labs, production companies and music pages that want a cinematic opening without a video file.",
  useWhen: [
    "You want the feel of a graded film still behind a headline, without shipping and autoplaying footage.",
    "A portfolio or studio site needs a dark, warm hero that keeps its copy bottom-left like a title card.",
  ],
  customize: [
    "Swap `--flm-shadow` and `--flm-light` for a green and magenta pair to imitate a different film stock.",
    "Turn the grain down by setting `.flm-grain` opacity to `.18`, or slow its flicker by changing `.9s` in its animation.",
    "Delete the `.flm-leak` element if the warm flare is too much for your brand.",
  ],
  accessibility: [
    "The grain flicker moves in small steps rather than flashing, and it stops entirely when reduced motion is requested.",
    "Cream text sits low in the frame where the vignette darkens the grade, which keeps contrast comfortably high.",
  ],
  faqs: [],
  related: [],
  tags: ["film grain", "cinematic", "colour grade", "light leak", "dark hero"],
  height: 620,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The grade, leak and grain freeze into one still frame that looks like a single film scan.",
  perf: "Four layers animate transform and opacity only; the grain is a single small tile, so the cost is compositing.",
};

export default meta;
