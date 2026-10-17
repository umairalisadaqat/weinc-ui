const meta = {
  slug: "domain-name-plate-marked-out-in-blue-then-hand-stamped-with-steel-punches-and-screwed-down",
  category: "originals",
  name: "Domain Name Plate Marked Out in Blue Then Hand-Stamped with Steel Punches and Screwed Down",
  keyword: "domain name input animation react",
  title: "React Domain Name Input That Stamps Steel | We.Inc",
  description: "Domain field on a canvas: the name is marked out in blue on a steel plate, punched letter by letter and screwed down. Copy the React code or HTML free.",
  intro: "A domain name field whose answer is a made object. A brushed steel plate lies on a workbench. Whatever is in the field under it is marked out on the metal the way a machinist would do it, in thin blue layout ink between two scribed lines. Press Connect and a knurled steel punch comes down from above the camera and hops along the line, one strike per character: each letter is cut into the plate slightly crooked, with a bright lower edge and a raised lip, and the plate jumps under every blow. Blue enamel then runs into the letters from left to right, the ink is wiped away, and two slotted screws spin down into the countersunk holes. The tall band of light on the steel follows the pointer across the grain. Change the name afterwards and the plate turns over to its clean side. The drawing scales with its box, so a phone gets the same plate, only smaller, with the field at full size below it.",
  useWhen: [
    "A site builder asks for a custom domain and wants the moment of connecting it to feel permanent.",
    "A registrar, host or link shortener needs a hero where visitors can try their own name before signing up.",
    "A studio or shop wants to show its web address as a sign on the door.",
    "A settings page confirms a saved name, slug or workspace address with something better than a green tick.",
  ],
  customize: [
    "`names` is the list the demo stamps in turn. `MAX` is the longest name the plate accepts, and `clean` decides which characters are allowed.",
    "`BLUE` is the enamel. The layout ink uses the same hue as `rgba(60,128,236,0.92)` and `rgba(79,152,251,0.5)`, so change those two with it.",
    "The metal is the three greys in `build` (`#e9ecef`, `#cfd3d8`, `#b2b7be`). Warm them toward `#e8d9a8`, `#cdb777` and `#a8904f` for brass, and warm the `steel` stops to match the screws.",
    "`STEP` is the time between strikes. 64 looks like a practised hand, 160 lets you watch each blow land.",
    "Crookedness is the `3` (pixels up and down) and `0.075` (radians of turn) in `layout`. Set both to zero for a machine-engraved plate.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The real control is a labelled text field and a submit button inside a `form`, so Enter connects.",
    "A polite live region under the field says whether the name is marked out, being stamped, or finished, and repeats the name.",
    "Input is reduced to lower case letters, digits, dots and hyphens as you type, and the field keeps a 16 pixel font so phones do not zoom.",
    "With reduced motion there are no punches, no kick and no demo: Connect shows the finished plate at once.",
  ],
  faqs: [
    {
      question: "How are the cut letters drawn?",
      answer: "Each character is painted four times with `fillText`: a wide pale stroke for the metal pushed up around it, a white copy shifted down and right for the lit lower edge, a near black copy shifted up and left for the shadowed edge, and a grey gradient on top for the floor of the cut. The enamel is a fifth pass in blue with a gloss gradient.",
    },
    {
      question: "Why does the plate turn over when I edit the name?",
      answer: "Because stamped steel cannot be corrected. Editing after a strike flips the plate through its thin edge and shows the unmarked back, with the new text marked out in ink. Before Connect is pressed the ink simply redraws as you type.",
    },
    {
      question: "How do I get the name out to check it or save it?",
      answer: "The `text` state always holds the cleaned value of the field. Call your own availability check or save function from `onSubmit`, next to `api.current?.connect()`, and only connect when it succeeds.",
    },
    {
      question: "What is the round thing that hops along the letters?",
      answer: "The punch, seen end on. High above the plate it is close to the camera, so it is drawn large, faint and pushed outward from the centre, with a wide soft shadow thrown down and to the right. As it falls it shrinks onto its letter and the shadow tightens under it.",
    },
    {
      question: "Is it heavy to run?",
      answer: "The brushed texture is drawn once into a second canvas and copied each frame. A frame then costs about a hundred text fills and a few gradients. The loop stops when the plate is off screen or the tab is hidden.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube", "three-folded-design-proofs-dealt-like-a-hand-where-the-chosen-one-unfolds-into-a-full-page"],
  tags: ["domain", "input", "metal", "engraved", "stamp", "canvas", "name plate"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
