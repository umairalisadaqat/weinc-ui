const meta = {
  "slug": "drifting-wave-section-divider-top-and-bottom",
  "category": "backgrounds",
  "name": "Drifting Wave Section Divider",
  "keyword": "wave background css",
  "title": "",
  "description": "",
  "intro": "A deep slate band sits between two warm paper sections, and both of its edges are soft waves that keep drifting: a pale sea-glass layer behind, the solid band colour in front, moving in opposite directions. It replaces the hard line between page sections with something calmer, and the Divider part works on any block.",
  "useWhen": [
    "A long page needs a clear break between sections that feels less abrupt than a straight edge.",
    "A craft, outdoor or hospitality site wants a call to action band that stands out without a loud colour."
  ],
  "customize": [
    "Set `BAND` and `PAPER` for the two section colours; the front wave always uses `BAND` so the edge stays joined.",
    "`BACK_TINT` colours the paler wave peeking out behind; set it to the band colour at lower opacity for a subtler edge.",
    "Change `SECONDS.back` and `SECONDS.front` for drift speed, or delete the `wvdv-slide` class for a still divider."
  ],
  "accessibility": [
    "Both edges are `aria-hidden` and ignore the pointer, and text never sits on the wave itself, only on the solid band or paper."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wave divider",
    "section divider",
    "css",
    "svg"
  ],
  "height": 860,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "css",
  "reducedMotion": "Both wavy edges keep their shape and simply stop drifting.",
  "perf": "Four SVG layers sliding with transform; the cheapest piece in the set."
};

export default meta;
