const meta = {
  slug: "hover-and-focus-glitch-menu-links",
  category: "text-effects",
  name: "Hover and Focus Glitch Menu Links",
  keyword: "glitch hover effect css",
  title: "",
  description: "",
  intro: "A large typographic studio menu on pale sea-glass green. Pointing at a link, or tabbing to it, fires a single half-second glitch: the label jolts, splits into red and blue slices, and an underline sweeps across the row. Until someone interacts, the links take turns showing the effect so the menu never looks inert.",
  useWhen: [
    "A portfolio or agency site wants a full-screen or footer menu with personality that only reacts when asked to.",
    "You need a glitch interaction that keyboard users trigger exactly like mouse users.",
  ],
  customize: [
    "Lengthen or shorten each burst with `--w10hov-burst`; anything over a second starts to feel sluggish.",
    "Edit the menu in the `links` array (React) or the list items (HTML); keep `data-text` equal to the visible label.",
    "Turn off the idle demo by deleting the second effect in React or setting `DEMO_EVERY` very high in the script.",
  ],
  accessibility: [
    "Each label is announced once from a hidden span inside a real link in a labelled nav; the effect runs on `:focus-visible` too, and reduced motion keeps only the static underline.",
  ],
  faqs: [],
  related: [],
  tags: ["glitch hover effect", "glitch text css", "menu hover", "focus animation", "navigation links"],
  height: 620,
  section: true,
  interactive: true,
  collection: "glitch-text-effect",
  tech: "css",
  reducedMotion: "Links show a plain underline on hover or focus, with no jolt, slices or idle demo.",
  perf: "Nothing runs at rest; each hover plays one half-second clip-path burst, and the demo timer stops off screen.",
};

export default meta;
