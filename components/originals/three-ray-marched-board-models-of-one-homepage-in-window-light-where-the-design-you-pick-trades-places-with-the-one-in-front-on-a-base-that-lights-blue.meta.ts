const meta = {
  slug: "three-ray-marched-board-models-of-one-homepage-in-window-light-where-the-design-you-pick-trades-places-with-the-one-in-front-on-a-base-that-lights-blue",
  category: "originals",
  name: "Three Ray Marched Board Models of One Homepage in Window Light Where the Design You Pick Trades Places with the One in Front on a Base That Lights Blue",
  keyword: "webgl design picker react three options",
  title: "3D Design Picker: Three Homepage Models in Window Light | We.Inc",
  description: "Free React and WebGL design picker. Three board models of one homepage stand in window light, and the one you choose comes forward on a base that lights blue.",
  intro: "A choice between three designs, shot as a product photograph that is still running. Three boards stand on a white studio sweep, each in a block of opal acrylic, each a model of the same florist's homepage made a different way. Linen is cream card with a serif headline in a left column and a tall portrait beside it. Poppy is one photograph over the whole board with a white menu pill, a paper sticker and a single very large line. Midnight is black with the photograph in an arch and a light centred line. Photographs, menus and buttons stand proud of the boards, so the window light from the upper left drops a real shadow beside each one, the bars of the window fall across the wall behind, and the polished floor carries a soft mirror image. One board stands forward in the middle with its base lit blue from inside. Pick another and its base lights, the board in front swings out across the front of the stage and backs into the empty place, and the picked one slips along behind it, takes a small step away and comes forward, leaning against its own momentum and rocking once as it stops. Focus moves with the swap. The name of the design is set large at the lower left and three pill buttons at the lower right do the choosing. On a phone the camera moves in on the front board, the other two wait at the edges, and the name moves to the top.",
  useWhen: [
    "The step in a site builder, a theme shop or a brand tool where a visitor is shown several finished directions and keeps one.",
    "A marketing section that has to prove the options are different designs and not one layout in three colours.",
    "A portfolio opener for a studio that presents work as routes, with each route given its own name and a line of reasoning.",
    "A template or plan chooser that deserves a stage instead of three flat cards in a grid.",
  ],
  customize: [
    "`SHOP` holds the business name, the town and the sentence quoted at the top right. `DESIGNS` holds each design's name, its one line, the colour of its board and its photograph.",
    "The pages are painted by `drawLinen`, `drawPoppy` and `drawMidnight` on 1200 by 1600 canvases. Edit the words, sizes and positions there as you would in any 2D canvas drawing.",
    "`LINEN`, `POPPY` and `MIDNIGHT` list the parts that stand proud of each board: position and size in page pixels, the four corner radii, `lift` for height and `gloss` for shine. The relief in the shader is generated from the same numbers.",
    "In the `SCENE` shader, `L` is the direction of the window light, `SUNC` and `SUNI` its colour and strength, `FLOORC` the colour of the sweep, `OPAL` the unlit base and `BLUEE` the lamp inside it.",
    "`gap`, `run`, `front`, `fov`, `tgt`, `az`, `el` and `dist` at the top of `draw` place the back row, the front spot and the camera, with a second set for phones. `START` picks the design in front on load, `HOLD` the pause between picks in the demo and `TRAVEL` the length of one swap.",
  ],
  accessibility: [
    "The three pill buttons are a `radiogroup` with one tab stop: left and right arrows move the choice and the focus together, and each has a visible focus ring.",
    "The canvas and the pointer targets laid over the models are hidden from assistive technology, the three photographs are real images with alt text, and a polite live region reads out the name, position and one-line description of the design that has just come forward.",
    "With reduced motion nothing slides or drifts: one frame is rendered for each choice, the boards are already in their new places and the name cross fades.",
    "Without WebGL 2, or if the context is lost, the same three printed pages are shown as flat cards with the chosen one raised on a blue base, and both the cards and the pills still change the choice.",
  ],
  faqs: [
    {
      question: "Are the three pages images or live markup?",
      answer: "Neither. Each page is painted on a 2D canvas when the component mounts, with type set by `fillText` and the photograph clipped into its frame, then uploaded as a texture with mipmaps. The same canvases are what you see as flat cards when the renderer cannot start.",
    },
    {
      question: "How do the photographs and buttons cast shadows on their own page?",
      answer: "They are geometry. The list of raised parts for each design is turned into a few rounded box distance functions when the module loads, extruded a few hundredths of a unit above the board. The shadow ray that tests the window light marches against them like anything else, so a photograph drops a soft edge of shade down its right side.",
    },
    {
      question: "Why do the boards not pass through each other when they swap?",
      answer: "Each one follows a short plan with two parts that overlap. The board coming in moves sideways first, along the back, and only then forward. The board going out moves sideways first too, but across the front, and only then back. At the moment they cross, one is a full step nearer the camera than the other, which is also why its shadow sweeps over the one behind.",
    },
    {
      question: "What makes a board look heavy when it moves?",
      answer: "A spring follows the plan instead of the board following it exactly, so it starts late. The acceleration of that spring is fed into a second, looser spring that tips the board back as it sets off and forward as it brakes, then lets it rock out, and sideways acceleration turns it a little the same way. When it reaches the front the lamp in its base flares and the camera takes a small knock.",
    },
    {
      question: "Can I show two or four designs?",
      answer: "The shader is written for three: the uniform arrays, the texture slots and the loops in `map` and `stageShade` all count to three, and there are two places at the back. Two works by parking the third board off stage with a large x in `draw`. Four needs those counts raised, a fourth texture and a third place at the back.",
    },
    {
      question: "How do I read the choice in my own code?",
      answer: "`pick` is ordinary React state holding the index of the design in front. It is set inside `choose` in the effect a moment after the base lights, which is the place to call your own handler if a form or the next step needs to know.",
    },
  ],
  related: ["ray-marched-aluminium-publish-key-on-a-blue-lit-plinth-that-strikes-a-lightbox-model-of-the-page-from-draft-to-live", "three-glass-cake-domes-on-ceramic-stands-each-keeping-a-different-site-design-where-the-dome-lifts-off-the-one-you-choose", "turntable-of-three-acrylic-design-stands-under-one-pendant-lamp-that-you-spin-to-bring-a-site-design-into-the-light"],
  tags: ["webgl", "ray marching", "shader", "3d", "design picker", "radio group", "homepage", "originals"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
