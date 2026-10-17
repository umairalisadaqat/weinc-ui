const meta = {
  slug: "ray-marched-fluted-stoneware-vase-product-card-on-a-paper-plinth-with-a-colourway-glaze-wipe-and-drag-to-turn",
  category: "ecommerce",
  name: "Ray-Marched Fluted Stoneware Vase Product Card on a Paper Plinth with a Colourway Glaze Wipe and Drag to Turn",
  keyword: "react 3d product card webgl",
  title: "WebGL 3D Product Card with Colourway Picker | We.Inc",
  description: "Free React product card with a ray-marched ceramic vase on a paper plinth in daylight. Drag to turn it; each colourway washes up the glaze.",
  intro: "A shop card for a single hand-thrown vase, where the photograph is replaced by a live render. The vase is drawn in raw WebGL by ray marching a signed distance shape: a turned profile cut with twenty four flutes, a rolled lip and an unglazed clay foot. It stands on a cylinder of coloured paper in bright studio daylight, with a window reflected in the glaze, soft shadows from the sun, ambient occlusion where pot meets plinth and a sky fill from above. Drag across it and it turns with a flick that slows down; leave it and it turns on its own. Pick a colourway and the new glaze, plinth paper and backdrop rise from the floor up through the vase in a soft wipe while the page tint follows. The add to bag button counts items and gives the vase a spin. On a phone the stage stacks above the details and keeps the whole vase in frame.",
  useWhen: [
    "A ceramics, homeware or design shop sells a few hero objects and wants the product page to feel handled rather than browsed.",
    "Colour is the main choice a buyer makes, and you want each option shown on the object itself instead of on a flat chip.",
    "You are prototyping a product page before photography exists and need something better than a grey placeholder.",
    "A launch or drop page needs one object that a visitor can turn before reading a word of copy.",
  ],
  customize: [
    "Edit `PRODUCT` for the maker, name, price, description and the three fact chips. Edit `COLOURWAYS` to add or change options: each needs a `glaze`, `plinth`, `backdrop` and `page` hex value, and the shader receives them converted to linear light.",
    "The vase outline is `prof(t)` in the shader, a sum of a waist and a flare over the height `VH`. Change `24.` in `fl` for more or fewer flutes and `0.0085` for how deep they are cut.",
    "The sun direction is `L` at the top of `main`, its colour and strength `SUN`, and the sky fill `SKY`. The window seen in the glaze is drawn in `env`, including its two glazing bars.",
    "`WIPE_SECONDS` sets the colour change, `IDLE_SPIN` and `FRICTION` the turning, and `DEMO_FIRST` with `DEMO_EVERY` the self-playing tour of colourways, which stops as soon as anyone touches it.",
    "`PIXEL_BUDGET`, `MAX_SCALE` and `MIN_SCALE` control render resolution. The loop drops the scale by itself when the frame rate falls below forty.",
  ],
  accessibility: [
    "The stage is focusable and named with the product and current colourway; the left and right arrow keys turn the vase in fifteen degree steps.",
    "Colourways are a radio group with roving focus, so arrow keys move between them and the selected one carries `aria-checked`. The add to bag button is a real button, and a polite live region reports how many are in the bag.",
    "With reduced motion the vase holds still, the self-playing tour is off and a new colourway is drawn as one finished frame with no wipe. Without WebGL an SVG still of the vase in the chosen colours is shown.",
  ],
  faqs: [
    { question: "Why ray marching instead of a 3D model file?", answer: "The vase is a few lines of maths, so there is nothing to download and nothing to convert. A surface of revolution with a cosine ripple gives the fluting, and the same function answers shadow and occlusion queries, so the contact between pot and plinth looks right without baking." },
    { question: "How does the glaze look thicker in the grooves?", answer: "The shader knows the flute value at every point. On a ridge the glaze colour is lifted, in a groove it is darkened, and just above the clay foot it is darkened further, which is how a real runny glaze breaks over relief and pools at the bottom." },
    { question: "How is the colour wipe done?", answer: "Each surface blends between the old and new colours with a soft step on height that rises from below the floor to above the lip, wobbling slightly round the vase. The floor uses a growing circle instead, and the far backdrop fades over the second half. A thin brighter band rides on the edge as it climbs." },
    { question: "Will it run on an ordinary laptop or phone?", answer: "The march stays inside a box around the plinth, floor shadows are only traced near the object, and the canvas is limited to about a million pixels. If frames drop below forty a second the render scale steps down. It stops drawing when scrolled away or when the tab is hidden." },
    { question: "Can I use a photograph instead?", answer: "Yes. Replace the canvas with an image and keep the card on the right; the colourway buttons, bag count and live region work the same. You would lose the turning and the wipe, which are the reason this version exists." },
  ],
  related: [
    "shoebox-with-a-hinged-lid-that-lifts-and-tissue-paper-that-parts-over-a-pair-of-leather-shoes",
    "paper-shopping-bag-that-catches-boxed-products-bulges-leans-and-flexes-its-rope-handles",
    "banding-wheel-loader-that-throws-a-wet-terracotta-vase-up-to-a-brass-height-gauge",
  ],
  tags: ["product card", "webgl", "ray marching", "3d", "colour picker", "add to cart", "ceramics"],
  height: 826,
  section: true,
  interactive: true,
};

export default meta;
