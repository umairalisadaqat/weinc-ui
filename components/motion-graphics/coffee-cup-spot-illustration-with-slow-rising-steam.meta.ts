const meta = {
  "slug": "coffee-cup-spot-illustration-with-slow-rising-steam",
  "category": "motion-graphics",
  "name": "Coffee Cup Spot Illustration with Rising Steam",
  "keyword": "svg line animation",
  "title": "",
  "description": "",
  "intro": "An opening hours card for a café with a cup and saucer drawn in brown ink. The saucer, cup, rim, coffee and handle draw in once, then three strands of steam rise in a slow loop, each one drawing up from the cup and erasing from its base before the next takes over. On phones the cup sits above the hours.",
  "useWhen": [
    "A café, bakery or tea room card for opening hours, a menu intro or a booking confirmation that needs a small warm illustration."
  ],
  "customize": [
    "Slow or speed the steam with `--m4cof-steam-time`; the three strands stay a third of a cycle apart.",
    "Change the ink with `--m4cof-pen` and the coffee and steam colour with `--m4cof-coffee`."
  ],
  "accessibility": [
    "The cup is decorative and hidden with `aria-hidden`; opening hours are a real description list.",
    "The steam loop pauses when the card is scrolled away and is still for reduced motion."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "coffee illustration",
    "steam animation",
    "svg line animation",
    "cafe card"
  ],
  "height": 520,
  "collection": "svg-line-drawing-animation",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The cup is drawn and the three steam strands stand still at soft opacity.",
  "perf": "After the one-time drawing, three short steam strokes repaint in a slow loop that pauses off screen."
} satisfies UiMeta;

export default meta;
