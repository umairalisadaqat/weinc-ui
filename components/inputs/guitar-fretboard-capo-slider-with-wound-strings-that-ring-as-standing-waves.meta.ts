const meta = {
  slug: "guitar-fretboard-capo-slider-with-wound-strings-that-ring-as-standing-waves",
  category: "inputs",
  name: "Guitar Fretboard Capo Slider with Wound Strings That Ring as Standing Waves",
  keyword: "react guitar fretboard slider",
  title: "React Stepped Slider as a Guitar Fretboard | We.Inc",
  description: "Stepped slider drawn as a guitar neck: slide a capo between frets and the strings ring as standing waves over a range input. Free React and HTML code.",
  intro: "A stepped slider in the shape of a guitar neck that runs off both sides of the stage. The handle is a capo with a knurled brass screw. Drag it along the rosewood and it lifts slightly, mutes the strings, and on release drops in behind the nearest fret. As it lands the six strings are strummed one after another and each becomes a soft lens of blur, pinned at the capo and widening toward the bridge, with the string itself caught at three instants inside the blur. Thick strings ring longer than thin ones. Brush the pointer across the strings and they sound one at a time. Nothing behind the capo moves, as on a real guitar. The four bass strings carry fine winding marks, the frets are spaced by the true rule so they crowd together up the neck, and pearl dots mark the third, fifth and seventh. On a wide screen the neck lies almost flat. On a phone it turns steep so the same seven frets still fit.",
  useWhen: [
    "A chord, tab or songbook app needs a capo or transpose control and a plain number stepper would lose the meaning.",
    "A guitar lesson page wants to show what moving a capo does while the student reads about it.",
    "A music shop or luthier site wants a hero object that reacts when a visitor runs the mouse over it.",
    "Any setting with five to nine ordered steps where the handle should feel like it clamps into place.",
  ],
  customize: [
    "`stops` lists where the capo may rest. Each entry has the `fret` number, a `name` for the caption and screen readers, and the key that `sounds`. Remove entries to shorten the travel.",
    "`GAUGE` is the width of each string in millimetres from the low E upward, and `WOUND` is how many of them get the bronze winding. Set `WOUND` to 3 for an electric set.",
    "`BRASS` colours the thumbscrew and the focus outline. `#c9ccd1` turns the screw to nickel.",
    "The rosewood is the five-stop gradient on the line marked Fretboard. Swap the browns for `#e7d2a6` to `#c9a86a` and lower the grain alpha for a maple board.",
    "The stage is `bg-[#d5d9ca]` and the radial gradient next to it on the outer div. The two caption lines use dark green text classes that should change with it.",
  ],
  accessibility: [
    "The control is a native `input type=\"range\"` with a label, so arrow keys, Home, End and Page keys all move the capo and assistive technology reads it as a slider.",
    "`aria-valuetext` gives the position in words, for example \"3rd fret, G shapes sound in B flat\", and the caption below is a polite live region.",
    "When the slider has keyboard focus a brass outline is drawn round the capo on the canvas. The drag handle over the capo blocks page scrolling only while a finger is on it.",
    "With reduced motion the capo jumps to its fret and the strings stay still. No sound is made unless `SOUND_ON` is set to true.",
  ],
  faqs: [
    {
      question: "How is the vibrating string drawn?",
      answer: "A string that is ringing has an amplitude that decays over time. The drawing fills the area between its upper and lower extremes with a translucent colour, then strokes the string three times at different phases of the same sine wave with reduced opacity. The eye reads that as motion blur. The shape is half a sine between the capo and the bridge, plus a little third harmonic just after the pluck.",
    },
    {
      question: "Are the fret positions accurate?",
      answer: "Yes. Each fret sits at the scale length times one minus two to the power of minus n over twelve, using a 648 millimetre scale. That is why the gaps shrink as you go up, and why the capo steps get shorter toward the right.",
    },
    {
      question: "Why does the neck change angle on a phone?",
      answer: "The drawing keeps a readable size for the strings and then looks for the flattest angle at which the whole range of seven frets fits inside the box. A wide box gives about eight degrees. A tall narrow one gives more than fifty. All pointer positions are converted back into neck coordinates, so dragging works the same at any angle.",
    },
    {
      question: "Can I tap a fret instead of dragging?",
      answer: "Yes. A tap or click on the fretboard that does not move more than a few pixels sends the capo to that fret space. Moving across the strings without pressing plucks them and leaves the capo where it is.",
    },
    {
      question: "How do I read the value?",
      answer: "The `value` state is the index of the current entry in `stops`, and `stops[value].fret` is the fret number. Lift the state to a parent, or call your own function inside the `onChange` of the range input and inside `select` for drags.",
    },
  ],
  related: ["piano-octave-key-picker-with-real-key-dip-red-felt-and-a-lacquer-fallboard-that-mirrors-the-keys", "rubber-drum-pad-step-sequencer-with-backlit-silicone-pads-that-squash-and-a-running-step-light"],
  tags: ["guitar", "fretboard", "capo", "slider", "strings", "music", "canvas"],
  height: 760,
  interactive: true,
};

export default meta;
