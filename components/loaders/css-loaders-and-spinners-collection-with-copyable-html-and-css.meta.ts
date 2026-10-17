const meta = {
  slug: "css-loaders-and-spinners-collection-with-copyable-html-and-css",
  category: "loaders",
  name: "117 CSS Loaders and Spinners You Can Copy",
  keyword: "css loader",
  title: "117 CSS Loaders and Spinners: Copy HTML and CSS | We.Inc",
  description: "Free collection of 117 pure CSS loaders in 10 families: spinners, dots, bars, progress bars, skeleton screens, text loaders and gradient rings.",
  intro: "A searchable library of 117 loading animations made only with HTML and CSS, sorted into ten families: spinners, dots, bars, pulses, progress bars, skeleton screens, text loaders, morphing shapes, orbiting motion and gradient rings. Every tile runs the real animation, and the dark preview switch shows how each one looks on a dark page. Copy CSS gives you a self-contained snippet: one div with role=\"status\" and an aria-label, a few empty spans where the design needs them, and one style block that includes a reduced motion rule. Colour comes from a single --loader-color variable, so one line restyles any loader to your brand. On a phone the grid drops to one column and the code view scrolls inside its own box.",
  useWhen: [
    "A button, form or page section waits on a network request and you need a small, clear sign that something is happening without adding a library.",
    "Content arrives in a known layout, such as a card, list or profile, and a skeleton screen in that shape will feel faster than a spinner.",
    "You build in plain HTML, a CMS theme or a static site where only a stylesheet will do, or you want the same loader to work in React, Vue and Svelte.",
    "You are picking a loading style for a product and want to compare quiet spinners, playful morphing shapes and branded gradient rings side by side.",
  ],
  customize: [
    "Change the colour with one line: set `--loader-color: #0f766e` on `.loader` or on any parent. Most loaders draw with `currentColor`, so the faint tracks and trails follow it automatically through `color-mix`.",
    "Change the size by editing the `width` and `height` on the main `.loader` rule. For ring loaders also change the number in the mask, for example `calc(100% - 5px)`, which sets the ring's thickness.",
    "Change the speed by editing the duration in the `animation` line, such as `.8s`. Shorter feels urgent, longer feels calm; most spinners read well between .7s and 1.4s.",
    "Skeleton screens use `color: #94a3b8` and two custom properties, `--loader-a` and `--loader-b`, for the base and highlight. Adjust those to match your card colours, and change the span widths to match your real layout.",
    "In React, change `class` to `className` and paste the style block into your global CSS, or a CSS module, keeping the `.loader` name or renaming it per style so several can live on one page.",
  ],
  accessibility: [
    "Each snippet uses `role=\"status\"` with `aria-label=\"Loading\"`, so screen readers announce it politely. Change the label to say what is loading, such as \"Loading invoices\", and remove the element once the content is in.",
    "Every snippet includes a `prefers-reduced-motion` rule that stops spinning, bouncing and sliding and replaces it with a slow fade, so people who turn motion down still see that work is in progress.",
    "Text loaders show real words, but the aria-label is what gets announced, so the letters are not read out one by one.",
    "Loaders drawn in `currentColor` inherit contrast from your text colour. If you pick a pale colour, check it against the background, especially the faint 15 to 25 percent tracks.",
  ],
  faqs: [
    {
      question: "How do I add one of these CSS loaders to my page?",
      answer: "Press Copy CSS, paste the div where the loading state should appear and move the style block into your stylesheet or page head. Show the div while a request runs and remove it, or hide it, when the content arrives.",
    },
    {
      question: "Do these loaders need JavaScript?",
      answer: "No. All motion is CSS keyframes on the element, its spans and its pseudo elements. You only need your own code to decide when the loader is shown and when it goes away.",
    },
    {
      question: "Should I use a spinner or a skeleton screen?",
      answer: "Use a skeleton when you know the shape of what is coming, such as a list or card, because it previews the layout and avoids a jump when content loads. Use a spinner or progress bar for actions with no fixed layout, like saving a form or uploading a file.",
    },
    {
      question: "How do I make a CSS spinner a different size or thickness?",
      answer: "Change width and height on the .loader rule. For border based spinners change the border width; for gradient rings change the pixel value inside the mask, which is the thickness of the ring.",
    },
    {
      question: "Which browsers support these loaders?",
      answer: "Current versions of Chrome, Edge, Firefox and Safari. A few use newer features: color-mix for faint tracks, @property for the ring fill and moving light, and offset-path for the figure eight. Older browsers will show a simpler or static version of those few.",
    },
    {
      question: "How do I make the loader announce what is loading?",
      answer: "Edit the aria-label, for example aria-label=\"Loading search results\". Keep role=\"status\" so assistive technology treats it as a polite update rather than interrupting the user.",
    },
    {
      question: "Should a skeleton shimmer or pulse, as with Tailwind animate-pulse?",
      answer: "Both work. A pulse fades the whole block in and out, which is calm and cheap and is what Tailwind's animate-pulse class does with opacity. A shimmer moves a lighter band across by animating background-position, which reads more clearly as loading on large blocks. The Pulsing paragraph tile here is the pulse version; the rest shimmer.",
    },
    {
      question: "How do I stop the page jumping when the real content replaces a skeleton?",
      answer: "Give each skeleton the same box as the content that replaces it: the same width, the same line heights and gaps, and a fixed width and height or aspect-ratio for images, as the Product tile and Media post card do with their picture blocks. When both take the same space, nothing below moves and the layout shift stays near zero.",
    },
    {
      question: "How do I use these skeletons in React with a loading prop?",
      answer: "Paste the CSS into your stylesheet, then write a small component such as function Skeleton({ loading, children }) that returns the loader div with its spans while loading is true and returns children once it is false. Keep role=status on the skeleton so the waiting state is announced.",
    },
  ],
  related: [
    "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
    "mechanical-watch-movement-loader-with-swinging-balance-wheel-and-breathing-hairspring",
    "brass-spinning-top-loader-that-chalks-a-spiral-and-stands-upright-when-done",
  ],
  tags: ["css loader", "css spinner", "loading animation css", "css loading spinner", "skeleton loader css", "skeleton loader", "shimmer effect css", "pure css loader", "css progress bar", "loading dots css"],
  height: 1500,
  interactive: true,
};

export default meta;
