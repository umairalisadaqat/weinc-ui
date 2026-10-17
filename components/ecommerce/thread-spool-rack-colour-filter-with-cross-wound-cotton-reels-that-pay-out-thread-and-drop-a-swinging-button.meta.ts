const meta = {
  slug: "thread-spool-rack-colour-filter-with-cross-wound-cotton-reels-that-pay-out-thread-and-drop-a-swinging-button",
  category: "ecommerce",
  name: "Thread Spool Rack Colour Filter with Cross-Wound Cotton Reels That Pay Out Thread and Drop a Swinging Button",
  keyword: "react colour filter swatches",
  title: "React Colour Filter Swatches as Thread Spools | We.Inc",
  description: "Colour filter built as a rail of cotton reels: choose a colour and its reel turns, pays out thread and drops a swinging button. Free React and HTML code.",
  intro: "Eight reels of sewing cotton stand on pegs along a walnut rail, and each one is a colour you can filter by. A thread runs from every reel through a brass screw eye under the rail and ends in a four-hole button of the same colour. While a colour is switched off its button sits tight under the eye. Switch it on and the reel turns, the crossed wraps on its side slide past each other, and the button drops on a length of thread and swings like a small pendulum until it settles. The reel turns by exactly the amount of thread that leaves it. Brush a pointer through a hanging thread and the button is knocked sideways. Under the rail a sentence lists the colours that are down, with a button that winds them all back. On a phone the rail splits into two shorter rails of four reels.",
  useWhen: [
    "A fabric, yarn or clothing shop filters products by colour and round swatches feel too generic for the brand.",
    "A product listing offers up to eight colourways and several can be chosen together.",
    "A craft tutorial site or pattern shop wants the filter bar to double as the page illustration.",
    "A made-to-order page asks which trim colours a customer wants to see samples of.",
  ],
  customize: [
    "`threads` is the list of colours. Each has a spoken `name`, a `stamp` of up to eight letters that is branded into the rail, and a hex `color` used for the cotton, the thread and the button.",
    "`START` lists which colours hang down on load. `[]` opens with every button tucked up.",
    "`DROP` is the hanging length in design pixels. On narrow screens 78 percent of it is used so the top rail's buttons clear the lower reels.",
    "`RF`, `RB` and `HT` are the reel's flange radius, wound radius and height. Bring `RB` up to 28 for a full reel or down to 16 for one that is nearly used up.",
    "In `sim`, `2600` is gravity and `0.992` is how much swing survives each step. Use `0.97` if the buttons should come to rest within a second.",
  ],
  accessibility: [
    "Each reel is a native `input type=\"checkbox\"` labelled with the full colour name, wrapped in a `label` that covers the reel, the rail stamp and the hanging button.",
    "The boxes sit in a group called \"Filter by thread colour\", so a screen reader user hears what the set is for before the first option.",
    "Colour is never the only signal: the chosen colours are written out under the rail in a polite live region.",
    "If the visitor asks for reduced motion there is no swing and no turning reel. A chosen button is simply drawn at the end of a straight thread.",
  ],
  faqs: [
    {
      question: "What makes the buttons swing?",
      answer: "Each thread is a chain of ten points joined by links of fixed length. Every frame the points fall under gravity and the links are pulled back to length eight times. The last point is given most of the weight in that correction, so it behaves like a button on a string and not like a loose end.",
    },
    {
      question: "Is the swinging expensive?",
      answer: "The rail, wall shadows and screw eyes are one cached picture, and each reel is its own cached picture that is repainted only while it turns. Per frame the work is eighty points of arithmetic, eight short curves and eight buttons. The loop stops when the rack leaves the viewport or the tab is hidden.",
    },
    {
      question: "How do I get the selected colours out?",
      answer: "`picked` is an array of booleans that lines up with `threads`. Map it to hex values or names and pass that to your product query, or lift the state and hand the component an `onChange` in place of the local `set`.",
    },
    {
      question: "Can it be single choice?",
      answer: "Change the `onChange` so the new array is true only at the pressed index, and switch the inputs to `type=\"radio\"` with a shared `name`. Arrow keys will then move between reels with no extra code.",
    },
    {
      question: "Why does the white thread still show on a pale wall?",
      answer: "Every thread is stroked three times: a darker outline, the colour, then a broken highlight that suggests the twist. For very light colours the outline is a warm brown, which keeps the line visible against the plaster.",
    },
  ],
  related: ["spice-jar-rack-filter-with-glass-jars-that-turn-behind-a-brass-rail-to-show-their-labels", "apothecary-drawer-wall-category-filter-with-brass-label-holders-and-oak-drawers-that-pull-out-over-dried-botanicals", "chrome-shop-rail-of-silk-scarves-on-clamp-hangers-that-slide-swing-and-settle-in-soft-pleats"],
  tags: ["filter", "colour", "checkbox", "thread", "physics", "canvas", "haberdashery", "skeuomorphic"],
  height: 720,
  interactive: true,
};

export default meta;
