const meta = {
  "slug": "dust-motes-drifting-in-a-shaft-of-sunlight-background",
  "category": "backgrounds",
  "name": "Dust Motes in a Sunlight Shaft",
  "keyword": "dust particle background",
  "title": "",
  "description": "",
  "intro": "A dim workshop with one slanted beam of sunlight falling through it. Hundreds of dust motes wander on soft Brownian currents and only catch fire while they cross the beam, then fade back into the dark. A few out-of-focus specks drift close to the lens. It suits craft, heritage and interior brands that want warmth instead of tech gloss.",
  "useWhen": [
    "A furniture maker, bakery or bookbinder wants a hero that feels like a real room at a quiet hour.",
    "Your page is dark and warm and needs slow, almost still movement rather than anything that pulls the eye."
  ],
  "customize": [
    "Move the beam by editing `tx0`, `tx1` (where it enters at the top) and `bx0`, `bx1` (where it lands) inside `createScene`.",
    "Set `LIGHT` to `\"214,232,255\"` for cool north-window daylight instead of late afternoon gold.",
    "Raise `MOTES_PER_MPX` to 500 for a dustier room, or lower `DRIFT_SPEED` to 0.5 for air that barely moves."
  ],
  "accessibility": [
    "The canvas carries `aria-hidden` and ignores pointer events, so the heading and the booking link stay first for screen readers and clicks."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "canvas",
    "sunlight",
    "dust",
    "warm"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "The beam and its motes are painted once in a settled position and nothing moves after that.",
  "perf": "One half-resolution beam image plus up to 560 small sprite draws per frame; light on CPU and paused when scrolled away."
};

export default meta;
