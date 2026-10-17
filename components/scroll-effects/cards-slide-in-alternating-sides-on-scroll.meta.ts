const meta = {
  "slug": "cards-slide-in-alternating-sides-on-scroll",
  "category": "scroll-effects",
  "name": "Cards Slide In From Alternating Sides",
  "keyword": "slide in on scroll",
  "title": "",
  "description": "",
  "intro": "Five trip cards for a mountain guiding company, set in a zigzag on a deep navy page, each sliding in from its own side with a slight tilt that straightens as it lands. The direction is one variable per card, so odd cards come from the left and even ones from the right. On phones the cards go full width and travel a shorter distance.",
  "useWhen": [
    "A short list of offers, trips or case studies where a zigzag rhythm helps each one feel separate."
  ],
  "customize": [
    "Change `--w1alt-push` and `--w1alt-tilt` for a longer or flatter entrance.",
    "Set the card `width: 60%` in the wide-screen media query to 100% for a single column.",
    "Use `entry 0% cover 30%` in `animation-range` to decide where each card finishes landing."
  ],
  "accessibility": [
    "The cards are an ordered list with an `h3` each, and the motion never hides text once a card is in view."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "slide in on scroll",
    "zigzag cards",
    "animation-timeline view",
    "scroll reveal"
  ],
  "height": 620,
  "section": true,
  "collection": "scroll-animation",
  "tech": "css",
  "support": "Chrome, Edge and Safari 26+; script fallback elsewhere",
  "reducedMotion": "Cards are shown straight and in place in their zigzag layout, with no sliding.",
  "perf": "Transform and opacity on five cards from the scroll timeline; the fallback observer fires once per card."
};

export default meta;
