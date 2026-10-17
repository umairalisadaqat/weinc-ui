const meta = {
  "slug": "glowing-plankton-in-deep-water-particle-background",
  "category": "backgrounds",
  "name": "Glowing Plankton in Deep Water",
  "keyword": "underwater particle background",
  "title": "",
  "description": "",
  "intro": "Deep water lit by the creatures in it. Hundreds of plankton specks drift on slow currents with a dim pulse, and any one of them can flash bright and fade, the way real bioluminescence reacts to movement. Large, faint blue glows wander past, marine snow sinks through the frame and pale rays reach down from the surface.",
  "useWhen": [
    "A dive school, aquarium or marine charity wants a hero that feels like being underwater at night.",
    "You want a dark teal palette with soft, occasional bright moments instead of constant glitter."
  ],
  "customize": [
    "Change `GLOW` for the plankton colour; `\"120,200,255\"` gives a cooler, bluer sea.",
    "Raise `FLASH_CHANCE` to 0.2 for a busy, sparkling sea, or 0.02 for rare flashes.",
    "Set `CURRENT` to 0.5 to slow the drift right down."
  ],
  "accessibility": [
    "The canvas is `aria-hidden`, and flashes are small and soft with no strobing, so nothing flickers across the text."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "particles",
    "ocean",
    "bioluminescence",
    "canvas",
    "dark"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "tech": "canvas",
  "reducedMotion": "A still frame of glowing water with specks, faint rays and a few large glows in place.",
  "perf": "Three sprite types, up to about 800 draws per frame plus one cached ray image; moderate, and paused off screen."
};

export default meta;
