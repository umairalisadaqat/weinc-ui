const meta = {
  slug: "navbar-with-liquid-stretch-highlight-and-inverting-labels",
  category: "navbars",
  name: "Navbar with Liquid Stretch Highlight and Inverting Labels",
  keyword: "tailwind navbar sliding highlight",
  title: "Tailwind Navbar with a Sliding Liquid Highlight | We.Inc",
  description: "Navbar where a lime blob stretches between links like liquid and the label text inverts exactly where the blob covers it. Free React and HTML code to copy.",
  intro: "A site header for a furniture studio with a dark pill of five links. A lime highlight sits behind the current link. Point at another link, or tab to it, and the highlight reaches out with its leading edge first, thins in the middle while it is stretched, then snaps its tail in and wobbles to rest. The label under the blob turns from light to dark exactly along the blob's edge, even halfway through a letter. Until someone touches it the blob tours the links on its own. On phones the link bar sits under the logo and fills the width.",
  useWhen: [
    "A marketing site with four to six top-level links where the header is the first thing people see.",
    "You want a hover highlight with more character than a pill that slides at a constant speed.",
    "The highlight colour is light and the bar is dark (or the reverse), so the label has to change colour as the highlight passes.",
    "You need the same highlight to follow keyboard focus, not only the mouse.",
  ],
  customize: [
    "It needs `framer-motion`. The stretch comes from two springs: `LEAD` (stiffness 520) moves the front edge and `TRAIL` (stiffness 150, damping 15) moves the back edge. Bring the two closer together for less stretch, or raise the `TRAIL` damping to 26 to remove the wobble.",
    "Links are the `links` array at the top. The bar measures each link, so labels of any length work.",
    "Colours: the bar is `bg-stone-900`, the blob is `bg-lime-300` and the text on the blob is `text-stone-950`. Change those three classes together and keep the contrast between the last two high.",
    "`PAD` is the gap in pixels between the blob and the bar edge. The squash while stretched is the `extra * 0.07` line, capped at `7` pixels: set the cap to `0` for a blob that keeps its height.",
    "The idle tour moves every `DEMO_MS` (1150 milliseconds). Start `demo` as `useState(false)` to switch it off.",
  ],
  accessibility: [
    "The links are real anchors inside a `nav` with a label, and the current one carries `aria-current=\"page\"`.",
    "The blob layer that holds the dark copy of the labels is `aria-hidden`, so a screen reader hears each link once.",
    "Focus moves the blob as hover does and also draws a white ring round the label. With reduced motion the blob jumps without stretching and the idle tour does not run.",
  ],
  faqs: [
    { question: "How does the highlight stretch like liquid?", answer: "The blob has no width of its own. Its left and right edges are two separate motion values, each animated by its own spring. When the target is to the right, the right edge gets the stiff spring and the left edge the loose one, so the front arrives early and the back catches up late. The gap between them while they travel is the stretch." },
    { question: "How does the text change colour only where the blob is?", answer: "There are two copies of the labels. The bottom copy is light text on the dark bar. The top copy is dark text on a full-width lime layer, and that whole layer is cut to the blob's shape with `clip-path: inset(...)`. Moving the clip moves the blob and the colour change together, so they can never drift apart." },
    { question: "Does animating clip-path hurt performance?", answer: "No layout is recalculated: `clip-path` only repaints one small layer. The values are written straight to the element by Framer Motion without re-rendering React." },
    { question: "Why does the blob get thinner in the middle of a move?", answer: "The top and bottom inset of the clip grow with how much wider the blob is than its resting width. That keeps the visual volume roughly constant, which is what makes it read as liquid instead of a resizing rectangle." },
    { question: "How do I make the highlight stay on the page I am on?", answer: "Set `active` from your router instead of the click handler. Hover and focus only move the blob temporarily; it returns to `active` when the pointer leaves the bar." },
  ],
  related: ["soft-silicone-pill-navbar-with-a-glowing-ball-rolling-under-the-rubber", "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link", "navbar-with-centered-links-and-mobile-menu"],
  tags: ["navbar", "liquid", "sliding highlight", "clip-path", "spring", "framer motion", "hover"],
  height: 548,
  section: true,
  interactive: true,
};

export default meta;
