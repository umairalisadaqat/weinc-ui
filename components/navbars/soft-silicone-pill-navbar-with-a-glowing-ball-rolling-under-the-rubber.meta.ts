const meta = {
  slug: "soft-silicone-pill-navbar-with-a-glowing-ball-rolling-under-the-rubber",
  category: "navbars",
  name: "Soft Silicone Pill Navbar with a Glowing Ball Rolling Under the Rubber",
  keyword: "floating pill navbar react",
  title: "React Floating Pill Navbar in Soft Silicone | We.Inc",
  description: "Floating pill navbar shaded like silicone: a glowing ball under the rubber marks the current page and stretches as it rolls. Free React and HTML to copy.",
  intro: "A floating pill menu that looks moulded from pale silicone. The current page is not marked with a flat highlight. There is a bump in the rubber, as if a small lit ball sat underneath, and pink light bleeds through the skin above it. Choose another link and the bump rolls across: its front edge leaves first and the back follows on a slower spring, so it stretches into a long low ridge and then gathers itself again. Move a pointer over the pill and the rubber dimples under it. Press and the dimple deepens while the whole pad squashes a little. The surface is a height map lit from the upper left on a small canvas, redrawn only while something is moving. Five links share the width equally, and the pill shrinks with the screen down to 328 pixels.",
  useWhen: [
    "A portfolio or studio site with a handful of top-level pages wants the menu itself to be the memorable detail.",
    "A product for children, wellness or homeware calls for a soft, friendly object where sharp tabs would feel cold.",
    "A single-page site uses a floating menu to jump between sections and the marker should travel visibly from one to the next.",
    "A design system demo needs one hero control that shows material shading done in code.",
  ],
  customize: [
    "`links` is the menu. Keep it to short single words. Six is the limit at phone width with the `text-[13px]` label size.",
    "`RUBBER` and `GLOW` are red, green and blue triples. Try `[38, 40, 46]` with `[90, 255, 170]` for black rubber and a green light, and change the label colours to match.",
    "Bump height is `H * 0.215` in `paint` and its radius is `H * 0.4`, both tied to the pill height. A lower, wider bump reads as a thicker sheet.",
    "The stretch comes from the two spring pairs `330, 24` and `120, 17`. Bring the second pair closer to the first for a tighter, less liquid move.",
    "Pill height is `h-[68px] sm:h-[78px]` and width `max-w-[452px] sm:max-w-[540px]`. The rolled edge is 62 percent of half the height and follows whatever height you set.",
  ],
  accessibility: [
    "It is a `nav` landmark with a list of real links. The current one carries `aria-current=\"page\"`, so the bump is never the only signal.",
    "Tab moves through the links in order and Enter follows one. Focus draws a dark ring on the label that the canvas cannot cover.",
    "Label text is dark on both the pale rubber and the pink light. Recheck contrast after changing `GLOW` to a darker colour.",
    "With reduced motion the bump appears under the new link at once, the label does not scale and the self-running tour is off.",
  ],
  faqs: [
    {
      question: "How is the rubber shaded?",
      answer: "Each canvas pixel gets a height: the rolled edge of the pad, plus the bump, minus any dent from the pointer. A second pass compares each height with its neighbours to find which way the surface tilts, then brightens the pixels that face the light. A little random grain stops it looking like plastic.",
    },
    {
      question: "Does it redraw all the time?",
      answer: "No. The animation loop checks whether the springs, the dent or the press are still changing and skips the paint when they have settled. Sitting idle between moves costs almost nothing.",
    },
    {
      question: "How do I wire it to a router?",
      answer: "Replace `href=\"#\"` with real paths and remove the `preventDefault` call. Set `active` from the current route. The bump follows whichever index is active, so it will also roll on back and forward navigation.",
    },
    {
      question: "Can it stick to the top of the page while scrolling?",
      answer: "Yes. Wrap the outer `div` in your own sticky or fixed container and drop the stage background. The pill measures itself with a resize observer, so it adapts to the width it is given.",
    },
    {
      question: "Why does the light spill wider than the bump?",
      answer: "Silicone lets some light through and scatters it. The pink is mixed in by how high the bump is at each pixel, with an extra bright core at the very top, which is what makes it read as a lamp under a skin instead of a painted spot.",
    },
  ],
  related: ["navbar-with-liquid-stretch-highlight-and-inverting-labels", "navbar-with-centered-links-and-mobile-menu", "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link"],
  tags: ["navbar", "pill", "rubber", "silicone", "canvas", "floating", "liquid"],
  height: 420,
  interactive: true,
};

export default meta;
