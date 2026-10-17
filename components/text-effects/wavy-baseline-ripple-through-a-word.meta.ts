const meta = {
  "slug": "wavy-baseline-ripple-through-a-word",
  "category": "text-effects",
  "name": "Wavy Baseline Ripple Through a Word",
  "keyword": "css text animation",
  "title": "",
  "description": "",
  "intro": "One large word bobs on a slow swell: each letter rises and tips a few degrees in turn, so a crest travels along the baseline from left to right. A thin drawn wave drifts underneath. The rest of the headline stays still, which keeps it readable and lets the moving word carry the mood of a seaside club or swim school.",
  "useWhen": [
    "A light, playful hero for anything near water: swim clubs, boat hire, a beach cafe."
  ],
  "customize": [
    "Change the height of the swell with the `-.15em` and `.06em` values in `@keyframes wv-ripple`, and the tilt with the `rotate` values.",
    "Space the crests out or bunch them up with the `110ms` in the `.wv-l` delay; `--wv-speed` sets how fast each letter bobs.",
    "Recolour the page with `--wv-bg` and `--wv-ink`; the drawn wave follows `--wv-accent`."
  ],
  "accessibility": [
    "The whole headline is read once from a hidden span; the bobbing letters and the drawn wave are hidden from screen readers."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wave text animation",
    "wavy text css",
    "bouncing letters",
    "letter animation"
  ],
  "height": 520,
  "collection": "css-text-animation",
  "tech": "css",
  "reducedMotion": "The word sits level on its baseline and the drawn wave stays still.",
  "perf": "Nine letters and one SVG strip move with transforms only; the loop is cheap and runs on the compositor."
};

export default meta;
