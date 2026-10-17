const meta = {
  "slug": "isometric-cube-field-with-a-rolling-ripple-of-light",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "title": "",
  "description": "",
  "faqs": [],
  "related": [],
  "name": "Isometric Cube Field with Light Ripple",
  "keyword": "animated background css",
  "intro": "A deep sea-glass field of isometric cubes, drawn as one tiled SVG, with rings of pale light rolling outward from a point and catching only the top faces. A CSS mask shaped like the cube tops keeps the light on those faces, so the ripple reads like light across a tiled floor. Good for furniture, architecture and product pages.",
  "useWhen": [
    "A design or furniture brand wants a structured, tactile backdrop that still moves."
  ],
  "customize": [
    "Set `--icr-x` and `--icr-y` to choose where the ripples start.",
    "Change `--icr-light` for the ripple colour and `--icr-pulse` for how long one ring takes to cross."
  ],
  "accessibility": [
    "A dark radial scrim sits under the centred text so the light rings never lower its contrast."
  ],
  "tags": [
    "isometric",
    "cubes",
    "ripple",
    "mask",
    "pattern"
  ],
  "height": 640,
  "reducedMotion": "Two still rings of light rest on the cube tops near the starting point.",
  "perf": "Three scaling rings and a pulse inside one masked layer; masks are static, rings use transform and opacity only."
};

export default meta;
