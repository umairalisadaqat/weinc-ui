const meta = {
  slug: "brass-knife-switch-on-a-slate-base-that-closes-with-a-spark-and-lights-four-opal-lamps-spelling-live",
  category: "originals",
  name: "Brass Knife Switch on a Slate Base That Closes with a Spark and Lights Four Opal Lamps Spelling Live",
  keyword: "go live switch animation react",
  title: "React Go Live Switch with Spark and Lamps | We.Inc",
  description: "Go-live control drawn as a brass knife switch on slate: throw it by the grip, it arcs as it lands and opal lamps come on in turn. Free React and HTML code.",
  intro: "A laboratory knife switch seen from the side, standing on a slab of slate with a row of four opal globes wired to it in blue cloth-covered flex. Each globe carries one letter of a four-letter word. Take the black grip and push the blade down, or press the button underneath: the blade falls, an arc jumps as it reaches the jaw, the jaw grips it for the last few degrees, and the lamps catch one after another with a short flicker each, throwing blue light up the wall, onto the stone and along the grip. Pull the blade out and a smaller spark follows it while the lamps fade in turn. A brass plate screwed to the front of the slate is engraved with the site's address. Everything is gradients plus one small canvas for the sparks; the stone grain is an SVG turbulence filter. On a phone the bench scales to the width of the screen and the button stays full size.",
  useWhen: [
    "A publish control on a marketing page, where turning a site on should feel like closing a circuit.",
    "A maintenance mode or feature flag toggle in an internal tool that deserves some weight.",
    "A launch page that is dark until the visitor throws the switch themselves.",
    "The hero of a page about uptime, power or hosting, with your own word on the globes.",
  ],
  customize: [
    "`LAMPS` is the list of letters, one globe each. For a different count, add matching positions to `LAMP_X` and matching `--l4`, `--l5` defaults in the style block.",
    "The engraved plate reads `site.address`, and the sentence under the button uses `site.name`.",
    "`A_OPEN` is how far the blade lifts. In `frame`, `-20 - 16 * s.a` is the force that throws it down and `13` is the grip of the jaw over the last `0.12` radians.",
    "The stagger between lamps is `140` milliseconds where `s.onAt` is set, and the flicker is the short list of times and levels at the end of the `s.lv` map.",
    "`arc(38, 1)` is the closing spark: the first number is how many streaks fly, the second their energy. Set `FIRST` to a very large number to stop the demo opening the switch.",
  ],
  accessibility: [
    "The button is a real `role=\"switch\"` with `aria-checked`, so the switch can be thrown from the keyboard without touching the grip.",
    "The four globes are announced as one image that says whether they are lit, and a polite live region states the site's status in words, not only in light.",
    "With reduced motion there are no sparks or flicker: the blade and lamps change straight to the other state. The flash of the arc is short and local, but keep it that way if you edit `arc`.",
  ],
  faqs: [
    {
      question: "How do the lamps light the things around them?",
      answer: "The loop writes one custom property per lamp, from 0 to 1, plus their average. The glow on each globe, the pool on the slate under it, the brightness of its porcelain holder, the wash on the wall and the rim light on the grip all take their opacity from those numbers.",
    },
    {
      question: "Why does the blade slow down just before it lands?",
      answer: "Inside the last `0.12` radians the drag on the blade is more than three times higher, which stands in for the spring leaves of the jaw pinching it. It also means pulling it out starts slowly and then lets go.",
    },
    {
      question: "Can I drag it on a touch screen?",
      answer: "Yes. The grip has `touch-action: none` and captures the pointer, and the angle is measured from the hinge pin to your finger. Let go below roughly half way and it closes; a quick flick wins over position.",
    },
    {
      question: "How do I connect it to a real publish action?",
      answer: "Run your request in the button's `onClick`, then call `api.current?.set(true)` to close the switch when it succeeds or `set(false)` to open it. `live` holds the side the blade is heading for.",
    },
    {
      question: "Is the stone a photograph?",
      answer: "No. It is an SVG `feTurbulence` stretched sideways and lit with `feDiffuseLighting`, laid over two flat gradients for the top and the sawn front edge. Change `seed` for a different slab.",
    },
  ],
  related: [
    "steel-roller-shutter-stencilled-draft-that-rattles-up-to-show-a-lit-shop-window-holding-the-live-site",
    "brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp",
    "satin-opening-ribbon-on-brass-posts-that-brass-scissors-cut-so-both-halves-flutter-down-and-the-page-goes-live",
  ],
  tags: ["publish", "go live", "switch", "toggle", "spark", "lamps", "brass", "slate"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
