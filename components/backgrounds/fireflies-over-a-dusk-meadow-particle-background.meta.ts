const meta = {
  "slug": "fireflies-over-a-dusk-meadow-particle-background",
  "category": "backgrounds",
  "name": "Fireflies over a Dusk Meadow",
  "keyword": "firefly particle animation",
  "title": "",
  "description": "",
  "intro": "Fireflies wander over a meadow at the end of the day, each one blinking on its own slow rhythm. The grass is a silhouette drawn once at load in two layers, and fireflies are split by depth: the far ones glow behind the grass, the near ones in front of it and larger. Good for camping, outdoor and summer event pages.",
  "useWhen": [
    "A campground, outdoor festival or garden venue wants an evening mood with very little movement.",
    "You like the warmth of glowing particles but need them to feel like a place rather than abstract dots."
  ],
  "customize": [
    "Tint the glow with `GLOW`, for example `\"255,206,120\"` for warmer, amber-coloured insects.",
    "Change `NEAR_GRASS` and `FAR_GRASS` to recolour the meadow, and the `h * 0.34` and `h * 0.2` arguments to `blades` to make the grass taller or shorter.",
    "Set `BLINK_RATE` to 0.5 for slow, lazy flashes."
  ],
  "accessibility": [
    "The canvas is `aria-hidden` and the cream heading sits on the sky above the grass, where contrast stays high."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "fireflies",
    "canvas",
    "nature",
    "dusk"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "The meadow appears with fireflies frozen at different stages of their glow.",
  "perf": "One cached grass image plus up to 100 additive sprite draws per frame; very cheap, and the loop pauses off screen."
};

export default meta;
