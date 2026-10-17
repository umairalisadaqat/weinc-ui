const meta = {
  slug: "css-gradient-border-collection-with-rounded-corners-animated-glow-and-copyable-css-or-tailwind",
  category: "borders",
  name: "CSS Gradient Border: 12 Techniques with Rounded Corners and Glow",
  keyword: "css gradient border",
  title: "CSS Gradient Border: 12 Techniques, Rounded Corners | We.Inc",
  description: "Free CSS gradient border examples: border-image, padding-box, mask, SVG stroke, glow and rotating conic edges, plus Tailwind versions. Copy each one as shown.",
  intro: "Twelve working gradient borders, each built with a different technique and dressed as a real piece of interface: a changelog card, a pricing card, a testimonial, a pill button over a dusk background, a dashed upload zone, a stat tile with a glow, a progress card whose edge turns, a deploy card with a light running around it, an email field that lights up on focus, and two Tailwind-only cards. Under every piece is one line on how it works and what it gives up. Copy takes the exact HTML and style block shown, or the Tailwind markup, and a comparison table at the end tells you which method handles rounded corners, a see-through middle and animation. On a phone the grid becomes one column and code opens full width.",
  useWhen: [
    "A pricing card, plan badge or featured tile needs to stand out from its neighbours without a heavier shadow or a coloured fill.",
    "You need a rounded gradient edge and found that border-image squares the corners off.",
    "The border sits over a photo or gradient and the middle must stay transparent, as with an outline button in a hero.",
    "You want a slow animated edge on one card, such as a live sync or deploy status, to draw the eye without moving the layout.",
    "Your project uses Tailwind and you want a gradient border without writing a custom plugin or extra CSS file.",
  ],
  customize: [
    "Change the colours by editing the stops in the gradient, for example linear-gradient(135deg, #22d3ee, #6366f1 55%, #d946ef). Add or remove stops freely; the technique does not care how many there are.",
    "Change the border width where the technique keeps it: the border value (2px solid transparent) for the padding-box method, padding: 1.5px on the wrapper or on the masked ::before, and stroke-width on the SVG rect.",
    "Keep the radii in step. On the wrapper and Tailwind p-px versions, the inner radius should be the outer radius minus the border width, such as 18px outside and 16.5px inside.",
    "Change the speed of the animated edges with the duration in animation: K-turn 5s, renamed card-turn in the copied code. Between 3s and 8s reads as calm; faster starts to look like a warning.",
    "For a light page, change the solid fill in the padding-box layer and in .body from #16181d to your card colour, and darken the text colours in the base block.",
  ],
  accessibility: [
    "The gradient is decoration only. Every piece still has a readable label and text at 4.5:1 or better against its fill, so nothing depends on seeing the colours of the edge.",
    "Animated edges stop under prefers-reduced-motion through the rule in the base block, which leaves a still gradient in place. The marching dashes on the upload zone stop the same way.",
    "Links, buttons and the email field have visible focus outlines that do not rely on the gradient, and are at least 40px tall. The progress bar in the syncing card carries role=progressbar with a label and value.",
    "The email field keeps a real label tied to its id. If you reuse the focus technique on several fields, give each input its own id.",
  ],
  faqs: [
    {
      question: "How do I make a gradient border with rounded corners?",
      answer: "Do not use border-image for this, because it ignores border-radius. Give the element a transparent border and two backgrounds: a solid one clipped to padding-box and the gradient clipped to border-box. Any border-radius then curves the gradient with it.",
    },
    {
      question: "How do I keep the inside transparent?",
      answer: "Use the masked pseudo-element or the SVG stroke. The mask version puts the gradient on ::before, sets padding to the border width and uses mask-composite: exclude (with -webkit-mask-composite: xor for WebKit) so only the ring between the content box and the border box stays visible.",
    },
    {
      question: "Can I animate a gradient border with CSS only?",
      answer: "Yes. Register a custom property with @property as an angle, use it as the start angle of a conic-gradient and animate the property in keyframes. Without the @property rule the browser cannot interpolate the value, so the edge would jump instead of turning.",
    },
    {
      question: "How do I add a gradient border in Tailwind without a plugin?",
      answer: "Either wrap the content in a gradient element with p-px or p-0.5 and give the inner element a slightly smaller radius, or put both background layers in one arbitrary property such as [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(90deg,#f43f5e,#f59e0b)_border-box] together with border-2 border-transparent.",
    },
    {
      question: "Why does my glow pseudo-element disappear behind the parent?",
      answer: "A pseudo-element with a negative z-index drops below the nearest stacking context, which may be an ancestor with its own background. Setting isolation: isolate on the card makes it the stacking context, so the glow stays just behind the card and above the page.",
    },
    {
      question: "Which browsers support these techniques?",
      answer: "border-image, multiple backgrounds with background-clip and SVG strokes work in every current browser. Unprefixed mask and mask-composite are supported in current Chrome, Edge, Firefox and Safari, and @property, needed for the turning edges, is supported in all of them too. In a browser without @property the animated cards show a still gradient.",
    },
  ],
  related: [
    "glass-tube-border-feature-card-in-webgl-with-a-warm-bead-of-light-that-runs-the-edge-and-warms-the-sunlit-table",
    "css-loaders-and-spinners-collection-with-copyable-html-and-css",
    "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
  ],
  tags: ["css gradient border", "gradient border radius", "tailwind gradient border", "animated gradient border", "border-image gradient", "conic gradient border", "gradient outline button"],
  height: 1400,
  section: true,
  interactive: true,
};

export default meta;
