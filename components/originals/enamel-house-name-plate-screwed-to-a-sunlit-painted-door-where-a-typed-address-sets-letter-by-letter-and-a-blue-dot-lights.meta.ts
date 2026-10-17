const meta = {
  slug: "enamel-house-name-plate-screwed-to-a-sunlit-painted-door-where-a-typed-address-sets-letter-by-letter-and-a-blue-dot-lights",
  category: "originals",
  name: "Enamel House Name Plate Screwed to a Sunlit Painted Door Where a Typed Address Sets Letter by Letter and a Blue Dot Lights",
  keyword: "react webgl domain name input animation",
  title: "Enamel Door Plate Domain Input in WebGL | We.Inc",
  description: "Free React and WebGL domain input: each typed letter is set into a white enamel plate on a sunlit black door, then a brass screw drives home and a blue dot lights.",
  intro: "A domain name field shown as a white enamel name plate on a front door in late sun. The door is gloss black with raised and fielded panels, flanked by painted architraves and lime-washed plaster, and leaves from a tree out of shot throw a slow moving dapple across it. Type into the pill field below the headline and every letter lands in the enamel like a bead of wet paint: it spreads a little past its shape, draws back, and cures from a wet shine to satin while the rest of the word slides over to stay centred. While you are typing, the right hand screw is backed out and the plate hangs a fraction off true from the left one, knocking gently each time a letter lands. Pause, press Enter or press the button and the brass screw spins home, the plate is pulled level and tight against the paint, and a small blue enamel dot at the end of the name lights and glows on the door. On a phone the words sit above the door, the plate is centred and the field stays at the bottom.",
  useWhen: [
    "The step in a site builder where someone picks the address for their new site and should feel it become theirs.",
    "A custom domain settings page that deserves one memorable picture instead of a plain text box.",
    "A landing section for a domain or hosting product where the field itself is the hero.",
    "An onboarding screen that asks for a workspace or shop name and shows it back as something solid.",
  ],
  customize: [
    "`NAMES` holds the names the self-playing demo sets on the plate, and `SUFFIX` the ending that always stays on it.",
    "`SETTLE_AFTER` is how many seconds after the last key the screw is driven home without pressing anything.",
    "The paint colour of the door is the `alb` value in the door branch of `planeShade`; try a deep green or an oxblood for a different street.",
    "`gL` in the shader is the direction of the sun, and the `zone` line inside `leaves` decides which part of the door the leaf shadows fall on.",
    "`fontOf` sets the weight of the name and of the suffix, and `sizeT` in `layout` caps how tall the lettering may grow on short names.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. The field is a real text input with a label that names the suffix, and the button is a real submit button whose text says whether the plate is fixed.",
    "A polite live region announces the full address once the plate is screwed down, not on every key press.",
    "With reduced motion the letters appear without the landing bead, the plate never swings and the screw is shown home as soon as typing stops.",
    "Without WebGL 2 a still built from plain elements shows the door, the plate, the lettering you typed and the dot, and the field keeps working.",
  ],
  faqs: [
    {
      question: "How does typed text get into a ray marched scene?",
      answer: "The letters are drawn into a small 2D canvas each frame they move, and a blurred copy of that canvas becomes a height map. Both are uploaded as textures and the shader reads them on the face of the plate, using the blurred one to bend the surface normal so the enamel letters catch the sun on their shoulders.",
    },
    {
      question: "Can I limit what people can type?",
      answer: "Yes. The `clean` helper lowercases the value and strips anything that is not a letter, a digit or a hyphen, and `MAX_NAME` caps the length. Add your own availability check where the form is submitted before calling `fix`.",
    },
    {
      question: "Does it need a 3D library?",
      answer: "No. It uses the plain WebGL 2 API inside a React effect: one fragment shader for the door, the plate and the screws, and a second short pass for focus blur, a soft glow and grain.",
    },
    {
      question: "Why does the plate swing while I type?",
      answer: "The plate is held by its left screw only until the name is settled. A spring keeps it hanging slightly off level, each landing letter gives it a small push, and driving the right screw home switches to a stiff spring that pulls it straight.",
    },
    {
      question: "How heavy is it to run?",
      answer: "The render size is capped, the loop lowers its resolution when frames run slow, the lettering texture is only redrawn while letters move, and drawing stops when the section scrolls out of view or the tab is hidden.",
    },
  ],
  related: [
    "domain-name-plate-marked-out-in-blue-then-hand-stamped-with-steel-punches-and-screwed-down",
    "round-blue-enamel-wall-plaque-unveiled-from-under-a-linen-cloth-whose-corner-is-carried-across-to-the-other-peg-and-left-hanging-in-folds",
    "painted-shop-doorway-that-follows-typed-edits-with-a-roller-that-repaints-the-door-a-sign-that-is-rehung-and-an-opening-clock-that-moves",
  ],
  tags: ["webgl", "domain", "input", "enamel", "door", "ray marching", "originals"],
  height: 720,
  section: true,
  interactive: true,
};

export default meta;
