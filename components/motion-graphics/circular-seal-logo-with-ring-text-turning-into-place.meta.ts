const meta = {
  "slug": "circular-seal-logo-with-ring-text-turning-into-place",
  "category": "motion-graphics",
  "name": "Circular Seal With Ring Text Turning Into Place",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "A round dairy seal: two cream rings draw around a forest green disc while the lettering on the ring swings a third of a turn and comes to rest upright. A milk bottle in the centre settles from slightly smaller. Seals like this belong on a product page, a packaging story or a farm shop's about section.",
  "useWhen": [
    "A badge or stamp style logo with words set around a circle, where the turn makes the ring text feel stamped into place."
  ],
  "customize": [
    "Edit the ring words inside `textPath` and keep `textLength=\"465\"` so they always close the circle evenly.",
    "Recolour the disc and lettering with `--m1sea-ink` and `--m1sea-cream`.",
    "Make the turn shorter or longer by changing `rotate(-150deg)` in the `m1sea-turn` keyframes."
  ],
  "accessibility": [
    "One `aria-label` names the dairy, so screen readers skip the repeated ring words and the bottle drawing."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "seal logo animation",
    "circular text logo",
    "badge logo",
    "svg textpath"
  ],
  "height": 500,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The full seal with upright ring text and the bottle shows complete from the start.",
  "perf": "The ring text turns on the compositor and two circles redraw their strokes; all of it ends within 1.4 seconds."
} satisfies UiMeta;

export default meta;
