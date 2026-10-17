const meta = {
  "slug": "architect-house-elevation-sketch-that-draws-itself",
  "category": "motion-graphics",
  "name": "Architect House Elevation Sketch That Draws Itself",
  "keyword": "svg line drawing animation",
  "title": "",
  "description": "",
  "intro": "An elevation sketch for an architecture studio's project page. Faint construction lines go down first, then the ground line, walls, gable roof, chimney, windows, door and the lean-to kitchen, with a loose tree and a dimension line last, about a second and a half in total. On phones the sheet moves under the project notes.",
  "useWhen": [
    "A project or case study page for a design, building or renovation business that wants its first view to feel like a drawing on the desk."
  ],
  "customize": [
    "Change the graphite colour with `--m4hse-pencil` and the paper with `--m4hse-sheet`.",
    "Speed the whole sketch up or down by changing the step in the `.m4hse-t` delay rules, which space the strokes 0.048 seconds apart."
  ],
  "accessibility": [
    "The drawing is decoration beside a real heading and project notes, so the SVG carries `aria-hidden`; the facts it shows are written in the text."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "svg line drawing",
    "architecture sketch",
    "stroke-dashoffset",
    "project page"
  ],
  "height": 520,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The finished elevation, construction lines and dimension included, is shown from the start.",
  "perf": "About thirty thin strokes repaint while they draw over roughly 1.6 seconds, a few at a time, then nothing changes."
} satisfies UiMeta;

export default meta;
