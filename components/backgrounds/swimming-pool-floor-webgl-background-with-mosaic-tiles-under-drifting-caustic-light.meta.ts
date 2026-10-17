const meta = {
  slug: "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light",
  category: "backgrounds",
  name: "Swimming Pool Floor WebGL Background with Mosaic Tiles Under Drifting Caustic Light",
  keyword: "water caustics shader background",
  title: "React Water Caustics Shader Background | We.Inc",
  description: "Pool background in WebGL: a shader draws a mosaic tile floor under clear water with caustic light drifting over it. Copy the React code or the HTML free.",
  intro: "The floor of a swimming pool on a bright day, looked at straight down. Small glazed tiles in a handful of blues, pale grout between them and a navy lane line that ends in a crossbar. Over that lies a net of sunlight that the surface has focused into thin bright threads, each with a faint red and blue fringe, drifting and re-knitting without ever repeating. The tiles themselves wobble a little, because you are seeing them through moving water, and now and then a spark of sun flashes on the surface. Moving the pointer drops rings that spread out and bend the light as they go; with no pointer a ring lands by itself every few seconds. The block carries a single small caption and nothing else. On a narrow screen the tile count is kept across the width, so tiles stay the same size under a thumb.",
  useWhen: [
    "A travel, hotel, swimwear or summer drinks page wants the feeling of water without a stock video.",
    "You need a bright, cool background that still has detail when a visitor looks closely.",
    "A spa or leisure centre landing page should open on something calm that moves by itself.",
    "You want a pointer effect that behaves like a real surface: touch it and rings travel outward.",
  ],
  customize: [
    "`pool.tiles` is how many tiles fit across the short side. `9` gives large slabs, `28` fine mosaic.",
    "The glaze comes from `pool.tileLight` and `pool.tileDark`; every tile is a random blend of the two. Set both to `[0.92, 0.94, 0.93]` and `pool.grout` to a mid grey for a white tiled pool.",
    "`pool.depth` moves the floor away from the surface. Around `0.25` the light is broad and soft, around `0.6` it tightens into sharp wires.",
    "`pool.chop` sets wave height and `pool.bend` how far the tiles appear to shift. Lower both for a pool nobody has touched all morning.",
    "The lane line is drawn where `abs(cell.x - 4.0)` is at most one tile. Change the `4.0` to move it, or set `pool.lane` equal to `pool.tileDark` to hide it.",
  ],
  accessibility: [
    "Both the canvas and the CSS floor under it are marked `aria-hidden`, and the layer ignores pointer events, so whatever you place above it keeps working.",
    "The caption has its own navy pill because the floor swings between pale grout and bright light. Give any text you add a solid backing too.",
    "Reduced motion gets a single painted frame: no drifting light, no rings from the pointer.",
    "The pattern flickers gently by nature. If it sits behind long reading text, lower `pool.speed` to `0.5`.",
  ],
  faqs: [
    { question: "How is the caustic pattern calculated?", answer: "Light going through a wavy surface is bent by the slope of the water. Where the surface is curved like a lens, neighbouring rays land closer together on the floor and that spot gets brighter. The shader measures how fast the slope changes around each pixel and turns that into how tightly the light is packed. Thin lines appear exactly where the packing becomes extreme, which is what a real pool does." },
    { question: "Why do the bright lines have coloured edges?", answer: "Water bends blue light slightly more than red. The brightness is worked out three times with three slightly different depths, one per colour channel, so the threads split a little at their edges." },
    { question: "How do the pointer rings work?", answer: "The component keeps the four most recent touches: where and when. Each one adds a short packet of ripples to the surface that travels outward and fades over about three seconds. Because the rings change the same slope the light uses, the caustics and the tiles both react to them." },
    { question: "Can I put a photo on the floor in place of tiles?", answer: "Yes, with a little work. Load the image into a texture and read it at `f0`, the floor position after the water has bent it, where the shader currently builds `floorCol`. The light, the tint and the glints are applied afterwards and stay as they are." },
    { question: "What is the fallback?", answer: "A CSS floor with a tile grid, the lane line and four soft patches of light that sway on a keyframe. It is in place before any script runs and stays if the browser cannot give a WebGL context." },
  ],
  related: ["wet-asphalt-at-night-webgl-background-with-puddles-that-mirror-coloured-shop-signs-and-rain-rings", "arched-stained-glass-window-webgl-background-that-pours-coloured-light-across-a-stone-floor-as-the-sun-moves", "brass-armillary-sphere-background-with-nested-rings-that-turn-about-a-tilted-axis-and-catch-the-lamp"],
  tags: ["webgl", "shader", "caustics", "water", "pool", "tiles", "background", "ripple"],
  height: 760,
  section: true,
};

export default meta;
