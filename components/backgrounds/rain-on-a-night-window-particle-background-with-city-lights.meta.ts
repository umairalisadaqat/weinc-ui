const meta = {
  "slug": "rain-on-a-night-window-particle-background-with-city-lights",
  "category": "backgrounds",
  "name": "Rain on a Night Window",
  "keyword": "rain animation background",
  "title": "",
  "description": "",
  "intro": "The view through a wet window at night. Blurred street lights glow behind the glass, thin rain streaks fall outside at a slight slant, and beads of water sit on the pane itself. Now and then a heavy bead lets go and runs down, leaving a fading trail. Fits bars, music venues, cinemas and moody editorial pages.",
  "useWhen": [
    "A late-night venue or film project wants a cinematic, rainy hero that stays dark enough for light text.",
    "You want two layers of motion at different speeds, fast rain behind and slow drops in front."
  ],
  "customize": [
    "Swap the street-light colours in the `CITY` array, for instance all warm ambers for an old town.",
    "Set `SLANT` to 0 for rain falling straight down, or 0.3 for a windy night.",
    "Raise `BEADS_PER_MPX` for a pane covered in water; lower `STREAKS_PER_MPX` for a drizzle."
  ],
  "accessibility": [
    "Everything is drawn on one `aria-hidden` canvas, and the bright lights are kept to the lower part of the section, away from the heading."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "rain",
    "canvas",
    "night",
    "city"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "A still pane with drops resting on it and rain streaks frozen against the blurred city.",
  "perf": "One cached city image, up to 500 short lines and 600 small bead sprites per frame; moderate, and stopped off screen."
};

export default meta;
