const meta = {
  slug: "rain-on-a-window-at-night-background-with-drops-that-refract-street-lights",
  category: "backgrounds",
  name: "Rain on a Night Window",
  keyword: "rain on glass background",
  title: "",
  description: "",
  intro: "You look out through a wet window at a street full of out-of-focus lamps. Beads of water cling to the glass, and larger drops break loose, run in bursts and leave a trail of tiny droplets. Each running drop is a little lens that shows the lights upside down and sharp. Made for bars, late shows, night radio and moody fiction.",
  useWhen: [
    "A bar, jazz club or night radio show wants a hero with weather and warmth.",
    "A story or film page needs a rainy, reflective mood in place of a video."
  ],
  customize: [
    "Edit `SETTINGS.lights` to change the street: all `\"255,176,92\"` gives a sodium-lamp town.",
    "Raise `SETTINGS.runners` to 40 for a heavier shower.",
    "Lower `SETTINGS.rain` to 0.4 so drops cling longer before they run."
  ],
  accessibility: [
    "A dark gradient behind the copy keeps the white heading readable over the brightest lamps."
  ],
  faqs: [],
  related: [],
  tags: [
    "rain",
    "glass",
    "night",
    "bokeh",
    "canvas"
  ],
  height: 640,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "A still pane of glass with clinging drops in front of the blurred street lights.",
  perf: "Three images built once at load; each frame copies them and clips about 26 small drops, which is light work on canvas 2D."
};

export default meta;
