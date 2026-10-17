const meta = {
  "slug": "text-shadow-depth-following-a-moving-light",
  "category": "text-effects",
  "name": "Text Shadow Depth Following a Moving Light",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "Terracotta lettering with a stacked, extruded shadow that leans away from a warm patch of sunlight drifting slowly across a plaster wall. As the light moves from left to right, the depth swings from one side of the letters to the other, like a sign on a sunny street over an afternoon.",
  "useWhen": [
    "A warm, crafted hero for potters, builders or Mediterranean food, where a little physical depth suits the brand."
  ],
  "customize": [
    "Change the depth colour with `--ts-depth` on `.ts-root`; it should be a darker shade of the letter colour `--ts-ink`.",
    "Make the letters deeper by adding layers to both `text-shadow` lists; each layer must appear in both keyframes for the swing to stay smooth.",
    "Slow the sun with `--ts-speed`; the light patch and the shadow share it so they stay in step."
  ],
  "accessibility": [
    "The headline is plain text, and the terracotta on plaster keeps better than 4.5:1 contrast even without the shadow."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "text shadow animation",
    "3d text shadow css",
    "long shadow text",
    "moving light effect"
  ],
  "height": 500,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "The light rests above the middle of the line and the shadow falls straight down.",
  "perf": "Animates text-shadow, which repaints the headline every frame, plus one transformed light layer; keep it to one heading."
};

export default meta;
