const meta = {
  "slug": "lighthouse-beam-sweeping-through-sea-fog-background",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "title": "",
  "description": "",
  "faqs": [],
  "related": [],
  "name": "Lighthouse Beam Through Sea Fog",
  "keyword": "css background animation",
  "intro": "A lamp on a dark headland turns two soft beams of warm light through banks of slate-blue fog, with a faint glint crossing the sea each time a beam passes. The beams are one rotating conic gradient that fades with distance. It suits maritime, travel or night services that want slow, steady motion behind a left-aligned headline.",
  "useWhen": [
    "A harbour, coastal hotel or night service wants a calm hero with one slow, recognisable motion."
  ],
  "customize": [
    "Move the lamp with `--lhb-x` and `--lhb-y`; the beams, tower and glow all follow.",
    "Change `--lhb-turn` to set how long one rotation takes, and `--lhb-beam` to tint the light."
  ],
  "accessibility": [
    "A dark gradient veil sits behind the left column, so the copy stays readable even while a beam crosses it."
  ],
  "tags": [
    "conic gradient",
    "lighthouse",
    "fog",
    "night",
    "dark"
  ],
  "height": 640,
  "reducedMotion": "The lamp stays lit with one beam held pointing up and to the left over still fog.",
  "perf": "One large rotating layer plus three drifting fog layers, all transform or opacity; no script loop."
};

export default meta;
