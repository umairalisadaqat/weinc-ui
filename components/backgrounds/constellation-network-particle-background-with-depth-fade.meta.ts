const meta = {
  "slug": "constellation-network-particle-background-with-depth-fade",
  "category": "backgrounds",
  "name": "Constellation Network with Depth Fade",
  "keyword": "particle background",
  "title": "Constellation Particle Background in Canvas | We.Inc",
  "description": "Free constellation particle background in plain canvas: thin links between nearby points, depth fade and a pause off screen. React and vanilla versions.",
  "intro": "A network of slate points drifts slowly across pale paper, and any two that come close are joined by a hairline. Each point has a depth value, so far points are smaller, fainter and slower and their links are shorter and lighter, which gives the mesh real thickness instead of a flat web. A handful of teal hub points pulse softly. It is a small, dependency-free replacement for the classic particles library look, drawn with canvas 2D in roughly 3 KB of script.",
  "useWhen": [
    "A data, mapping or infrastructure company wants a hero that hints at connected systems without a stock network photo.",
    "You used a particles library for a linked-dots hero and want the same idea without loading a package or a config file.",
    "The page is light and editorial, and a dark neon network would clash with the rest of the brand.",
    "You need a background that still reads as finished when it is frozen, for visitors who switch off animation."
  ],
  "customize": [
    "Change `INK` to set the colour of points and lines, and `ACCENT` for the pulsing hubs; both take an r,g,b string such as `\"30,64,175\"`.",
    "Raise `LINK_DISTANCE` to 180 for a denser web of lines, or drop it to 100 for a sparse field of mostly separate points.",
    "`NODES_PER_MPX` sets how many points appear per million pixels, so a phone gets fewer points than a wide monitor without any extra code.",
    "Lower `SPEED` to 0.4 for an almost still map, or set the hub chance (`Math.random() < 0.07`) to 0 to remove the teal points entirely."
  ],
  "accessibility": [
    "The canvas has `aria-hidden` and `pointer-events: none`, so it is skipped by screen readers and never blocks the button or text above it.",
    "A soft paper-coloured scrim sits behind the copy, which keeps the dark slate heading well above 4.5:1 contrast even when lines pass behind it.",
    "With reduced motion turned on, the script paints one finished frame of the network and never starts its animation loop."
  ],
  "faqs": [
    {
      "question": "Is this a drop-in alternative to a particles library?",
      "answer": "For the common linked-dots hero, yes. It draws points, joins nearby pairs with lines that fade with distance, and wraps points at the edges. It does not read a JSON config or offer click-to-add modes, which keeps it short enough to read and edit in one sitting."
    },
    {
      "question": "How does the depth effect work?",
      "answer": "Every point gets a z value between 0 and 1 when it is created. That value scales its size, opacity and speed, and the average z of two points scales their link distance and line width. Near points therefore look bigger, move faster and join over longer gaps, which reads as parallax."
    },
    {
      "question": "Will checking every pair of points get slow?",
      "answer": "The pair loop rejects most pairs with a cheap box test before any square root, and the point count is tied to the canvas area and capped at 170. That keeps a full-width desktop hero comfortably inside a couple of milliseconds per frame."
    },
    {
      "question": "Does it stop when nobody can see it?",
      "answer": "An IntersectionObserver stops the animation frame loop when the section scrolls out of view, and it also stops while the browser tab is hidden. A ResizeObserver rebuilds the points when the section changes size, so the density stays even."
    },
    {
      "question": "How do I put it on a dark page?",
      "answer": "Set the section background to a dark colour, change `INK` to a light value such as `\"203,213,225\"`, and swap the scrim colour in the background class to match. The line opacity formula needs no change because it already fades with distance and depth."
    }
  ],
  "related": [
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
    "css-gradient-backgrounds-collection-with-mesh-grain-patterns-and-copy-css"
  ],
  "tags": [
    "particles",
    "constellation",
    "canvas",
    "network",
    "light theme"
  ],
  "height": 560,
  "section": true,
  "collection": "particle-background",
  "standalone": true,
  "tech": "canvas",
  "reducedMotion": "A single still frame of the linked network, with every point and line in place.",
  "perf": "Up to 170 points with a box-tested pair loop for links, roughly one to two milliseconds a frame on a laptop, stopped off screen."
};

export default meta;
