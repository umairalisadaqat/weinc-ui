const meta = {
  slug: "paper-coffee-cup-name-field-where-a-marker-writes-what-you-type-round-the-cup",
  category: "inputs",
  name: "Paper Coffee Cup Name Field Where a Marker Writes What You Type Round the Cup",
  keyword: "react name input animation",
  title: "React Name Input Animation on a Coffee Cup | We.Inc",
  description: "Name field shown as a takeaway coffee cup: each letter you type is written by a marker pen as the cup turns to meet the nib. Free React and HTML to copy.",
  intro: "A text field for a first name, with a paper takeaway cup above it that shows the result. Type a letter and a black marker drops to the cup and writes it in a loose hand, following the curve of the paper. The cup turns slowly towards the pen as the name grows, the way a barista rolls it in the other hand, and when you pause the marker adds a quick underline and lifts away. Marker ink cannot be rubbed out, so deleting or changing a letter slides the cup off to the right and brings a blank one in from the left, where the corrected name is written from the start. The cup has a black lid with a sip hole, a printed green stripe and an order panel with one box crossed. The field is a normal input underneath, 56 pixels tall, and the whole piece scales down to a 360 pixel phone without sideways scroll.",
  useWhen: [
    "A café, bakery or juice bar ordering flow asks for the name to call out at the counter.",
    "A sign-up form has one friendly first-name step and you want it to be the moment people remember.",
    "A gift or personalisation page needs to show a short word on a product before the buyer pays.",
    "A landing page for a food ordering app wants a small working demo in the hero that visitors can type into.",
  ],
  customize: [
    "`demoNames` are typed by the self-running demonstration. Put a single name in the list to stop it cycling.",
    "`BAND` is the colour of the printed stripe and the order panel, and `BAND_TEXT` is the small type that repeats round the stripe.",
    "`boxes` lists the tick boxes on the order panel and `TICKED` is the index of the one the marker has crossed.",
    "`HAND` is the font stack for the handwriting. Every name in it is a font already installed on common systems, so nothing is downloaded.",
    "`SPEED` is how many pixels of name the marker covers each second. 400 keeps up with a fast typist.",
  ],
  accessibility: [
    "The real control is a text input with a visible label tied to it by `htmlFor`, so it works with autofill, voice input and screen readers.",
    "The canvas has `role=\"img\"` and an `aria-label` that states the name currently on the cup.",
    "The rule about fresh cups is written out under the field as text, so it does not depend on watching the swap.",
    "With reduced motion the first demo name is shown already written, and later edits appear on the cup at once with no pen travel and no sliding.",
  ],
  faqs: [
    {
      question: "How does the writing follow the shape of the cup?",
      answer: "The name is drawn on a flat sheet that stands for the cup wall cut open. That sheet is then painted onto the cone as 170 thin slices, each one leaning inwards towards the narrower foot. Because the whole sheet is wrapped, the printed stripe, the order panel and the ink all bend together.",
    },
    {
      question: "Why does deleting a letter bring a new cup?",
      answer: "Appending is the only edit a marker can make. The component compares the new value with what is already on the cup. If the new value starts with the old one, only the extra letters are written. Anything else swaps the cup and writes the full value again.",
    },
    {
      question: "Which font is the handwriting?",
      answer: "It asks for Marker Felt, then Bradley Hand, Segoe Print, Comic Sans MS and Chalkboard SE, and finally the browser's generic cursive face. The look therefore changes a little between a Mac, a Windows machine and a phone, in the same way two members of staff write differently.",
    },
    {
      question: "How do I get the typed name into my form?",
      answer: "The `name` state holds the value and the input is controlled by it. Give the input a `name` attribute to post it with a normal form, or lift the state up and pass it in with a change handler.",
    },
    {
      question: "Can the cup be a different colour or carry my own print?",
      answer: "The paper colour is the first fill in the block that paints the unrolled wall, `#f7f2e9`. The stripe, its text and the panel are drawn in the same block with ordinary canvas calls, so you can add your own shapes or type there and they will wrap with everything else.",
    },
  ],
  related: ["spice-jar-rack-filter-with-glass-jars-that-turn-behind-a-brass-rail-to-show-their-labels", "ray-marched-glass-tube-range-slider-with-ultramarine-liquid-that-chases-a-steel-bead-and-pools-blue-light-on-paper", "round-wall-thermostat-slider-with-a-turning-copper-bezel-and-a-glass-face-that-glows-from-blue-to-amber"],
  tags: ["input", "name", "coffee", "cup", "marker", "handwriting", "canvas", "cafe"],
  height: 800,
  interactive: true,
};

export default meta;
