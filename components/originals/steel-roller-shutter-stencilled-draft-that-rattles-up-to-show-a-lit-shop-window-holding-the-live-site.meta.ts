const meta = {
  slug: "steel-roller-shutter-stencilled-draft-that-rattles-up-to-show-a-lit-shop-window-holding-the-live-site",
  category: "originals",
  name: "Steel Roller Shutter Stencilled Draft That Rattles Up to Show a Lit Shop Window Holding the Live Site",
  keyword: "draft to live toggle animation react",
  title: "React Draft to Live Toggle: Shop Roller Shutter | We.Inc",
  description: "Publish toggle as a shopfront: a shutter marked DRAFT rattles up and the live site stands in the window. Free React and HTML code.",
  intro: "A draft and live switch told as the oldest version of the same event: opening the shop. On a dark street a galvanised roller shutter is down, with the word painted across its slats in stencil white. Press Go live, or take hold of the shutter and throw it upward, and the slats run up into their steel box, hit the stop and shiver. A beat later the tubes inside flicker and catch, and the plate glass shows a finished homepage, lit warm from above. Light falls out across the sill and the pavement, and the pilot lamp on the box turns blue beside the word that has changed from draft to live. Pull it back down and it drops under its own weight, lands, and the street goes dark. The slats, rails, bottom rail and box are all gradients, with no images except the photograph in the page. Narrow viewports get the same shopfront zoomed to fit above a full-size button.",
  useWhen: [
    "A site builder or content tool wants its publish switch to feel like an occasion on a marketing page.",
    "A coming-soon page needs a way to show what is behind it for a moment.",
    "A local business template wants an opening-hours or open-now hero with some theatre.",
    "An onboarding flow ends on the step where the work goes public and needs one strong picture for it.",
  ],
  customize: [
    "The page in the window is the `site` object. `STENCIL` is the word painted on the slats, and its size is the `text-[136px]` class beside it.",
    "`OW` and `OH` are the window opening, `SLAT` is the pitch of the slats, and the long `repeating-linear-gradient` next to it is the profile of one slat from highlight to groove.",
    "The roller is the `pull` line in `frame`: `30` is the strength of the spring going up and `-5.5` the weight coming down. `3.4` is the drag on both.",
    "The lights are the list of times and levels that sets `s.lit`. Replace it with a single `1` for lamps that come on without flickering.",
    "`HOLD` is how long the demo stays open, and the warm spill uses `rgba(255,226,170,...)` in three places if you want colder light.",
  ],
  accessibility: [
    "The switch is one real `button` with `aria-pressed`, whose label changes between Go live and Back to draft, so nothing depends on dragging.",
    "The page in the window is exposed as a single labelled image, and a polite live region under the button states which state the shop is in.",
    "With reduced motion the shutter starts open with the lights on, and the button moves it straight to the other state with no travel, bounce or flicker.",
  ],
  faqs: [
    {
      question: "How does the stencil follow the shape of the slats?",
      answer: "The word is ordinary text with a mask made of the same repeating pitch as the slats: opaque over the face of each slat and mostly clear over the groove. The paint appears to skip the gaps the way sprayed lettering does on corrugated steel.",
    },
    {
      question: "Why does it bounce at the top and the bottom?",
      answer: "The position is integrated each frame from a force and a drag. When it passes either end it is clamped, a fraction of its speed is reversed, and a sideways shake of a few pixels is set that halves and flips every frame until it is gone.",
    },
    {
      question: "How do I connect it to a real publish action?",
      answer: "Call your own function inside `onClick`, and call `api.current?.set(true)` when it resolves. `set(false)` brings the shutter down. The `live` state always holds the side the shutter is heading for.",
    },
    {
      question: "What decides which way it goes after a drag?",
      answer: "Speed first, then position. A quick flick upward opens it from anywhere, a quick pull closes it, and a slow release opens it only if the shutter is past two fifths of the way up.",
    },
    {
      question: "Is anything animated with CSS transitions?",
      answer: "No. One loop writes the shutter position and the light level to two custom properties, and the glow, the spill on the pavement, the sill and the lamp all read them. The loop ends when the shutter is at rest.",
    },
  ],
  related: ["publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube", "tri-fold-screen-that-opens-leaf-by-leaf-from-phone-to-tablet-to-desktop-as-one-page-reflows", "framed-homepage-print-hung-on-a-nail-by-picture-wire-that-swings-settles-crooked-and-is-straightened"],
  tags: ["publish", "draft", "live", "toggle", "shutter", "shopfront", "physics"],
  height: 800,
  section: true,
  interactive: true,
};

export default meta;
