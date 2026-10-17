const meta = {
  slug: "glazed-stoneware-app-dock-in-webgl-on-a-milled-aluminium-tray-where-icons-magnify-lift-and-bounce-in-daylight",
  category: "docks",
  name: "Glazed Stoneware App Dock in WebGL on a Milled Aluminium Tray Where Icons Magnify Lift and Bounce in Daylight",
  keyword: "react magnifying dock",
  title: "Glazed Stoneware App Dock in WebGL (React Dock) | We.Inc",
  description: "Free React dock drawn in WebGL: six glazed stoneware icons in a milled aluminium tray that swell, lift and hop under the pointer in daylight.",
  intro: "A magnifying app dock built as a small still life. Six thick tiles of glazed stoneware, each with a raised enamel glyph, stand in a pocket milled out of a bar of aluminium that rests on a limestone desk by a window. Move the pointer along the row and the tiles nearest to it swell and rise out of the tray, pushing their neighbours aside, while their shadows on the metal and the stone change with their height. Click one and it hops twice, the way a launching app does, and a small frosted lamp in the front lip of the tray slides along to sit beneath it. Every pixel of the picture comes from one fragment shader that traces the scene: glossy glaze that thins to a pale line over each rounded edge, brushed and fly-cut metal that mirrors the tiles, soft window shadows and depth of field. The buttons are ordinary HTML laid exactly over the tiles, and the name of the open app is set large above the dock. On phones the camera steps back so all six tiles fit across the screen.",
  useWhen: [
    "A portfolio or studio site wants its main links to feel like objects on a desk rather than a row of text.",
    "You are presenting a desktop-style product and need a dock that people will want to move the pointer across just to watch it.",
    "A launch page has five to seven destinations with short names and a simple glyph for each.",
    "You want a working example of pointer-driven magnification, spring motion and a ray-marched scene that share one camera with real buttons.",
  ],
  customize: [
    "Edit the `apps` array at the top: `label` is the button text and heading, `line` the sentence under the heading, `glaze` the tile colour, `ink` the glyph colour, and `path` the glyph as a 24 by 24 stroked SVG path. The shader reads its colours from the same array.",
    "`MAG` sets how much a tile grows under the pointer (0.62 means 62 percent larger) and `REACH` how many neighbours share the swell. Lower `REACH` to about 1.0 for a tighter, sharper bulge.",
    "The hop on opening comes from `s.bv[i] = 3.4` in `open` and the gravity of 22 in `step`; raise the first number for a higher jump or set `s.hops[i]` to 1 for a single hop.",
    "The lamp colour is `led` in `shadeTray`. A cooler `vec3(0.7, 0.9, 1.0)` gives a blue-white indicator; `uTray.z` controls how bright it flares when an app opens.",
    "`PAPER` is the desk colour used for the frame and the still picture, and `STONE` near the top of `SCENE` is the same desk in linear light.",
  ],
  accessibility: [
    "Each tile is a real `button` with an `aria-label` such as \"Open Notes\", grouped in a `nav` labelled Dock. The open app carries `aria-current`, and the heading above the dock changes in a polite live region.",
    "Tab reaches every tile, and Left, Right, Home and End move between them. Focusing a tile magnifies it and shows its name just as a hover does, so nothing depends on a mouse.",
    "With reduced motion the tiles do not swell or hop and the idle demo never runs; the picture is refined for a moment and then left still. Without WebGL a drawn still of the same dock takes its place under the same buttons.",
  ],
  faqs: [
    {
      question: "How does the magnification decide how big each tile gets?",
      answer: "The pointer position is projected onto the upright plane through the tiles, giving a position along the dock in scene units. Each tile's target size falls off from that point on a bell curve set by `MAG` and `REACH`, a damped spring chases the target, and the row is laid out again from the new widths every frame so neighbours slide apart instead of overlapping.",
    },
    {
      question: "Why are the buttons not inside the canvas?",
      answer: "The canvas is only a picture. The buttons are HTML elements positioned each frame from the same camera the shader uses, so they cover the tiles as they grow and hop. That keeps keyboard focus, screen reader names and click handling working exactly as they do for any other button.",
    },
    {
      question: "Will this run smoothly on an ordinary laptop?",
      answer: "The render resolution is capped, each tile is skipped by a cheap bounding box until a ray comes close, and the loop stops when the dock is off screen, the tab is hidden, or nothing has moved and the picture has finished refining. If frames run long for a while it lowers its own resolution step by step.",
    },
    {
      question: "Can I use my own icons instead of the glyphs?",
      answer: "Yes. Each glyph is a stroked SVG path in a 24 by 24 box, drawn once into a height texture so the enamel stands proud of the glaze. Paste any simple line icon path into `path` and it appears on the tile, in the still picture and with the same lighting.",
    },
    {
      question: "How many tiles can the dock hold?",
      answer: "The count comes from the length of `apps`, and the shader is generated from it, so five or seven work without other changes. Past about eight the tiles get small on a phone, so consider a shorter list there.",
    },
  ],
  related: [
    "paper-folding-fan-menu-that-unfolds-from-a-brass-rivet-with-links-on-the-pleats",
    "glazed-ceramic-tile-tabs-in-webgl-leaning-on-a-sunlit-plaster-shelf-where-the-chosen-tile-rocks-upright-into-the-window-light",
    "glazed-celadon-ceramic-button-with-carved-lettering-that-rocks-under-the-finger",
  ],
  tags: ["dock", "webgl", "ray marching", "magnify", "ceramic", "aluminium", "navigation"],
  height: 700,
  interactive: true,
};

export default meta;
