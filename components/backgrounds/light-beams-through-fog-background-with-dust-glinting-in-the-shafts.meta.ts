const meta = {
  slug: "light-beams-through-fog-background-with-dust-glinting-in-the-shafts",
  category: "backgrounds",
  name: "Light Beams Through Fog",
  keyword: "light rays background",
  title: "",
  description: "",
  intro: "Shafts of warm light slant down from unseen high windows into a dark green fog, brightening and dimming as if clouds pass outside, while specks of dust glint only where they drift through a beam. It gives a quiet, sacred mood to venues, concert series, perfume, spas and slow hospitality pages.",
  useWhen: [
    "A venue or event page wants atmosphere and a sense of a real room.",
    "A dark brand needs light in the scene without bright colour behind the copy."
  ],
  customize: [
    "Change `SETTINGS.light` to `[200, 220, 255]` for cold moonlight instead of late sun.",
    "Set `SETTINGS.tilt` to 0 for shafts that fall straight down.",
    "Raise `SETTINGS.motes` to 260 for a dustier room."
  ],
  accessibility: [
    "A dark gradient behind the left side keeps the pale serif heading well above the contrast minimum even where a beam is brightest."
  ],
  faqs: [],
  related: [],
  tags: [
    "light rays",
    "fog",
    "dust",
    "canvas",
    "dark"
  ],
  height: 640,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "The beams, fog and dust are painted in a single still frame.",
  perf: "Six pre-drawn beam images and sixteen fog sprites, blended at reduced resolution, plus a short loop over the dust specks."
};

export default meta;
