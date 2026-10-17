const meta = {
  slug: "glazed-ceramic-tile-tabs-in-webgl-leaning-on-a-sunlit-plaster-shelf-where-the-chosen-tile-rocks-upright-into-the-window-light",
  category: "navigation",
  name: "Glazed Ceramic Tile Tabs in WebGL Leaning on a Sunlit Plaster Shelf Where the Chosen Tile Rocks Upright into the Window Light",
  keyword: "webgl tabs react",
  title: "Glazed Ceramic Tile Tabs in WebGL (React Tabs) | We.Inc",
  description: "Free React tabs drawn in WebGL: four thick glazed tiles lean on a sunlit plaster shelf and the one you pick rocks upright into the light.",
  intro: "A tab bar made of four thick stoneware tiles, each dipped in its own glaze, leaning against a limewashed wall on a plaster shelf. Low sun comes through a mullioned window on the left, so the bars of the window fall across the wall and each tile throws a long shadow to the right. The tile you choose is tipped forward off the wall, rocks once on its front edge and settles upright, which turns its face into the window and fills it with reflected light. The tile it replaces is let go and topples back with a knock that its neighbours feel. Everything you see in the frame comes from one fragment shader that traces every pixel: glaze that thins to a pale line over each rounded edge, darkens where it pools in the carved numeral, stops short of the raw clay foot, and tints the plaster next to it. The words are ordinary HTML: real tab buttons sit exactly over the tiles and the panel below changes with them. On phones the shelf takes the top of the frame and the panel flows underneath.",
  useWhen: [
    "A craft studio, bakery, florist or any maker with a small number of sections wants its navigation to feel like something they made by hand.",
    "A landing page has three to five short tabs and room for one strong picture, and the tabs can be that picture.",
    "You want a portfolio piece that shows soft shadows, ambient occlusion and depth of field in a browser without pulling in a 3D library.",
    "A product page needs to switch between a few views and the colour of each view should carry into the button that opens it.",
  ],
  customize: [
    "`tabs` at the top holds every label, heading, paragraph, note and button text. Add or remove entries to change the panel; the shader expects four tiles, so keep the count at four or change the `uTile[4]` arrays and the loops in `mapT` and `plaster` to match.",
    "`glaze` and `pool` on each tab set the tile colour and the darker colour of the glaze gathered in the carving. The call to action in the panel takes the `pool` colour, so pick one with white text that stays readable.",
    "`PLASTER` is the screen colour of the wall used by the still picture and the frame; the shader has its own `PLASTER` in linear light near the top of `SCENE`.",
    "The sun direction is `sa` and `se` in `draw`. A smaller `se` such as 0.45 makes the shadows longer and the light warmer looking; `uWin` slides the window opening across the scene.",
    "`LEAN` is how far the waiting tiles tilt back. Raise it to 0.28 for a deeper lean and a larger rock when a tile stands up.",
  ],
  accessibility: [
    "The buttons are a real `tablist` with `role=\"tab\"`, `aria-selected`, `aria-controls` and roving `tabIndex`, so arrow keys, Home and End move between tiles and only the chosen tab sits in the tab order.",
    "The canvas is hidden from assistive technology. Labels under each tile are text in the buttons, and the panel is a `tabpanel` labelled by its tab.",
    "With reduced motion the tiles change pose at once, the idle demo never starts and the picture is refined for a moment and then left alone.",
    "Panel text is dark brown on pale limewash, well above 4.5 to 1. If you darken `PLASTER`, lighten the text with it.",
  ],
  faqs: [
    {
      question: "How are the tiles drawn without a 3D library?",
      answer: "Each tile is a rounded box described by a distance function. The shader turns that box about whichever bottom edge carries it, then marches every camera ray until it meets a tile, the shelf or the wall. The shelf and wall are flat, so they are hit exactly instead of marched, which keeps the cost down.",
    },
    {
      question: "Why does the colour of the glaze change across one tile?",
      answer: "Real glaze runs thin over an edge and gathers in hollows. The shader estimates thickness from how far the surface normal turns on the rounded corners, from the depth of the carving read out of a small texture, and from a slow streak pattern that grows toward the foot. Thin glaze mixes toward the cream body; thick glaze darkens to the `pool` colour.",
    },
    {
      question: "What makes a tile feel heavy when it stands up?",
      answer: "The chosen tile gets a push and then a stiff, underdamped spring toward upright, so it overshoots onto its front edge and rocks back. The tile it replaces falls under a gravity-like pull that grows as it leans, bounces off the wall with a little energy kept, and passes a small knock to the tiles beside it.",
    },
    {
      question: "How heavy is it to run?",
      answer: "The canvas is capped at about one and a half million pixels and one and a half device pixels per CSS pixel. Once nothing moves, the loop adds a few dozen jittered samples for soft edges and depth of field and then stops drawing. It pauses when scrolled away or when the tab is hidden, and steps resolution down if frames run long.",
    },
    {
      question: "What appears where WebGL is not available?",
      answer: "The same row is built from CSS: rounded tiles in each glaze colour, leaning back with a perspective tilt except the chosen one, standing on a plaster shelf with a soft shadow beneath. The buttons and panel are the same HTML in both cases, so the tabs work either way.",
    },
  ],
  related: [
    "woven-ribbon-tab-bar-with-a-thread-marker-that-unpicks-and-restitches-itself",
    "manila-file-folder-tabs-in-a-steel-desk-rack-that-tip-forward-like-records-in-a-crate-to-show-the-chosen-file",
    "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
    "sunlit-print-table-photo-gallery-in-webgl-where-the-chosen-print-lifts-off-travertine-into-focus-through-window-light-and-leaf-shadows",
  ],
  tags: ["tabs", "webgl", "ray marching", "shader", "ceramic", "glaze", "navigation", "sunlight"],
  height: 760,
  interactive: true,
  section: true,
};

export default meta;
