const meta = {
  "slug": "intro-card-where-logo-lifts-and-name-rises",
  "category": "motion-graphics",
  "name": "Intro Card Where the Logo Lifts and the Name Rises",
  "keyword": "logo animation",
  "title": "",
  "description": "",
  "intro": "A pottery studio's intro card opens with its clay-red mark resting low, then lifting off the card while the soft shadow beneath it widens less and fades a little, as if the badge rose a few millimetres. Then each word of the name climbs out of its own mask, followed by a line of copy and the opening days.",
  "useWhen": [
    "An intro or welcome card where a round badge logo should feel like a physical object picked up off the page."
  ],
  "customize": [
    "Set the lift distance with `--m1lft-lift` and the badge colour with `--m1lft-clay`.",
    "Put your own words in the two `.m1lft-ln` spans; each one rises separately, so add a span per line or word."
  ],
  "accessibility": [
    "The mark carries a label naming the studio, and the name is a real heading whose masks only clip it while it rises."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "logo intro animation",
    "name reveal",
    "card intro",
    "logo lift"
  ],
  "height": 540,
  "collection": "logo-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The badge sits at its resting height with its shadow, and the full name and copy show at once.",
  "perf": "The badge, its pre-drawn shadow and two words move with transform and opacity for about 1.5 seconds only."
} satisfies UiMeta;

export default meta;
