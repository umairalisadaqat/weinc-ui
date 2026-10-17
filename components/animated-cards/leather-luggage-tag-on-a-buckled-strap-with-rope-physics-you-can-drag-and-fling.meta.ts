const meta = {
  slug: "leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling",
  category: "animated-cards",
  name: "Leather Luggage Tag on a Buckled Strap with Rope Physics You Can Drag and Fling",
  keyword: "react draggable hanging card physics",
  title: "React Draggable Hanging Card with Rope Physics | We.Inc",
  description: "Hanging card shaped as a leather luggage tag on a buckled strap: it swings from a peg, follows your drag and flies when flung. Free React and HTML code.",
  intro: "A tan leather luggage tag hanging from a brass peg on a plaster wall. The strap is a loop that wraps the peg, carries a small brass buckle down one side and threads through a slot in the tag, where a riveted keeper band holds it. The tag has saddle stitching round the edge, a pebbled grain, a window with a typed address card under clear vinyl and initials pressed into the leather below. Grab the tag and the strap bends after it; let go and it swings back and settles under its own weight, turning slightly out from the wall as it goes while its shadow slides across the plaster. Left alone it gives itself a small push every few seconds. On a phone the whole scene scales down as one picture, so the proportions hold at 360 pixels.",
  useWhen: [
    "A travel brand, luggage maker or boutique hotel wants one object on the page that visitors cannot help picking up.",
    "You need a contact or about card that carries a name and an address and feels like a thing rather than a panel.",
    "A quiet landing page needs a single moving piece and a full hero would be too much.",
    "You are showing a personalised product, such as a monogram service, and want the initials to be the content.",
  ],
  customize: [
    "The words live in the `tag` object at the top: `name`, `street`, `town`, `route` and `monogram`. Keep the name under about sixteen characters or drop its `text-[15px]` a step.",
    "Leather colour is the three stop `linear-gradient(168deg, #b9763a ...)` on the tag face, with `#3b2110` for the cut edge and the four `strapLayers` strokes for the strap. Swap all of them together for black or oxblood.",
    "How it swings is set by `GRAVITY` and `DAMPING`. A higher `GRAVITY` gives a quicker, heavier swing, and moving `DAMPING` toward `0.995` makes it come to rest sooner.",
    "Strap length is `LINKS` times `LINK`. If you lengthen it, raise `H` by the same amount so the tag still has room below it.",
    "The wall is `bg-[#d6cdbd]` plus the `radial-gradient` on the root, and `SHADOW` decides which way the shadow falls and how far.",
  ],
  accessibility: [
    "Dragging is extra, not required: the round button in the corner is a real `button` with a label, and pressing it pushes the tag once to alternate sides.",
    "Everything on the address card is live text, so a screen reader reads the name, the return address and the flight in order, and the strap, buckle and shadows are hidden from it.",
    "With reduced motion switched on the tag hangs straight and still, no loop runs and the idle push is off. Only the tag itself blocks touch scrolling, so the page still scrolls from the wall around it.",
  ],
  faqs: [
    { question: "What kind of physics is behind the strap?", answer: "A small Verlet simulation. The strap is eight points joined by seven fixed length links, with the top point pinned to the peg, and the tag is one more heavy point on a longer link. Each step moves every point by its last movement plus gravity, then pulls the links back to length fourteen times. A weak extra constraint between every other point stops the leather folding sharply." },
    { question: "Why does a fling feel right without any velocity code?", answer: "Verlet stores speed as the difference between where a point is and where it was. While you drag, the tag is pulled toward your pointer each step, so by the time you let go its last movement already holds the speed and direction of your hand. Nothing has to be measured on release." },
    { question: "How is the strap drawn as a loop from a single chain?", answer: "The chain is the centre line. For each point the code steps out sideways by a half width that shrinks from the peg radius at the top to a few pixels at the slot, giving a left and a right run. One SVG path goes up the left run, round an arc over the peg and down the right, and four strokes of that path make the edge, the leather, a lighter middle and the stitching." },
    { question: "Can I hang something other than a luggage tag from it?", answer: "Yes. The simulation only knows about a slot point and a weight point. Replace the markup inside the tag element with your own card, keep `TAG_W`, `TAG_H` and `SLOT` in step with it, and set `BODY` to the distance from the slot to roughly the middle of the card." },
    { question: "Does it keep running when it is off screen?", answer: "No. An IntersectionObserver stops the animation frame loop when the component leaves the viewport and a visibility listener stops it when the tab is hidden. Both start it again where it left off." },
  ],
  related: ["matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches", "mirror-ball-on-a-chain-that-throws-drifting-flecks-of-coloured-light-across-a-portrait-print", "open-passport-card-whose-visa-pages-collect-inked-entry-stamps-and-turn-over-when-the-spread-is-full"],
  tags: ["physics", "drag", "verlet", "leather", "hanging", "card"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
