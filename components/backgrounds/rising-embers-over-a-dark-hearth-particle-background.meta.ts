const meta = {
  "slug": "rising-embers-over-a-dark-hearth-particle-background",
  "category": "backgrounds",
  "name": "Rising Embers over a Dark Hearth",
  "keyword": "ember particle background",
  "title": "",
  "description": "",
  "intro": "Sparks lift off a glowing bed of coals at the bottom of a dark room, swirl on rising heat and cool as they climb: pale yellow at first, then orange, then a dull red before they wink out. Each ember flickers, and the coal glow breathes underneath. Made for restaurants, bakeries, forges and anything built around fire.",
  "useWhen": [
    "A wood-fired restaurant or blacksmith wants the warmth of a hearth behind its booking button.",
    "You need upward motion that feels physical, with particles that change colour as they age."
  ],
  "customize": [
    "Recolour the three life stages with `HOT`, `WARM` and `COOL`; for a gas flame look try blues such as `\"190,220,255\"`.",
    "Raise `HEAT` to 1.6 for a roaring fire with fast sparks, or lower it to 0.6 for a fire burning down.",
    "Widen the spark source by changing the `0.8` inside the `spawn` function's x position."
  ],
  "accessibility": [
    "Embers stay small and dim behind the copy, and the canvas is `aria-hidden` so it never reaches assistive technology."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "embers",
    "fire",
    "canvas",
    "warm"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "A still scene of glowing coals with embers caught mid-air at different heights.",
  "perf": "Up to 420 additive sprite draws plus one glow image per frame, all from three pre-rendered tints; paused off screen."
};

export default meta;
