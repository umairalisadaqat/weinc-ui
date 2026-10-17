const meta = {
  slug: "neo-brutalist-hero-with-sticker-headline-and-shifting-hard-shadows",
  category: "hero-sections",
  name: "Neo-Brutalist Hero with Sticker Headline and Shifting Hard Shadows",
  keyword: "neo brutalist hero section tailwind",
  title: "Tailwind Neo-Brutalist Hero Section | We.Inc",
  description: "Neo-brutalist hero with sticker words that slap on, wobbling badges and hard shadows that follow the pointer. Free React and Tailwind code, or HTML.",
  intro: "A neo-brutalist hero section on flat yellow where every headline word is its own die-cut sticker that slaps onto the page with a spring. A sticker sheet card, a wobbling seal badge and a pill badge sit beside it. All the hard black shadows are driven by one pair of CSS variables, so they swing slowly when idle and fall away from the pointer when you move over the section. On phones the headline wraps, the card drops underneath and nothing scrolls sideways.",
  useWhen: [
    "You want a neobrutalism landing page that feels playful rather than cold.",
    "The headline is short, five words or so, and can carry the whole first screen.",
    "You sell something physical or creative: print, merch, a studio, an event.",
    "You need a hover effect that still looks alive on touch screens, where there is no hover.",
  ],
  customize: [
    "Edit the `words` array to change the headline. Each word has a `fill` colour and a `tilt` in degrees; keep tilts between -6 and 6 so the line still reads.",
    "Shadow travel is set by `SWING` (idle, in pixels) and `REACH` (pointer, in pixels) inside the effect. The idle speed is the `900` in `t / 900`: raise it to slow the swing.",
    "The page colour is `bg-[#ffe14d]` on the section. If you change it, change `focus-visible:ring-offset-[#ffe14d]` on the two buttons too.",
    "Badge wobble speed is the `2.4s` in the `-wobble` class and its angle is in the keyframes (`-7deg` to `8deg`).",
    "The entrance needs `framer-motion`. Make the slap harder by raising `stiffness: 420` or lowering `damping: 17` on the word spans.",
  ],
  accessibility: [
    "The `h1` carries the full sentence in `aria-label` and the sticker spans are hidden from screen readers, so the headline is read once as plain text.",
    "With reduced motion on, nothing animates: stickers and badges are drawn in place and shadows stay at a fixed 8 pixel offset.",
    "Both actions are real links with a thick black focus ring. Text is black on every fill, well above 4.5:1.",
  ],
  faqs: [
    { question: "How do the shadows follow the pointer?", answer: "The section holds two CSS variables, `--sx` and `--sy`. Every shadow is written as `box-shadow: calc(var(--sx) * 1px) calc(var(--sy) * 1px) 0 0 #111`, so changing those two numbers moves all of them at once. A single `requestAnimationFrame` loop eases the numbers toward a target: a slow swing when idle, or a point opposite the pointer while it is over the hero." },
    { question: "What makes a design neo-brutalist?", answer: "Thick solid outlines, flat saturated colour, hard offset shadows with no blur, heavy type and slightly off-grid placement. This hero uses a 3 pixel black border and a zero-blur shadow on every block, plus small rotations on the stickers." },
    { question: "Will the animation loop hurt performance?", answer: "The loop only writes two custom properties per frame, stops when the hero scrolls out of view or the tab is hidden, and is removed on unmount. The wobble and nod animations are plain CSS transforms." },
    { question: "Can I use it without framer-motion?", answer: "Yes. Replace each `motion.span` and `motion.div` with the plain element and delete the `initial`, `animate` and `transition` props. You lose the slap-on entrance but keep the shifting shadows and the wobble, which do not depend on it." },
    { question: "How do I change the stickers on the sheet?", answer: "The `sheet` array lists six tiles with an `id` and a `fill`. The `Art` function returns a small inline SVG for each id, so swap a drawing by editing its paths or add a new branch for a new id." },
  ],
  related: ["olive-oil-bottle-hero-turning-on-a-seamless-backdrop-with-the-headline-orbiting-round-the-glass", "portrait-studio-hero-with-a-giant-headline-that-passes-behind-the-sitter-and-in-front-of-her", "app-landing-hero-with-phone-mockup"],
  tags: ["neo-brutalist", "neobrutalism", "hero", "sticker", "hard shadow", "framer-motion", "animated"],
  height: 912,
  section: true,
  interactive: true,
};

export default meta;
