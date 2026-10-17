const meta = {
  "slug": "falling-snow-particle-background-with-depth-and-wind-gusts",
  "category": "backgrounds",
  "name": "Falling Snow with Depth and Gusts",
  "keyword": "snow particle background",
  "title": "",
  "description": "",
  "intro": "Snow falling past a dusk sky in three apparent depths: tiny slow flakes far away, crisp ones in the middle and a few large blurred flakes drifting right past the lens. A wind model mixes slow swells with an occasional strong gust, and near flakes are pushed harder than far ones, so the whole fall leans and recovers like real weather.",
  "useWhen": [
    "A ski lodge, winter retreat or seasonal campaign wants weather in the hero without a video file.",
    "You want snow that feels calm most of the time but has the odd gust so the scene never looks like a looping screensaver."
  ],
  "customize": [
    "Set `WIND` to 0 for snow falling straight down, or 2 for something closer to a storm.",
    "Raise `FLAKES_PER_MPX` for heavier snowfall; the flake count already scales down on phones.",
    "Change the gust timing by editing the `0.11` inside the `Math.max(0, Math.sin(t * 0.11 - 1))` term of `target`."
  ],
  "accessibility": [
    "Flakes are drawn on an `aria-hidden` canvas that ignores pointer events, and the light copy sits on a dark sky with strong contrast."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "snow",
    "canvas",
    "winter",
    "night"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "A still frame of snow hanging in the air at every depth, with no wind or fall.",
  "perf": "Up to 760 sprite draws per frame with no per-frame allocation; a light load that pauses whenever the hero leaves view."
};

export default meta;
