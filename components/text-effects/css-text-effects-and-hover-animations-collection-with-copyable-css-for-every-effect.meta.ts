const meta = {
  slug: "css-text-effects-and-hover-animations-collection-with-copyable-css-for-every-effect",
  category: "text-effects",
  name: "112 CSS Text Effects and Hover Animations",
  keyword: "css text effects",
  title: "112 CSS Text Effects and Hover Animations to Copy | We.Inc",
  description: "112 pure CSS text effects and hover animations: gradient text, outlines, 3D shadows, typewriters, underline, image and card hovers. Copy each one.",
  intro: "A searchable set of 112 CSS text effects and hover animations in 11 families: gradient and outlined lettering, shadow and 3D type, typewriter and reveal animations, underline and link hovers, image and card hovers, letter-by-letter motion, highlighter marks and a few quiet looping effects. Each tile runs the real effect, so you can hover it, tab to it with the keyboard, or press Replay on the ones that play once. Copy CSS gives you the markup and one style block built around a single .fx class, ending with a reduced motion rule. Every animation is written so that when motion is switched off, the text simply sits in its finished, readable state.",
  useWhen: [
    "You want a headline with more character than plain bold text, such as gradient, outlined or letterpress type, without exporting it as an image.",
    "You are styling navigation or inline links and want a hover that is clear but calm, like an underline that slides in or a marker that swipes behind the word.",
    "You need a portfolio grid or blog card hover (zoom, caption slide, lift, tilt) and would rather start from finished CSS than tune easing curves.",
    "You want a hero line to animate in on load with a typewriter, word stagger or mask reveal, and need it to stay accessible.",
  ],
  customize: [
    "Change the words in the markup freely. For letter-split effects, each letter sits in its own span with `style=\"--i:0\"`, `--i:1` and so on; keep the numbers in order because the delay is `calc(var(--i) * 60ms)`, and update the hidden `.sr` copy so screen readers read the new word.",
    "Recolour by editing the hex values. Gradient text depends on three lines working together: the `background` gradient, `background-clip: text` (with the `-webkit-` version) and a transparent text colour.",
    "Resize headline effects through `font-size`. Shadow effects scale in pixels, so if you double the font size, roughly double the shadow offsets too.",
    "For image hovers, replace the painted gradient in `.fx-img` with `url(your-photo.jpg) center / cover`, or swap the span for an img with `object-fit: cover` and keep the same class.",
    "In React, change `class` to `className` and the inline `style=\"--i:0\"` to `style={{ \"--i\": 0 } as React.CSSProperties}`. In Tailwind projects, paste the style block into your global CSS file; the effects rely on pseudo elements and keyframes, which are simpler as a small class than as utilities.",
    "To trigger a one-shot reveal when it scrolls into view instead of on load, add `animation-play-state: paused` and switch it to `running` from an IntersectionObserver, or use `animation-timeline: view()` where supported.",
  ],
  accessibility: [
    "Hover effects on links and cards also run on `:focus-visible`, so keyboard users get the same feedback, and every interactive example has a visible focus outline.",
    "Letter and word split effects keep one plain copy of the text in a visually hidden `.sr` span and mark the animated spans `aria-hidden`, so screen readers say the word once instead of spelling it out.",
    "Every snippet ends with a `prefers-reduced-motion` rule that turns off animations and transitions. Reveals animate from a hidden state to the normal one, so turning motion off leaves the text fully visible.",
    "Gradient, outlined and shadowed text lowers contrast. Keep these for large headlines, not body copy, and check that the lightest part of a gradient still reads against your background.",
  ],
  faqs: [
    {
      question: "How do I make gradient text in CSS?",
      answer: "Give the text a gradient `background`, then add `-webkit-background-clip: text`, `background-clip: text` and `color: transparent`. The gradient now shows only through the letter shapes. It works in all current browsers; the prefixed line is still needed for Safari.",
    },
    {
      question: "How do I make an underline animate on hover?",
      answer: "Draw the line with a `::after` pseudo element under the link, start it at `transform: scaleX(0)` and scale it to 1 on `:hover` and `:focus-visible`. Changing `transform-origin` decides whether it grows from the left, the centre or the right.",
    },
    {
      question: "Can I make a typewriter effect without JavaScript?",
      answer: "Yes, for one line of known length. Use a monospace font, set the width in `ch` to the number of characters, and animate width from 0 with `steps()` matching that count. For several sentences or text that changes, a few lines of JavaScript are the more reliable choice.",
    },
    {
      question: "Why does my outlined text look thin or broken?",
      answer: "`-webkit-text-stroke` draws half the stroke inside each letter, so thick strokes eat into thin fonts. Use a heavy weight, and for sticker style outlines add `paint-order: stroke fill` so the fill sits on top of the stroke.",
    },
    {
      question: "Do these effects slow down a page?",
      answer: "Most animate only `transform`, `opacity` or `clip-path`, which browsers handle cheaply. Effects that animate text shadows, filters or letter spacing cost more, so use them on one headline rather than dozens of elements, and avoid running many infinite loops on one screen.",
    },
    {
      question: "Will the hover effects work on phones?",
      answer: "Touch screens have no hover, so phones show the resting state and some browsers apply the hover style briefly on tap. Make sure nothing important is only visible on hover, such as a caption you need people to read.",
    },
  ],
  related: [
    "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
    "css-gradient-backgrounds-collection-with-mesh-grain-patterns-and-copy-css",
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
  ],
  tags: ["css text effects", "css hover effects", "css text animation", "css animation examples", "gradient text css", "underline hover effect", "typewriter effect css", "image hover effects"],
  height: 1500,
  interactive: true,
};

export default meta;
