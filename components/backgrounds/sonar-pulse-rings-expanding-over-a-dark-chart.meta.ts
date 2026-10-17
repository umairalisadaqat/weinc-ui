const meta = {
  "slug": "sonar-pulse-rings-expanding-over-a-dark-chart",
  "category": "backgrounds",
  "collection": "animated-background-css",
  "tech": "css",
  "title": "",
  "description": "",
  "faqs": [],
  "related": [],
  "name": "Sonar Pulse Rings",
  "keyword": "css background animation",
  "intro": "Pulses spread from a single point across a dark green chart of range circles and fine grid lines, and three contacts flare softly as the rings pass them. The chart is static gradients and each pulse is one scaling circle. It suits survey, maritime, security or monitoring services that want quiet, measured motion.",
  "useWhen": [
    "A technical or field-services company wants motion that suggests scanning or detection."
  ],
  "customize": [
    "Move the source with `--snr-x` and `--snr-y`; range circles, crosshair and pulses follow it.",
    "Change `--snr-ink` for the ring colour and `--snr-period` for the pulse speed."
  ],
  "accessibility": [
    "A left-side gradient veil keeps the headline and copy over the darkest part of the chart."
  ],
  "tags": [
    "sonar",
    "radar",
    "rings",
    "pulse",
    "dark green"
  ],
  "height": 640,
  "reducedMotion": "Two rings hold still part way out and the three contacts stay softly lit.",
  "perf": "Three scaling rings and three blinking dots, all transform and opacity; the chart is painted once."
};

export default meta;
