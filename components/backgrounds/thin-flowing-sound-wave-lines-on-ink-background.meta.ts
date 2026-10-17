const meta = {
  "slug": "thin-flowing-sound-wave-lines-on-ink-background",
  "category": "backgrounds",
  "name": "Thin Flowing Sound Wave Lines",
  "keyword": "css wave animation",
  "title": "",
  "description": "",
  "intro": "Nine hairline waves in sea glass, pale grey and one warm amber thread run across a deep ink background, swelling and pinching together the way a voice recording does. Each group slides at its own pace and slowly breathes taller and flatter. It fits audio studios, music teachers and voice products that want motion with restraint.",
  "useWhen": [
    "A podcast studio, music school or voice app needs a hero that hints at sound without an equaliser cliche.",
    "You want a dark, quiet background whose lines are thin enough to sit under centred text."
  ],
  "customize": [
    "Each row of `LINES` is one hairline: change its colour, stroke width or amplitude there.",
    "`GROUPS` holds `seconds` for the sideways pass and `breathe` for the swell; shorter breaths read as faster speech.",
    "Swap `INK` for a deep green or plum, then lighten the line colours until they still separate from it."
  ],
  "accessibility": [
    "The lines live in an `aria-hidden` band below the copy, so the centred text keeps full contrast against plain ink."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wave",
    "sound wave",
    "lines",
    "dark",
    "audio"
  ],
  "height": 731,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "css",
  "reducedMotion": "The nine lines hold one woven shape beneath the text, completely still.",
  "perf": "Six composited transforms (three slides, three vertical scales) over static SVG strokes."
};

export default meta;
