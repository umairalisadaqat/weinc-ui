const meta = {
  slug: "css-button-styles-collection-with-copyable-html-and-css-for-every-button",
  category: "buttons",
  name: "137 CSS Button Styles You Can Copy",
  keyword: "css button",
  title: "137 CSS Button Styles: Copy the HTML and CSS | We.Inc",
  description: "Free collection of 137 CSS buttons in 18 families: 3D, glass, gradient, brutalist, loading and more. Each one copies as plain HTML and CSS.",
  intro: "A searchable library of 137 CSS button styles sorted into 18 families, from quiet solid and outline buttons to pressable 3D keys, frosted glass, soft UI, shine sweeps, animated borders, split buttons and toggles. Every tile shows the real button working, so you can hover, press and tab to it before you take it. Copy CSS puts a self-contained snippet on your clipboard: the button's markup followed by one style block with a plain .btn class, including hover, pressed, keyboard focus and reduced motion rules. On a phone the grid drops to one column, the family filters wrap, and the code view scrolls inside its own box.",
  useWhen: [
    "You need a good looking call to action today and would rather pick from finished buttons than tune shadows and transitions from scratch.",
    "You work in plain HTML, a CMS theme or an email landing page where a component library is not available and only a stylesheet will do.",
    "You want a loading, toggle or split button pattern and need to see which attributes drive its states before writing your own.",
    "You are choosing a button personality for a brand and want to compare brutalist, glass, neumorphic and minimal treatments side by side.",
  ],
  customize: [
    "Recolour a button by editing the hex values in its snippet. Most use one fill colour, one darker hover shade and, for the 3D keys, one shadow colour such as `box-shadow: 0 5px 0 #1e3a8a` that should be the darkest of the three.",
    "Change the size in the shared `.btn` rule: `min-height: 44px` and `padding: 0 22px` set the box, and `font: 600 15px/1.2` sets the type. Keep the height at 40px or more so it stays easy to tap.",
    "Swap the font by replacing `Inter, ui-sans-serif, system-ui` in the `font` shorthand with your own family. If your site already sets a font on body, change the value to `inherit`.",
    "In Tailwind, paste the style block into your global CSS file (inside `@layer components` if you like) and keep `class=\"btn\"` on the element, or rename `.btn` to something like `.btn-glass` so several styles can live together.",
    "In React, change `class` to `className`, and for the toggle and loading buttons replace the inline `onclick` with state, for example `aria-pressed={liked}` and `onClick={() => setLiked(!liked)}`. The CSS keys off those attributes, so it needs no changes.",
  ],
  accessibility: [
    "Every example is a real button element, so Enter and Space work and screen readers announce it as a button. Icon-only buttons in the set carry an aria-label; keep one if you remove the visible text from any other style.",
    "Toggle styles change their look from `aria-pressed` and loading styles from `aria-busy`, which means the visual state and the announced state can never drift apart.",
    "Each snippet includes a `:focus-visible` outline offset by 3px so keyboard users always see where they are, and a `prefers-reduced-motion` rule that stops loops, sweeps and transitions.",
    "Text colours were picked to stay readable on their fills. If you lighten a background or put white text on a pale gradient, check the contrast again before shipping.",
  ],
  faqs: [
    {
      question: "How do I use one of these CSS buttons in a plain HTML page?",
      answer: "Press Copy CSS, paste the button where you want it and move the style block into your page head or stylesheet. Nothing else is needed. If you use two different styles on one page, rename `.btn` in one of them so their rules do not overlap.",
    },
    {
      question: "Do the animated buttons need JavaScript?",
      answer: "No. Hover fills, shine sweeps, rotating borders, ripples and spinners are all pseudo elements, transitions and keyframes. Only the toggle and loading demos use a one line onclick to flip an attribute, and in a real app your own code would set that attribute instead.",
    },
    {
      question: "How do I make a 3D button that pushes down when clicked?",
      answer: "Give the button a solid shadow straight below it, such as `box-shadow: 0 5px 0` in a darker shade, then on `:active` move it down by the same 5px and remove the shadow. A very short transition on press, around 50ms, makes it feel like a real key.",
    },
    {
      question: "Why does the glass button look flat on my site?",
      answer: "Backdrop blur only shows something when there is colour or an image behind the button. Place it over a photo or a gradient section, and keep the semi-transparent white fill low, around 12 to 20 percent, so the background still shows through.",
    },
    {
      question: "Can I use these buttons with Tailwind classes instead of a stylesheet?",
      answer: "Simple ones translate directly: a solid style becomes `bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg px-5 min-h-11`. Styles that rely on `::before`, `::after` or keyframes are easier to keep as a small CSS class next to your Tailwind utilities, which works fine in both version 3 and 4.",
    },
    {
      question: "Should a button that goes to another page be a link instead?",
      answer: "Yes. If clicking takes the visitor to a new address, use an a element with an href and keep the same class. Every rule here also works on links, and the browser then handles opening in a new tab and copying the address.",
    },
  ],
  related: [
    "html-css-button-set-with-primary-secondary-outline-ghost-icon-loading-and-destructive-styles",
    "neo-brutalist-button-set-with-sizes-and-icons",
    "thick-glass-pill-button-that-refracts-a-portrait-and-flattens-when-pressed",
  ],
  tags: ["css button", "cool button css", "best css button", "awesome button css", "css button styles", "3d button", "glass button", "loading button"],
  height: 1500,
  interactive: true,
};

export default meta;
