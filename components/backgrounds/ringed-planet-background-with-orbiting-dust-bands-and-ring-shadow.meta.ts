const meta = {
  slug: "ringed-planet-background-with-orbiting-dust-bands-and-ring-shadow",
  category: "backgrounds",
  name: "Ringed Planet Dust Bands",
  keyword: "space background animation",
  title: "",
  description: "",
  intro: "A banded gas giant hangs in the lower right of a dark sky, wrapped in a tilted ring of dust grains that orbit at their own speeds, inner grains faster than outer ones. The ring passes behind the planet and in front of it, with gaps between the bands. It suits observatories, science courses, astronomy clubs and space-themed launches.",
  useWhen: [
    "A science, astronomy or education page wants something real-looking instead of clip-art planets.",
    "A dark launch page needs a large, slow focal point to the side of the headline."
  ],
  customize: [
    "Change `SETTINGS.planet` to `[\"#bcd4e6\", \"#5b7f9e\", \"#101a26\"]` for an icy blue world.",
    "Set `SETTINGS.tilt` to -0.4 for a steeper ring.",
    "Lower `SETTINGS.grains` to 2,000 on pages with heavy content."
  ],
  accessibility: [
    "The planet sits low and to the right, away from the copy, so the heading always reads against near-black sky."
  ],
  faqs: [],
  related: [],
  tags: [
    "space",
    "planet",
    "rings",
    "canvas",
    "dark"
  ],
  height: 660,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "The planet and its ring are shown once with every grain held in place.",
  perf: "About 3,200 one-pixel grains drawn each frame plus a few gradient fills; light for canvas 2D."
};

export default meta;
