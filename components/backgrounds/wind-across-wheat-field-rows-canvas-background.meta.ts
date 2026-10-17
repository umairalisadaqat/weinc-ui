const meta = {
  "slug": "wind-across-wheat-field-rows-canvas-background",
  "category": "backgrounds",
  "name": "Wind Across a Wheat Field",
  "keyword": "animated wave background",
  "title": "",
  "description": "",
  "intro": "A field of wheat drawn as thousands of short strokes, thin and hazy at the horizon and thick and dark at your feet. Gusts roll across it as travelling waves: stalks lean over, their paler sides catch the light, then they spring back. Between gusts every stalk keeps a small sway of its own. It suits bakeries, farms, mills and harvest-season campaigns.",
  "useWhen": [
    "A bakery, farm shop or flour mill wants a warm, rural hero with motion that feels earned.",
    "You want a wave effect that reads as wind on land rather than water."
  ],
  "customize": [
    "`FAR`, `NEAR` and `LIGHT` are rgb lists for distant stalks, close stalks and the bright side a gust reveals.",
    "`GUST_SECONDS` is how long a gust takes to cross; 12 gives a lazy summer breeze.",
    "`ROWS` sets field density and `HORIZON` how high the field reaches; keep the headline above the horizon."
  ],
  "accessibility": [
    "The field canvas is `aria-hidden` and the copy sits on the pale sky, so contrast does not depend on where the gust is."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "wheat",
    "wind",
    "canvas",
    "field",
    "wave"
  ],
  "height": 724,
  "section": true,
  "collection": "css-wave-animation",
  "tech": "canvas",
  "reducedMotion": "A still field with one gust caught mid-crossing is painted once.",
  "perf": "A few thousand short curves batched into three paths per row; about 1 to 2 ms a frame, paused off screen."
};

export default meta;
