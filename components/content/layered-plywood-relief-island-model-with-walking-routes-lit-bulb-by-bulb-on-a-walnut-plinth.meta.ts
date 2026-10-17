const meta = {
  slug: "layered-plywood-relief-island-model-with-walking-routes-lit-bulb-by-bulb-on-a-walnut-plinth",
  category: "content",
  name: "Layered Plywood Relief Island Model with Walking Routes Lit Bulb by Bulb on a Walnut Plinth",
  keyword: "canvas 3d terrain map route animation",
  title: "React Canvas 3D Terrain Map with Lit Routes | We.Inc",
  description: "Relief model of an island cut from stacked plywood, drawn on a canvas, with walking routes that light up bulb by bulb. Free React code and HTML to copy.",
  intro: "A table-top model of an invented island, the kind a visitor centre keeps under a lamp. Nine sheets of pale plywood are stacked into hills, each cut edge showing its three browned plies and throwing a shadow on the sheet below. The sea is a sheet of dark green acrylic with depth rings, a streak of reflected light and the island's name cut into it. All of it stands on a walnut plinth with a brass inlay line and an engraved plate. Three walks are scored into the wood and set with tiny glass bulbs. One walk lights from the quay outward, bulb after bulb, then a brighter pulse keeps running along it. Buttons under the model switch walks, and the old one cools down slowly. On a phone the model shrinks to the screen width and the buttons wrap below it.",
  useWhen: [
    "A hiking, cycling or tour company wants to show a few named routes without sending visitors off to a mapping site.",
    "A resort, estate or campus needs an overview of its grounds that feels built by hand.",
    "A museum, park or heritage site wants its web page to echo the physical model standing in its entrance hall.",
    "A game or fiction project has an invented island and wants readers to see journeys across it.",
  ],
  customize: [
    "The `routes` list holds each walk: `path` is a set of `[u, v]` points from -1 to 1 across the board, `name` and `detail` feed the button and the caption, and `flag` colours the pennant at the far end.",
    "The shape of the land comes from `elev`. Each `Math.exp` line adds a hill or scoops out a bay at the coordinates inside it, and the last number on that line sets how wide it is.",
    "`NL` is the number of plywood sheets at the highest point and `STEP` is the thickness of one sheet. `PLINTH` sets how tall the walnut base stands.",
    "`ROT`, `CY` and `SZ` are the camera: how far the board is turned, how much the ground is flattened and how tall height appears. Keep `CY` and `SZ` near 0.6 and 0.8 so the bulbs still sit on the surface.",
    "`GAP` spaces the bulbs along a walk, and the `17` in `reach` is how many bulbs light per second.",
  ],
  accessibility: [
    "The model is one canvas with `role=\"img\"` and a label that says what it shows. The walks are chosen with real buttons carrying `aria-pressed`, so the keyboard does everything the pointer can.",
    "An `aria-live` caption states the name, end points and length of the chosen walk in words. Keep that text accurate if you edit the routes, because a screen reader gets nothing from the lights.",
    "Reduced motion turns off the bulb by bulb sequence, the travelling pulse, the automatic tour and the pointer tilt. The chosen walk is shown fully lit and changes at once when another is picked.",
  ],
  faqs: [
    {
      question: "Is this WebGL or a 3D library?",
      answer: "Neither. It is a small software renderer on a 2D canvas. Every column of the board is drawn from back to front, pushed up the screen by its height, and where a column is taller than the one in front its cut face is painted in. That is enough to give stacked sheets real overlap without a single triangle.",
    },
    {
      question: "How expensive is it to run?",
      answer: "The model is rendered once, a fraction of a second after the page paints, and kept as a picture. Only the bulbs are redrawn each frame, from three small sprites prepared in advance, so the running cost is a few dozen `drawImage` calls. The loop stops when the model scrolls out of view or the tab is hidden.",
    },
    {
      question: "How do the shadows between sheets work?",
      answer: "For each point on a sheet the renderer looks a short way toward the lamp, in eight steps. Every step that finds wood standing higher than the light could clear counts against the point, and the total sets how dark it is drawn. Near a cut edge all the steps are blocked, further out only the last ones, which gives the shadow its soft far side.",
    },
    {
      question: "Why do the bulbs fade out slowly but come on fast?",
      answer: "Each bulb has its own brightness that chases a target. Going up it closes the gap with a time constant of 0.07 seconds, going down with 0.3 seconds, which is roughly how a small filament behaves. Change those two numbers in the `draw` function for a snappier or lazier look.",
    },
    {
      question: "Can I use real terrain?",
      answer: "Yes, if you have height data you are allowed to publish. Replace the body of `elev` with a lookup into your own grid, returning zero or less for water. Then redraw your `path` points over it, since bulbs take their height from the land under them.",
    },
  ],
  related: ["folded-paper-street-map-that-unfolds-panel-by-panel-with-creases-and-a-pin-that-drops-in", "photo-booth-team-strips-that-feed-out-of-chrome-slots-in-four-clunks-then-hang-and-swing-on-the-panel", "porcelain-dotted-desk-globe-you-spin-with-inertia-with-flag-pins-that-trail-as-it-turns"],
  tags: ["map", "terrain", "canvas", "relief", "route", "model", "island"],
  height: 772,
  section: true,
  interactive: true,
};

export default meta;
