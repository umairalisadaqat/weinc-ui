const meta = {
  slug: "embossing-label-maker-with-a-letter-wheel-that-punches-status-badges-into-glossy-tape",
  category: "feedback",
  name: "Embossing Label Maker with a Letter Wheel That Punches Status Badges into Glossy Tape",
  keyword: "status badge react tailwind",
  title: "React Status Badges from an Embossing Label Maker | We.Inc",
  description: "Status badges made by a label maker: a letter wheel spins to each characterand punches it into glossy tape. Free React and Tailwind code, or HTML.",
  intro: "Status badges presented as strips of embossed vinyl tape, with the machine that makes them. An orange hand labeller sits on a cream desk, seen from straight above. Its black wheel carries forty characters. For each letter of the word the wheel turns the short way round, a chrome lens shows the character it has stopped on, the cream key dips, and the tape clicks one cell further out of the nose. When the word is finished a toothed blade nips across and the strip slides down to join the pile, landing a few degrees off square. Type up to ten characters, pick one of five tape colours and press Print to make your own. The machine and the pile scale together to fit a phone, while the text field, colour dots and Print button stay full size underneath.",
  useWhen: [
    "An order, shipping or job tracking page wants its states (paid, packed, on hold) to look like labels someone stuck on by hand.",
    "A stationery, craft or organising brand needs a hero object that produces something while the visitor watches.",
    "A style guide page shows the full badge set and wants a small tool for trying new wording in each colour.",
    "A studio site has a short list of project stages and prefers objects to coloured pills.",
  ],
  customize: [
    "`tapes` lists the cartridges as a `name` and a `tone`. Add an entry and another colour dot appears. The letters stay cream on any tone because embossed vinyl turns pale where it stretches.",
    "`starting` is the pile shown at load and `demo` is the list the machine works through unprompted. Each entry is a `text` and the index of a tape.",
    "`BODY` is the shell colour and also tints the hub cap. `#2f6f73` gives a teal machine. The two darker reds in the wheel well and key well should be changed to match.",
    "`CHARS` is the character set in wheel order. It can be any length because `STEP` spaces the letters from it, but above about 44 they start to touch.",
    "`CELL` is the width given to each character on the tape and `TAPE_H` is the tape height. Raise both together with the `fontSize: 15` in `Tape` for chunkier badges.",
  ],
  accessibility: [
    "The pile is a real list with the label text as its content, so a screen reader reads the statuses in order and ignores the machine, which is marked as decoration.",
    "Text entry is a labelled input, the colours are a `radiogroup` of named buttons with `aria-checked`, and Print is a submit button, so Enter in the field prints.",
    "Each finished label is announced through a polite live region with its wording and tape colour.",
    "With reduced motion the wheel, key and feed are skipped: Print adds the strip to the pile at once and the unattended demo never runs.",
  ],
  faqs: [
    {
      question: "How do I use only the badge without the machine?",
      answer: "Copy the `Tape` function with `teeth`, `widthOf`, `CELL`, `LEAD` and `TAPE_H`. It takes a `text` and a `tone` and returns one strip. The glare class in the style block is optional and can be dropped.",
    },
    {
      question: "How is the raised lettering done?",
      answer: "Each character is cream text with four text shadows: a tight white halo for the stretched vinyl, a dark offset below and right, a pale offset above and left, and a wide soft glow. The strip itself is one gradient that is light at the top and dark at the bottom.",
    },
    {
      question: "Why does the tape come out to the left?",
      answer: "So the word reads the right way round as it appears. The first letter punched is the first to leave the machine, and it has to end up on the left of the strip.",
    },
    {
      question: "What makes the orange shell look moulded and not flat?",
      answer: "It is one SVG path with a lighting filter. The filter blurs the outline into a height map, then lights it from the upper left with a diffuse pass and a specular pass, which rounds every edge and adds the glossy streaks.",
    },
    {
      question: "Which characters can be printed?",
      answer: "Capital letters, digits, and the ampersand, hyphen, plus and slash on the wheel, along with spaces. Anything else typed in the field is removed, lower case is raised to capitals, and the length is capped by `MAX`.",
    },
  ],
  related: ["index-card-checklist-where-a-pencil-draws-each-tick-in-graphite-and-its-eraser-rubs-it-out", "tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away"],
  tags: ["badge", "label", "status", "embossed", "tape", "skeuomorphic", "generator"],
  height: 740,
  section: true,
  interactive: true,
};

export default meta;
