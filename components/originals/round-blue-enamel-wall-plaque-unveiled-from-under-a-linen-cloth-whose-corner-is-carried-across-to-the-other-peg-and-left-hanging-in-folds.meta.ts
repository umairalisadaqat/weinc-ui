const meta = {
  slug: "round-blue-enamel-wall-plaque-unveiled-from-under-a-linen-cloth-whose-corner-is-carried-across-to-the-other-peg-and-left-hanging-in-folds",
  category: "originals",
  name: "Round Blue Enamel Wall Plaque Unveiled from Under a Linen Cloth Whose Corner Is Carried Across to the Other Peg and Left Hanging in Folds",
  keyword: "unveil reveal animation cloth react",
  title: "React Cloth Unveil Reveal Animation in WebGL | We.Inc",
  description: "Unveiling animation: a simulated linen cloth is lifted off one brass peg and hung on the other to uncover a blue enamel plaque. Free React and HTML code.",
  intro: "An unveiling on a plaster wall. A round plaque in blue vitreous enamel, lettered in white with a bakery's name, the words now open online and its address round the foot, sits between two brass pegs. A square of pale linen with a stitched hem hangs from those pegs and hides it. Press the button or click the cloth: the corner with the blue cord is lifted off its peg, carried across in front of the plaque and hooked onto the other one, and the cloth follows, sweeps off the enamel and settles in folds at the side with the cord and its brass acorn swinging. Cover it again and the corner travels back. The cloth is nine hundred points worked out in the browser and painted with WebGL as woven linen, with a plain canvas fallback and a canvas shadow on the wall. The plaque is one SVG with text set on two arcs. On small screens the wall scales to fit and the button keeps its size.",
  useWhen: [
    "A launch page that wants the visitor to do the unveiling.",
    "The confirmation step after publishing, where the new address deserves a moment on its own.",
    "A portfolio entry that keeps a new project covered until it is clicked.",
    "An awards or milestone section where a name is revealed on a plaque.",
  ],
  customize: [
    "The lettering is the `plaque` object: `name` runs round the top arc, the two `lines` sit in the middle and `address` runs round the foot.",
    "The enamel colour is the five stops of `enamel-plaque-unveiled-field`; the white is `#F6F4EF` on the group that holds the ring and the text.",
    "`COLS` and `ROWS` set how fine the cloth is, `HOOK_L`, `HOOK_R` and `HOOK_Y` where its pegs are, and `FULL` how much wider the cloth is than the gap between them.",
    "The linen is the last `mix` in `FRAG`: the first colour is its deepest shadow and the second its lit face. `threads` sets how fine the weave is, and `LIGHT` is the direction of the lamp.",
    "`CARRY` is how long the corner takes to cross. In `link`, `0.18` is how much the cloth resists creasing, and the default `drag` of `0.991` in `step` is the air.",
  ],
  accessibility: [
    "A real `button` with `aria-pressed` covers and uncovers the plaque. Clicking the cloth is a pointer shortcut for the same thing and is hidden from assistive technology.",
    "The plaque is an SVG with `role=\"img\"` whose label reads out everything written on it, and a polite live region says whether it is covered.",
    "With reduced motion nothing travels or swings: the cloth is worked out in one go and drawn once in its resting place, either over the plaque or hanging beside it.",
  ],
  faqs: [
    {
      question: "Is the cloth really simulated or is it a video?",
      answer: "It is simulated in the browser. Each point remembers where it was a moment ago, gravity moves it, and eight passes over the links pull neighbours back to their proper distance. The wall and the raised disc of the plaque push points forward so the cloth lies over them.",
    },
    {
      question: "What happens where WebGL is not available?",
      answer: "The same mesh is painted on the 2D canvas underneath, one square at a time from the wall outwards, each filled with a gradient between the shade of its left and right corners. The folds stay readable; the weave and the stitching are left out.",
    },
    {
      question: "Does the loop run all the time?",
      answer: "No. When the fastest point has been almost still for forty frames the loop stops, and it starts again on the next press. It also pauses off screen and in a hidden tab.",
    },
    {
      question: "Why does it open already unveiled?",
      answer: "So the first thing a visitor sees is the plaque. The cloth starts folded in half on the far peg, which is close to where it comes to rest, and is given a short settle before the first frame. The demo then covers the plaque and unveils it. Set `FIRST` very high to leave it alone.",
    },
    {
      question: "How do I tie it to a real publish step?",
      answer: "Call `api.current?.set(true)` when your own request succeeds and `set(false)` to cover the plaque again. `live` is updated at the start of each move.",
    },
  ],
  related: [
    "domain-name-plate-marked-out-in-blue-then-hand-stamped-with-steel-punches-and-screwed-down",
    "velvet-stage-curtain-dialog-that-draws-apart-on-a-pull-cord-with-pleats-that-gather-and-sway",
    "brass-knife-switch-on-a-slate-base-that-closes-with-a-spark-and-lights-four-opal-lamps-spelling-live",
  ],
  tags: ["publish", "launch", "unveil", "reveal", "cloth", "physics", "enamel", "plaque", "webgl"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
