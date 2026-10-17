const meta = {
  slug: "page-section-blocks-in-resin-ceramic-and-anodised-metal-that-lift-out-of-a-stack-to-reorder-a-live-page",
  category: "originals",
  name: "Page Section Blocks in Resin, Ceramic and Anodised Metal That Lift out of a Stack to Reorder a Live Page",
  keyword: "reorder page sections animation react",
  title: "React Animation to Reorder Page Sections in 3D | We.Inc",
  description: "Hero, features, pricing and footer as solid 3D blocks in a stack: lift one out, the rest settle and the page beside it reorders. Free React and HTML code.",
  intro: "Four solid blocks sit in a slightly untidy pile on a black plinth: a blue cast-resin hero, a glazed white features block, a brushed metal pricing block and a black lacquer footer. Each has a section of a made-up florist's page set into its front like an enamel plate, and its name lettered on the lid. Press a block and it is drawn forward clear of the pile, the blocks above it drop into the space with a small bounce, and it slides home in its new place. A flat page beside the pile holds the same four sections and moves them in step, with a blue bar marking the one in the air. The pile leans a few degrees towards the pointer. Below about 700 pixels the page moves underneath the pile and the whole drawing scales to the screen.",
  useWhen: [
    "You are explaining that a page is made of sections and that their order is a decision the visitor can change in one move.",
    "A landing page for a site builder or a theme needs a hero where the product idea is an object people want to prod.",
    "A docs page about section ordering wants a demonstration that is more memorable than a drag list.",
    "You need a worked example of several CSS 3D boxes changing place without passing through each other.",
  ],
  customize: [
    "`blocks` sets the pile: `finish` picks the material, `h` the height, and `dx` and `turn` how far each one sits off square. Set both to 0 for a tidy tower.",
    "`FINISH` holds the front, top and side classes for each material. Change the `resin` entries to recolour the blue block, keeping the side darker than the top.",
    "`OUT` is how far a block travels forward before it changes place. It must stay larger than `BD`, the block depth, or the moving block will cut through its neighbours.",
    "`Section` draws the page content by block `id`, and is used both for the inlaid plate and for the page, so editing it once updates both.",
    "The camera angle is `RX` and `RY`. A larger `RY` shows more of the shaded side, a more negative `RX` shows more of the lids.",
  ],
  accessibility: [
    "Each block front is a `button` whose label gives its name and its place in the pile, so the order can be read without seeing it.",
    "Up and Down arrow keys move the focused block one place, and Enter or Space sends it to the top (or the bottom, if it is already on top).",
    "A polite live line describes each lift and where the block was seated. The page drawing is hidden from screen readers because it repeats the same order.",
    "With reduced motion the block and its page section change place at once, with no lift, drop or lean.",
  ],
  faqs: [
    {
      question: "How do the blocks avoid passing through each other when they swap?",
      answer: "The move happens in three beats. The chosen block first travels forward by more than its own depth, so it is completely clear of the pile. Only then does the order change, which drops the others and raises or lowers the moving block in open air. Finally it slides back in.",
    },
    {
      question: "What makes the blocks look like they land with weight?",
      answer: "The vertical move of a settling block uses an underdamped spring (`stiffness: 420, damping: 15`), so it overshoots a few pixels and comes back. Blocks nearer the bottom start a few hundredths of a second earlier, which reads as a pile closing up from below.",
    },
    {
      question: "Can I use drag instead of press?",
      answer: "The piece is built around press and arrow keys because a 3D drag needs the pointer mapped back through the camera. If you want drag, the simplest route is to map vertical pointer travel on a block to a target place and call `move(id, place)` on release.",
    },
    {
      question: "Why is the page beside the pile flat when the pile is in 3D?",
      answer: "The page is the thing being edited and has to stay readable, so it faces the viewer. Its sections are absolutely positioned and animated on `y` from the same `order` array, which avoids layout animation inside a scaled parent.",
    },
    {
      question: "How do I add a fifth section?",
      answer: "Add an entry to `blocks` with a new `id` and a branch in `Section` that draws it. The pile height, the plinth position and the page height are all computed from the list.",
    },
  ],
  related: [
    "website-rack-with-feature-units-that-slide-home-on-rails-and-light-up-as-sections-of-the-page",
    "click-to-edit-page-with-inlaid-pieces-you-lift-out-of-lit-sockets-and-turn-over-in-the-air",
    "phone-game-built-from-stacked-glass-layers-that-press-together-into-a-playable-screen",
  ],
  tags: ["originals", "sections", "reorder", "css 3d", "blocks", "page builder", "stack"],
  height: 700,
  interactive: true,
};

export default meta;
