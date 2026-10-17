const meta = {
  "slug": "wind-blown-sand-grains-over-desert-dunes-particle-background",
  "category": "backgrounds",
  "name": "Wind-Blown Sand over Dunes",
  "keyword": "sand particle animation",
  "title": "",
  "description": "",
  "intro": "Layered dunes under a pale sky, with sand grains streaming low across the nearest ridge. Gusts travel across the frame as moving bands, so grains speed up, stretch into streaks and slow down again as each band passes. Grains hug the ground and thin out with height, as real drifting sand does. A warm, light option for travel and outdoor brands.",
  "useWhen": [
    "A travel company, desert lodge or outdoor gear shop wants a sunlit hero with motion at the bottom edge only.",
    "You want a light theme where the moving part stays away from the headline."
  ],
  "customize": [
    "Recolour the three ridges in `DUNES`, from far to near, and the grains with `GRAIN`.",
    "Set `WIND` to 2 for a sandstorm, or 0.5 for a gentle drift.",
    "Move the dunes up or down with the `0.62` in the `ridge` function."
  ],
  "accessibility": [
    "Grains stay in the lower part of the section, under dark brown copy that keeps high contrast on the pale sky."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "sand",
    "desert",
    "canvas",
    "light theme"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "The dunes stand still with sand grains settled into a frozen drift along the near ridge.",
  "perf": "One cached dune image and up to 1,400 thin rectangles per frame; light, and the loop sleeps off screen."
};

export default meta;
