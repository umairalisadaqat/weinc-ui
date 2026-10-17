const meta = {
  "slug": "slow-tide-on-wet-sand-with-receding-sheen-background",
  "category": "backgrounds",
  "name": "Slow Tide on Wet Sand",
  "keyword": "animated wave background",
  "title": "",
  "description": "",
  "intro": "A thin sheet of sea slides up a warm beach, hesitates, then drains away, leaving a darker band of wet sand with a pale sheen that fades as it dries. Fine grain over everything keeps the sand from looking flat. It suits beach rentals, surf shops and slow-living brands that want a calm hero rather than crashing surf.",
  "useWhen": [
    "A holiday let or coastal guest house wants a hero that feels like a quiet morning on the shore.",
    "You want water motion that is slow enough to sit behind reading text without pulling focus."
  ],
  "customize": [
    "Set `SECONDS` for the length of one run up and back; 16 or more feels like a lazy tide.",
    "Change `SAND_TOP` and `SAND_BOTTOM` for the beach colour, then adjust the `swtd-wetg` stops so the wet band stays a shade darker.",
    "Edit `EDGE` to reshape the waterline; smaller amplitudes give a straighter, more distant wash."
  ],
  "accessibility": [
    "The shoreline, water and grain sit in one `aria-hidden` layer with no pointer events, and the text stays on dry sand where contrast is strongest."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wave",
    "tide",
    "beach",
    "sand",
    "css animation"
  ],
  "height": 760,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "css",
  "reducedMotion": "The water rests partway up the beach beside a settled wet band, with no movement at all.",
  "perf": "Three composited animations (a slide, a vertical swash and an opacity fade) plus one static grain layer."
};

export default meta;
