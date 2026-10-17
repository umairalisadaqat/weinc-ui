const meta = {
  "slug": "drifting-topographic-contour-lines-at-dawn-background",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "title": "",
  "description": "",
  "faqs": [],
  "related": [],
  "name": "Drifting Contour Lines at Dawn",
  "keyword": "css background animation",
  "intro": "Two sheets of topographic contour lines, generated once from SVG noise, drift slowly past each other over a peach and lilac dawn gradient while a warm patch of sunlight moves along the top. The lines are drawn a single time and then only moved. It fits outdoor, travel, mapping and wellness sites with a soft, light palette.",
  "useWhen": [
    "An outdoor or travel brand wants a map-like texture that moves slowly enough to stay calm."
  ],
  "customize": [
    "Change `--ctr-line` for the line colour and `--ctr-strength` for how strong the near sheet looks.",
    "Edit `baseFrequency` on each `feTurbulence` for wider or tighter hills, and `seed` for a different map."
  ],
  "accessibility": [
    "A pale oval behind the centred text keeps the lines faint where the copy sits."
  ],
  "tags": [
    "topographic",
    "contour lines",
    "svg filter",
    "dawn",
    "light theme"
  ],
  "height": 620,
  "reducedMotion": "Both contour sheets and the sunlight stay in their starting places as a still map.",
  "perf": "The SVG filter renders once; afterwards three layers move with transform only, though the first paint costs a few milliseconds."
};

export default meta;
