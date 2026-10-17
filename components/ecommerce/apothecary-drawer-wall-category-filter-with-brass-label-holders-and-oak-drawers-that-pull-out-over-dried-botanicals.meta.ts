const meta = {
  slug: "apothecary-drawer-wall-category-filter-with-brass-label-holders-and-oak-drawers-that-pull-out-over-dried-botanicals",
  category: "ecommerce",
  name: "Apothecary Drawer Wall Category Filter with Brass Label Holders and Oak Drawers That Pull Out over Dried Botanicals",
  keyword: "react category filter checkboxes",
  title: "React Category Filter as Apothecary Drawers | We.Inc",
  description: "Category filter drawn as a walnut cabinet of oak drawers: tick one and it springs out to show the herbs inside. Free React code and HTML to copy.",
  intro: "Fifteen small oak drawers sit in a walnut cabinet, each with a brass card holder, a typed label and a turned brass knob. Every drawer is a checkbox. Tick one and the front comes towards you on a spring, grows a touch as it gets nearer, and throws a shadow over the row beneath, while the open top shows what the label promised: lavender buds, rosehips, chips of ginger root. The far end of the drawer stays dark where the cabinet still covers it. Resting a pointer on a shut drawer eases it out a few millimetres. A line under the cabinet counts the open drawers and names them, and one button shuts the lot. Below 700 pixels the wall re-stacks from five columns of three to three columns of five, so each front stays wide enough to press with a thumb.",
  useWhen: [
    "A tea merchant, herbalist or refill shop filters its catalogue by ingredient and wants the filter to look like the shop counter.",
    "A category page has between nine and twenty categories, too many for a row of chips and too few to justify a search box.",
    "A stationery, hardware or bead shop sells small loose things that really are kept in drawers.",
    "A landing page needs one tactile object near the top that also does a job when the visitor touches it.",
  ],
  customize: [
    "`drawers` is the list. Each entry has the spoken `name`, the `label` typed on the card, a `kind` (`heads`, `buds`, `petals`, `leaf`, `seeds`, `root` or `berries`) and three `colors` for the contents.",
    "`START` lists the indexes that are open on load. Set it to `[]` for a fully closed cabinet.",
    "`PULL` is how far an open drawer travels in design pixels. 24 gives a shallow tray, 48 shows more of the contents but overlaps more of the row below.",
    "`OAK` and `WALNUT` are the two timber colours. Swap them for `#d8d2c4` and `#2f3b36` to get painted fronts in a dark green carcass.",
    "The columns, front size and rail width for each breakpoint are the two objects at the top of `layoutFor`. Six columns of `dw: 124` fits eighteen drawers on a desktop.",
  ],
  accessibility: [
    "Each drawer is a native `input type=\"checkbox\"` inside a `label` that covers the front, so Space toggles it and a screen reader announces the botanical name with its checked state.",
    "The checkboxes share a group named \"Filter by botanical\", and the focus ring is drawn round the whole drawer front in the brass accent.",
    "The sentence under the cabinet is a polite live region. It always states the selection in words, so nothing depends on seeing which fronts stand proud.",
    "Under reduced motion drawers jump between shut and open with no spring, and the demonstration that opens drawers by itself is skipped.",
  ],
  faqs: [
    {
      question: "How is the open drawer drawn without any 3D library?",
      answer: "The cabinet is viewed from slightly above, so anything that comes towards you also moves down the screen. An open front is drawn lower and 4.5 percent larger than a shut one. The gap that opens between the cabinet and the front is filled with a strip of a pre-painted picture of the contents, pinned to the front so it travels with the drawer.",
    },
    {
      question: "Why are the rows painted from the bottom up?",
      answer: "A drawer pulled out of the top row hangs over the rail and the top of the drawer beneath it. Painting the lowest row first and the highest last gives that overlap for free, including the shadow, with no sorting step.",
    },
    {
      question: "How do I connect the drawers to my product list?",
      answer: "`picked` is an array of booleans in the same order as `drawers`. Filter your products with it where it is, or move the state up to a parent and replace the local `set` function with a callback prop.",
    },
    {
      question: "Can the labels be longer than one word?",
      answer: "The type shrinks to fit the card, down to about seven pixels on a phone. Twelve characters is the practical limit. Keep the full wording in `name`, which is what assistive technology and the caption use, and put a short form in `label`.",
    },
    {
      question: "Does the wood grain cost anything while the page is idle?",
      answer: "No. The carcass, every front and every tray of contents are painted once into off-screen canvases. A frame only copies those pictures and adds a few shadows, and the loop stops as soon as all fifteen springs are at rest.",
    },
  ],
  related: ["spice-jar-rack-filter-with-glass-jars-that-turn-behind-a-brass-rail-to-show-their-labels", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["filter", "checkbox", "category", "drawer", "wood", "brass", "canvas", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
