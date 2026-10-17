const meta = {
  "slug": "dot-matrix-grid-with-a-travelling-band-of-light",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "title": "",
  "description": "",
  "faqs": [],
  "related": [],
  "name": "Dot Matrix with Travelling Light",
  "keyword": "animated background css",
  "intro": "A pale grey dot grid on near-white, where a slate-blue band of light sweeps across and colours only the dots it passes, followed later by a smaller copper band going the other way. A CSS mask shaped like the grid limits the colour to the dots. It suits finance, consulting and software sites with a light, tidy look.",
  "useWhen": [
    "A light, professional page needs a sign of life behind the hero without colour washes."
  ],
  "customize": [
    "Change `--dmx-gap` and `--dmx-dot` for spacing and dot size; the mask follows both.",
    "Recolour the sweep with `--dmx-lit` and set its pace with `--dmx-speed`."
  ],
  "accessibility": [
    "A soft white oval sits under the text, so the coloured dots never cross the copy at full strength."
  ],
  "tags": [
    "dot grid",
    "mask",
    "light theme",
    "minimal",
    "sweep"
  ],
  "height": 600,
  "reducedMotion": "The blue band rests on the left third and the copper one on the right, both still.",
  "perf": "Two bands slide with transform under a fixed mask; the dot pattern itself never repaints."
};

export default meta;
