const meta = {
  slug: "folded-paper-tag-faq-hung-on-brass-hooks-in-ray-marched-sunlight-where-each-tag-drops-open-to-show-its-printed-answer",
  category: "faq",
  name: "Folded Paper Tag FAQ Hung on Brass Hooks in Ray Marched Sunlight Where Each Tag Drops Open to Show Its Printed Answer",
  keyword: "webgl faq accordion react",
  title: "WebGL FAQ of Folded Paper Tags on Brass Hooks | We.Inc",
  description: "Free React FAQ: folded card tags on brass hooks in WebGL sunlight. Press one and its flap drops open on its crease to show the printed answer.",
  intro: "Five folded card tags hang on twine from brass hooks screwed into an oak rail, on a limewashed wall caught by low sun through a four pane window. Each tag shows its question on the outside of a folded flap. Open one and the flap peels off its crease, swings down under its own weight, overshoots and settles a few degrees out from the paper, the way real card remembers a fold, while the tag rocks on its string. The answer is printed across the inside of the opened card, and the same answer appears as real text in the list beside the wall. The scene is ray marched in a single fragment shader, so shadows, contact darkening, the brass reflections and the light coming through thin paper are all computed rather than painted. Below the large breakpoint the wall sits above the list and keeps a 4:3 frame, so all five tags stay in view on a phone.",
  useWhen: [
    "A small shop, studio or workshop wants its questions page to feel like a counter you could walk up to.",
    "Questions are short enough to print on a tag (about thirty characters) and answers fit in two or three sentences.",
    "You want one answer open at a time, with the picture and the text list always agreeing about which one it is.",
    "The page can spend a WebGL canvas on one striking section and still needs a plain accessible accordion underneath.",
  ],
  customize: [
    "Edit the `tags` array: `q`, `a` and `paper`, an RGB triple from 0 to 1 that tints that tag's card. Keep the paper tones muted so the printed ink reads.",
    "`START_OPEN` picks the tag that hangs open on load and `DEMO_EVERY` sets how often the idle demo moves along the rail. The demo stops for good after the first click.",
    "The fall of a flap lives in `step`: `-60 * Math.sin(q.b)` is its weight and `2.6 * (Math.PI - q.b)` is the memory of the crease. Raise the second number for stiffer card that stays further out.",
    "The window that shapes the sunlight is the `box2(w, vec2(1.05, 0.66))` call inside `sun()`, and `vec2(-2.62, 3.44)` moves the patch across the wall.",
    "`SHOP` changes the name printed inside every tag and above the heading, and the ink colours sit at the top of `makeAtlas`.",
  ],
  accessibility: [
    "The list is a normal accordion: each question is a button inside an `h3` with `aria-expanded` and `aria-controls` pointing at a labelled region that holds the answer text.",
    "The canvas is `aria-hidden`. Pressing a tag in the picture is only a pointer shortcut for the same buttons, so nothing is reachable by the picture alone.",
    "With reduced motion the idle demo is off and a tag snaps between folded and open, drawn once per change with no swinging.",
    "Without WebGL 2 a still version of the wall drawn in CSS takes the canvas's place and shows the same open tag.",
  ],
  faqs: [
    {
      question: "How is the text printed on the paper inside the shader?",
      answer: "Before the first frame, every question and answer is drawn with the 2D canvas API onto one atlas, a column per tag. The shader works out where on the card each pixel lands, reads the ink from the atlas and mixes it over the paper colour, so the printing picks up the same sunlight and shadow as the card.",
    },
    {
      question: "What makes the flap fall like card rather than slide like a drawer?",
      answer: "Each flap is a small pendulum hinged at the crease. Gravity pulls it down with the sine of its angle, a weak spring pulls it back toward the fold, and light damping lets it swing past and come back. Closing uses a stiffer spring and a bounce off the face of the tag, which nudges the tag on its string.",
    },
    {
      question: "Will it run on an ordinary laptop?",
      answer: "The canvas renders at no more than 1.5 times device pixels and about one million pixels in total, and drops its own resolution if the frame rate stays under 40. It stops drawing when it scrolls off screen or the tab is hidden.",
    },
    {
      question: "Can more than one tag be open?",
      answer: "Not in this version, because the list beside the wall reads like an accordion with one answer showing. To allow several, change `open` to an array of indexes and test `includes(i)` in both the step function and the list.",
    },
    {
      question: "How many tags fit on the rail?",
      answer: "Five, spaced by `SP`. The shader constants assume five hooks, so for six or seven raise the rail length in `map()`, lower `SP` a little and widen `halfW` in `camera()` so the outer tags stay inside the frame.",
    },
  ],
  related: [
    "matchbook-faq-row-where-each-printed-cover-flips-up-off-its-comb-of-matches-to-show-the-answer-inside",
    "oak-card-index-box-faq-with-tabbed-question-cards-that-rise-out-and-stand-against-the-open-lid",
  ],
  tags: ["faq", "accordion", "webgl", "paper", "ray marching", "physics"],
  height: 640,
  section: true,
  interactive: true,
};

export default meta;
