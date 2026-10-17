const meta = {
  "slug": "parallax-starfield-particle-background-with-slow-drift",
  "category": "backgrounds",
  "name": "Parallax Starfield with Slow Drift",
  "keyword": "starfield background",
  "title": "",
  "description": "",
  "intro": "A night sky that pans slowly sideways. Stars are tinted from blue-white to warm orange and move at speeds set by their depth, so near stars pass faster than far ones. Behind them a faint band of the galaxy, made of clouds and dense dust, drifts even more slowly and tiles without a seam. Small stars twinkle; the brightest carry a soft halo.",
  "useWhen": [
    "An astronomy club, observatory or night-sky tour wants a believable sky rather than random white dots.",
    "A product launch page needs a deep, quiet backdrop that still moves."
  ],
  "customize": [
    "Set `DRIFT` to 0 for a fixed sky that only twinkles, or 3 for a visible pan.",
    "Edit the `TINTS` array to change star colours, for example all cool blues for a colder look.",
    "Lower `STARS_PER_MPX` to 300 for a sparse suburban sky."
  ],
  "accessibility": [
    "Stars are painted on an `aria-hidden` canvas, and the twinkle is a gentle opacity change rather than a flash."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "stars",
    "space",
    "canvas",
    "parallax"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "A still sky with the galaxy band and every star fixed in place.",
  "perf": "One cached galaxy image drawn twice plus up to 1,100 star sprites per frame; light to moderate, paused off screen."
};

export default meta;
