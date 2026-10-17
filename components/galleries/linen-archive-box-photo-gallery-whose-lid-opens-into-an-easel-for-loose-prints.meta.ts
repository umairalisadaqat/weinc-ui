const meta = {
  slug: "linen-archive-box-photo-gallery-whose-lid-opens-into-an-easel-for-loose-prints",
  category: "galleries",
  name: "Linen Archive Box Photo Gallery Whose Lid Opens into an Easel for Loose Prints",
  keyword: "react 3d photo gallery box",
  title: "React 3D Photo Gallery in an Archive Box | We.Inc",
  description: "Photo gallery built as a cloth covered archive box: the hinged lid swings up and loose prints leave the tray to lean against it. Free React and HTML code.",
  intro: "A cloth covered print box of the kind a photographer keeps finished work in, sitting on a dark table. It starts shut, showing a small plate set into a recess on the lid and a stamped title. The lid then swings up on its far edge, settles just past upright and becomes an easel. Each step takes the top print from the pile in the tray, slides its foot to the back of the box and tips it up to rest against the lid, slightly askew, on top of the ones before it. Stepping back lays the front print down again. After the fifth print the whole set drops back into the tray in a quick cascade. The box has board thickness on every wall, a lighter paper lining and a brass label holder on the front. It is narrow and tall, so it fits a phone screen almost at full size.",
  useWhen: [
    "A photographer or illustrator wants a short portfolio of portrait format work shown as physical prints, one sitting at a time.",
    "A print shop or framer is selling boxed sets and wants the page to show what arrives in the post.",
    "An archive, museum or family history site presents a small collection where handling the object is part of the story.",
    "You need a portrait oriented gallery for a narrow column or a phone first layout where a wide carousel would be wasted.",
  ],
  customize: [
    "The pictures are the `prints` array, in the order they leave the box. `title` is typed on the white margin and in the corner readout, `focus` sets the crop and `tone` is the placeholder colour.",
    "`cover` holds the lid plate, the stamped `title` and the `box` number. The last two characters of `box` are reused on the brass label.",
    "`W` and `D` are the footprint of the box, `WH` the wall height and `T` the board thickness. `PW` and `PL` are the print size and must fit inside `W` and `D` less two boards.",
    "`LID_OPEN` is how far the lid swings in degrees and `LEAN` is the angle of a resting print. Keep `LEAN` near `LID_OPEN` minus 180 so paper and lid stay parallel.",
    "Cloth colour is `CLOTH` and its texture is the `weave` gradient string. `LINING` is the paper inside. For a black box set `CLOTH` to `#26272a` and lighten the stamped text.",
  ],
  accessibility: [
    "The scene is a carousel group. Right or up arrow stands the next print, left or down arrow puts it back, and the two round buttons do the same with labels that change to describe the next action.",
    "The lid itself is a button with `aria-expanded`, so the box can be opened and closed from the keyboard without touching the arrows.",
    "Only the front standing print exposes its alt text. Prints still in the tray or covered by another have empty alt text, and the corner readout announces each title through a polite live region.",
    "With reduced motion the box is drawn open with the first print already standing, the timer is off and each step places a print with no travel.",
  ],
  faqs: [
    {
      question: "How does a print get from lying flat to leaning on the lid?",
      answer: "Each print follows one spring value that runs from 0 in the tray to 1 on the lid. The angle is that value times minus 80 degrees about the bottom edge, and the position of that edge is worked out from the angle so the top of the sheet climbs the lid while the foot skids back along the pile. The two can never disagree, so paper never passes through board. When the spring overshoots, the value is reflected, which makes the print rock forward off the lid and settle.",
    },
    {
      question: "Why do the standing prints not line up perfectly?",
      answer: "Each one gets a small fixed twist from the `jitter` list and a sideways shift from `nudge`. Loose paper never stacks square, and the slivers of earlier prints showing at the corners tell you how many are up there. Set both lists to zeros for a tidy pile.",
    },
    {
      question: "Is the linen texture an image?",
      answer: "No. It is two repeating one pixel line gradients at right angles over a flat colour, one slightly dark and one slightly light, which reads as a woven cloth at this size. The same `weave` string is reused on every outside surface and on the tops of the boards.",
    },
    {
      question: "How are the walls given thickness?",
      answer: "Each wall is two upright planes nine pixels apart, cloth outside and lining inside, with a flat strip across the top joining them. Two small helpers, `WallY` and `WallX`, stand a plane up on a line across or along the box, so adding a divider is one more call. The right outer wall is left out because this camera never sees it.",
    },
    {
      question: "Can it hold landscape pictures?",
      answer: "Yes, if you reshape the box. Swap the values of `W` and `D` and of `PW` and `PL`, then widen `SCENE_W` to suit. The hinge stays on the far edge, so a landscape box opens like a laptop and the prints lean the same way.",
    },
  ],
  related: ["photo-proof-roll-carousel-that-feeds-over-a-roller-and-curls-onto-the-table", "vinyl-record-sleeve-gallery-where-the-disc-slides-out-and-spins-beside-its-cover", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["gallery", "3d", "box", "prints", "portfolio", "hinge", "photography"],
  height: 778,
  section: true,
  interactive: true,
};

export default meta;
