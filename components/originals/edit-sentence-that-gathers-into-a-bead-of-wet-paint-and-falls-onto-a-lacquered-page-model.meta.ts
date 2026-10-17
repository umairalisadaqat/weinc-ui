const meta = {
  slug: "edit-sentence-that-gathers-into-a-bead-of-wet-paint-and-falls-onto-a-lacquered-page-model",
  category: "originals",
  name: "Edit Sentence That Gathers into a Bead of Wet Paint and Falls onto a Lacquered Page Model",
  keyword: "ai website edit animation react",
  title: "React Site Edit Animation: A Bead of Wet Paint | We.Inc",
  description: "Demo of editing a site by saying it: the sentence gathers into a bead of paint that falls onto a page model and spreads. Free React and HTML code.",
  intro: "A way to show a website being changed with a sentence, without a single screenshot of an editor. A florist's homepage is painted on a thick lacquered board that lies tilted on a pale table. Above it sits a black bar holding the instruction, for example Make the header warmer, with a small well of paint at its left end. When the sentence is finished a glossy bead swells out of the underside of the bar, lets go, and falls. Its shadow tightens on the board as it comes down, the board dips under the hit, and the new colour runs outward from the landing point as a circle with a thick shining lip, kept inside the part that was named. The fresh coat carries a wet streak of light for about two seconds and then dries flat. Four pill buttons under the board say the next change: header, button, whole page, or start again. On a phone the bar and the buttons keep their full size and only the board is scaled down.",
  useWhen: [
    "A site builder's landing page has to explain editing by chat in one glance, above the fold.",
    "A product tour needs a self-playing loop for the step where a visitor asks for a change.",
    "A theme or brand settings page wants its colour choices to arrive as paint instead of a hard swap.",
    "A talk or launch page needs a calm centrepiece that keeps moving while people read around it.",
  ],
  customize: [
    "`site` holds the brand, menu, headline, button label and photograph painted on the board.",
    "`WARM`, `COOL`, `NIGHT` and `BLUE` are the four paints. `plan` pairs each one with its sentence, so edit the wording and the colour in the same line.",
    "`zones` says where each bead lands (`cx`, `cy`) and the rectangle its coat must stay inside. Add a zone and a branch in `plan` to make another part of the page paintable.",
    "`SPREAD` is how long the coat takes to run out and `DRY` how long the wet streak lasts. Raise `SPREAD` to 1400 for something closer to honey.",
    "The tilt is `rotateX(55deg) rotateZ(-17deg)` in the frame loop. Lower the first number to look at the board more squarely.",
  ],
  accessibility: [
    "Each pill is a real button whose accessible name is the full sentence it will say, such as Turn the button blue, so nothing depends on seeing the colour dot.",
    "A polite live region repeats the sentence when a change starts. The moving bead, its shadow and the wet lip are hidden from assistive technology.",
    "Only the dry coat carries the heading and the photo description. The copy used for the spreading layer is marked hidden, so a screen reader meets the page once.",
    "With reduced motion nothing falls or spreads: pressing a pill repaints that part at once and the board stops swaying.",
  ],
  faqs: [
    {
      question: "How does the colour stay inside the header or the button?",
      answer: "Two complete copies of the page are stacked: the dry look underneath and the next look on top. The top one is cut by `clip-path: circle()` centred where the bead landed. Since the two looks differ only in the named part, the growing circle shows new colour there and nowhere else. The shining lip is a separate ring inside a box with the same shape as that part, with `overflow: hidden`.",
    },
    {
      question: "How does the bead know where to land on a tilted board?",
      answer: "An invisible marker sits on the board at the landing point. Just before the bead lets go, `sight` reads the marker's place on screen with `getBoundingClientRect`, which already includes the tilt and the perspective, and the fall is aimed at that pixel.",
    },
    {
      question: "Can I connect it to a real text prompt?",
      answer: "Yes. `api.current.say(part)` starts a coat for one part. Map your own parser's answer to a part name and call it, or extend `plan` so it returns a look built from what the visitor typed.",
    },
    {
      question: "Why does the board have a pale edge when the page turns dark?",
      answer: "The eleven stacked layers under the face are drawn as bare board. Paint only ever reaches the top, which is what makes the dark page read as a coat on an object and not as a theme switch.",
    },
    {
      question: "What does it cost to run?",
      answer: "One animation frame loop that moves a bead, changes one clip path and resizes one ring. There is no canvas. The loop stops when the section leaves the screen.",
    },
  ],
  related: ["pop-up-card-where-a-typed-sentence-stands-up-as-a-layered-paper-homepage", "proof-press-with-a-steel-cylinder-that-rolls-a-typed-brief-into-a-printed-homepage"],
  tags: ["edit", "prompt", "paint", "lacquer", "3d", "page model", "colour"],
  height: 760,
  section: true,
  interactive: true,
};

export default meta;
