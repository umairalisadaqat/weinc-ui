const meta = {
  slug: "piano-octave-key-picker-with-real-key-dip-red-felt-and-a-lacquer-fallboard-that-mirrors-the-keys",
  category: "toggles",
  name: "Piano Octave Key Picker with Real Key Dip, Red Felt and a Lacquer Fallboard That Mirrors the Keys",
  keyword: "react piano keyboard component",
  title: "React Piano Keyboard Component for Picking a Key | We.Inc",
  description: "Piano key picker on a canvas: an octave in a lacquer case where the chosen key stays held down, over real radio buttons. Free React and HTML code to copy.",
  intro: "Twelve piano keys in a short black case, used as a one-of-twelve selector. Press a key and it travels down the way a real one does: the back stays put under the felt strip, the front drops behind the rail, the sides of the two neighbours come into view and a shadow falls across the sunken top. The chosen key stays down until you pick another, and the one you left is thrown back up and settles. Black keys sink into the whites and their shadows shorten. Above the red felt, the fallboard is polished enough to carry a faint mirror image of every key, and that image dims under the key that is held. Slide a finger or the mouse along the keys and the selection follows it. The picture is one canvas that scales with its box, so on a phone the whole octave fits across the screen with each white key still wider than a fingertip.",
  useWhen: [
    "A music tool needs a root note, key signature or transpose picker and a dropdown of note names would feel like a tax form.",
    "A lesson, tuner or chord chart page wants its main control to be the instrument itself.",
    "Any setting with exactly twelve choices, such as a month, where the two-row layout of an octave makes the options quick to scan.",
    "A landing page for a piano teacher, studio or plugin wants one object visitors can play with while they read.",
  ],
  customize: [
    "`keys` lists the octave from left to right. Each entry has the `label` that is read out, a `sharp` flag that makes it a black key, and a `note` shown in the line underneath.",
    "`FELT` holds the red, green and blue values of the strip that lies across the backs of the keys. `[31, 107, 74]` gives the green baize found on older uprights.",
    "`DIP` is how far the front of a white key travels in millimetres and `SINK` is the same for black keys. 10.5 and 7.5 are close to a real action. Lower both for a shallow modern feel.",
    "The stage is the `bg-[#a9472f]` class and the radial gradient beside it on the outer div. A pale stone such as `#e7e2d8` also suits the black case, with the caption classes changed to a dark text colour.",
    "`DEMO` is the list of key indexes the idle demo steps through. Empty it to keep the keyboard still until someone touches it.",
  ],
  accessibility: [
    "Under the drawing sits a `radiogroup` of twelve transparent buttons, one over each key, each with `role=\"radio\"`, `aria-checked` and a spoken label such as \"E flat major, three flats\".",
    "Only the selected key is in the tab order. Left and Right walk the octave in semitones and wrap at the ends, Home and End jump to C and B.",
    "The caption under the case is a polite live region. Keyboard focus is shown by an amber outline painted on the canvas round the focused key, in the colour set by `RING`, so it follows the key as it moves.",
    "No sound plays unless you set `SOUND_ON` to true, and with reduced motion a key is simply shown down with no travel or rebound.",
  ],
  faqs: [
    {
      question: "How is the key dip drawn without any 3D library?",
      answer: "The keyboard is a small model measured in millimetres, and one function projects any point of it through a fixed camera onto the canvas. Each key has a number from 0 to 1 for how far down it is, and its top is tilted about a pivot behind the fallboard before it is projected. Where two neighbours end up at different heights, the strip of bare wood between them is filled in and a shadow is laid on the lower one.",
    },
    {
      question: "Why does a key bounce when it comes back up but not when it goes down?",
      answer: "Two different springs are used. Going down, the spring is stiff and heavily damped and the key is stopped hard at the bottom, as it would be by the felt punching under it. Coming up, a softer spring with less damping lets it overshoot a little and settle, the way a released key does under its own weight.",
    },
    {
      question: "Can more than one key be held at once, for chords?",
      answer: "Not as written, because it is a single-choice picker. To allow chords, replace the `value` number with a set of indexes, change `role=\"radio\"` to a button with `aria-pressed`, and in the frame loop treat every index in the set as a target of 1.",
    },
    {
      question: "Does it play notes?",
      answer: "It ships silent. A small tone function is already in the file and is switched by the `SOUND_ON` constant at the top. When that is true, each key you press plays a short triangle wave at the correct pitch from middle C upward. The self-running demo never makes a sound.",
    },
    {
      question: "How do I show two octaves?",
      answer: "Add twelve more entries to `keys`. The case is sized from the number of white keys and then fitted into the canvas, so it will draw at once, only smaller. To give it room, raise the canvas width `CW` and change the `aspect-[600/640]` class on the wrapper in the same proportion.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "thumbwheel-number-picker-with-rolling-digit-drums-and-knurled-wheels"],
  tags: ["piano", "keyboard", "music", "selector", "radio group", "canvas", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
