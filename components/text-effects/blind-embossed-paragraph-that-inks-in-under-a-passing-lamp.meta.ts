const meta = {
  slug: "blind-embossed-paragraph-that-inks-in-under-a-passing-lamp",
  category: "text-effects",
  name: "Blind Embossed Paragraph That Inks In Under a Passing Lamp",
  keyword: "tailwind text reveal",
  title: "Tailwind Text Reveal: Embossed Words Take Ink | We.Inc",
  description: "Text reveal where a paragraph pressed blind into paper takes ink word by word as a lamp passes or your pointer moves. Free React and HTML code to copy.",
  intro: "A sheet of cotton paper lies on a dark desk with one paragraph pressed into it and no ink, so each word is only a dent you can read by its shadow. A lamp crosses the sheet and the words it reaches fill with ink and stay filled. Every word carries two text shadows, a dark one on the wall nearest the lamp and a pale one on the far wall, and both swing round as the lamp moves, which is what makes the letters look sunk into the paper instead of drawn on it. Move a pointer or a finger over the sheet and the lamp follows it. On a phone the lamp travels down the page instead of across, because the paragraph is taller than it is wide there.",
  useWhen: [
    "A manifesto, a founder's note or a single quotation deserves a screen to itself and a slow entrance.",
    "You are building a site for a printer, a stationer, a bindery or a paper mill and want the page to behave like the product.",
    "An about page needs one paragraph that people actually read, and a plain fade would be skipped.",
    "You want a reveal that keeps working after it has played, since visitors can keep moving the light around the inked page.",
  ],
  customize: [
    "The sentence is the `TEXT` constant and the small line under the rule is `COLOPHON`. Words are split on spaces, so punctuation stays attached to its word.",
    "Paper and ink are two RGB triples, `PAPER` and `INK`. If you change the sheet's `bg-[#e9e2d3]`, set `PAPER` to the same colour or the blind letters will show as flat tints.",
    "`PASS_SECONDS` is how long the lamp takes to cross and `HOLD_SECONDS` how long the finished page rests. Raise the first to 6 for a slower read.",
    "The size of the pool of light is `R` inside the effect, `Math.min(W, H) * 0.62` with a floor of 170 pixels. A smaller number makes a torch, a larger one a window.",
    "Depth of the impression comes from `reach` and the two alpha values `dark` and `glint`. Halve them for a light kiss, as printers call it, or raise `reach` for a deep bite.",
  ],
  accessibility: [
    "The paragraph is one real `p` element containing the full sentence as text, so screen readers and search engines get it whole whatever the lamp is doing.",
    "Un-inked words are close to the paper colour on purpose, which means low contrast until the lamp has passed. The pass finishes in under four seconds, and with reduced motion switched on every word starts fully inked at about 13 to 1.",
    "The lamp can be sent across again from the keyboard with the Pass the lamp again button, which has a visible focus ring.",
    "The sheet sets `touch-action: pan-y`, so dragging a finger over it moves the light sideways while a vertical swipe still scrolls the page.",
  ],
  faqs: [
    { question: "What is blind embossing?", answer: "It is pressing a shape into paper without any ink or foil, so the only thing that shows it is the way light falls across the dent. Printers call the sunk version debossing. This component imitates it with a pair of text shadows on letters that are the same colour as the sheet." },
    { question: "How do you make text look pressed into a surface with CSS?", answer: "Give the letters the colour of the surface, then add a dark `text-shadow` offset toward the light source and a pale one offset away from it. The dark shadow reads as the near wall of the dent and the pale one as the lit far wall. Swap the two and the same text looks raised." },
    { question: "Why does each word get its own shadow instead of the whole paragraph?", answer: "A lamp close to the page lights each word from a different direction. Words to its left throw their shadow one way and words to its right the other. Splitting the paragraph into word spans lets the script work out that direction per word, and it is that fan of angles that sells the lamp as being near." },
    { question: "Is animating text-shadow slow?", answer: "It repaints the text, so it costs more than a transform. Here it touches about forty short spans inside one sheet, the loop stops when the sheet scrolls out of view or the tab is hidden, and the light itself is moved with a transform. For a full article, light only the opening paragraph." },
    { question: "Can the words stay inked instead of starting again?", answer: "Yes. The cycle resets when `clock` passes `total`. Remove that reset and the fading branch, and the page will ink once and then only respond to the pointer." },
  ],
  related: ["cinema-marquee-headline-with-letter-tiles-that-slide-along-rails-and-chasing-bulbs", "finger-written-words-in-window-condensation-that-drip-fog-over-and-wipe-clear", "hand-gilded-shop-fascia-headline-where-gold-leaf-is-laid-brushed-off-and-burnished"],
  tags: ["text reveal", "emboss", "letterpress", "pointer light", "paragraph"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
