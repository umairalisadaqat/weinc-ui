const meta = {
  "slug": "layered-sea-swell-waves-hero-with-foam-line",
  "category": "backgrounds",
  "name": "Layered Sea Swell Waves with Foam Line",
  "keyword": "css wave animation",
  "title": "CSS Wave Animation: Layered Sea Swell Hero | We.Inc",
  "description": "Free CSS wave animation: four layered sea swells roll along the bottom of a hero with a broken foam line. React, Tailwind and plain HTML, no canvas.",
  "intro": "Four bands of sea roll along the bottom of a pale overcast hero, each one darker and quicker than the one behind it, so the water reads as having real depth. The front swell carries a broken white foam line that rides its crest. Every band is an SVG path sliding sideways with a CSS transform, plus a slow vertical bob, so there is no canvas and no script loop. On phones the sea keeps a minimum height and the headline sits clear of it.",
  "useWhen": [
    "A coastal business such as a swim school, sailing club or harbour cafe wants a hero that says sea without a stock photo.",
    "You need an animated wave background that loads instantly and keeps page speed scores intact.",
    "A landing page needs a soft bottom edge that leads the eye down into the next section."
  ],
  "customize": [
    "Colours: each entry in `SWELLS` has a `top` and `bottom` stop. Keep the back layer palest and the front layer darkest, or the depth flattens.",
    "Speed: `seconds` in each `SWELLS` entry is how long one wave period takes to pass. Raise all four together for a calmer sea.",
    "Wave shape: `harm` lists [amplitude, waves per period, phase]. Bigger first numbers make taller swells; keep the middle number a whole number so the loop stays seamless.",
    "Foam: change `FOAM` for its colour and the `strokeDasharray` on the foam path to make the broken line denser or sparser."
  ],
  "accessibility": [
    "The whole sea sits in one `aria-hidden` layer with `pointer-events-none`, so the heading and button are the only things a screen reader or a click reaches.",
    "With reduced motion requested, a media query stops every slide and bob, leaving the four swells and the foam as a still picture.",
    "Headline and body text sit on the pale sky, well above 4.5:1. If you raise the sea higher, keep text off the darker bands."
  ],
  "faqs": [
    {
      "question": "How is a seamless CSS wave loop made?",
      "answer": "Draw a wave path that repeats exactly twice across an SVG twice as wide as its box, then animate translateX from 0 to -50%. At the end of each cycle the second copy sits where the first began, so the jump back is invisible."
    },
    {
      "question": "Why use several layers instead of one wave?",
      "answer": "Real water shows nearer swells as larger, darker and faster. Stacking four paths with rising darkness and shorter durations creates that parallax with almost no extra cost, because each one is just another composited transform."
    },
    {
      "question": "Does the animation keep running when nobody can see it?",
      "answer": "No. An IntersectionObserver sets a data attribute on the section when it leaves the screen, and the CSS pauses every animation through animation-play-state until it comes back."
    },
    {
      "question": "Can I put the waves at the top instead of the bottom?",
      "answer": "Yes. Move the sea container to the top and flip it with a scaleY of -1, or change the path close direction to the top edge. The sliding and bobbing work the same either way."
    },
    {
      "question": "Will it work without React?",
      "answer": "The plain HTML version contains the same paths written out in full, the keyframes and a few lines of script for the off-screen pause. Paste it into any page and it runs."
    }
  ],
  "related": [
    "css-animated-backgrounds-gradient-mesh-dot-grid-spotlight-aurora-and-grain",
    "swimming-pool-floor-webgl-background-with-mosaic-tiles-under-drifting-caustic-light"
  ],
  "tags": [
    "wave",
    "css animation",
    "sea",
    "svg",
    "hero"
  ],
  "height": 728,
  "section": true,
  "collection": "css-wave-animation",
  "standalone": true,
  "tech": "css",
  "reducedMotion": "The four swells and their foam line stay put as a still seascape under the headline.",
  "perf": "Eight transform animations on four SVG layers, all composited; no JavaScript runs per frame."
};

export default meta;
