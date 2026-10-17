const meta = {
  slug: "pocket-radio-with-a-thumbwheel-tuning-needle-and-backlit-band",
  category: "app-ui",
  name: "Pocket Radio with a Thumbwheel, Tuning Needle and Backlit Band",
  keyword: "react radio tuner dial",
  title: "React Radio Tuner Dial with a Thumbwheel | We.Inc",
  description: "Radio tuner drawn as a pocket transistor set: slide the needle along a backlit band or flick the wheel, and stations pull it in. Free React and HTML code.",
  intro: "A glossy red transistor radio lying on a sage green table, aerial out. Behind a strip of glass in a chrome frame is a lit dial card printed with an FM row and a medium wave row, and a red needle that travels across both. Slide the needle with a finger, or roll the ridged wheel that sticks out of the side of the case. Give the wheel a flick and it coasts on. When the needle drifts close to one of the five marked stations it is drawn onto it, the tuned lamp under the dial comes up, and the loudspeaker cone you can see through six hundred punched holes starts to pump in time. Between stations the lamp flickers and the cone only shivers with hiss. No sound is produced at any point. The power key slides across to put the lamps out. The whole set scales down as one object and fits a 360 pixel screen with room either side.",
  useWhen: [
    "A radio station, podcast network or playlist site wants a channel picker people will play with before they read anything.",
    "You need a slider for a value that has a few preferred stops but should still allow anything in between.",
    "A retro product page, a festival site or a zine wants one bold object on a flat colour and nothing else.",
    "A settings screen in a music app deserves an easter egg that still works as a real control.",
  ],
  customize: [
    "`stations` holds each stop: `at` is its frequency, `name` is what the caption shows and `tempo` is how fast the speaker cone beats while it is tuned.",
    "`SHELL` is three colours for the case from lit to shaded. Try `#f4efe2`, `#e6dfcf` and `#cfc6b2` for an ivory set, and change the two ring offset classes to match.",
    "The pull of a station is the `0.42` megahertz catch range and the `40` spring in the frame loop. Set the range to 0 for a dial with no magnetism.",
    "`s.v *= Math.exp(-2.6 * dt)` is the friction on the wheel after a flick. A smaller number lets it coast further.",
    "The stage is the `bg-[#cdd6cb]` and `radial-gradient` classes on the outer `div`. The aerial and both shadows are painted in the `build` function if you want them gone.",
  ],
  accessibility: [
    "The dial is a `slider` with its range in megahertz, and its value text names the station under the needle or says the needle is between stations.",
    "Left and Right step a tenth of a megahertz. Page Up and Page Down jump to the next or previous station, and Home and End run to the ends of the band.",
    "Power is a `button` with `aria-pressed`. Only the station name is in a live region, so a screen reader is not read every frequency the needle passes. The edge wheel is a pointer-only shortcut and is hidden from assistive technology.",
    "With reduced motion the needle jumps to where it is sent, the wheel does not coast and the cone stays still.",
  ],
  faqs: [
    {
      question: "How does a station catch the needle?",
      answer: "When nothing is holding the dial, the code finds the closest station. If it is within the catch range and the needle is moving slowly enough, a spring force towards that frequency is added to the needle's speed. A fast flick sails straight past, which is how a weighted tuning knob with automatic frequency control feels.",
    },
    {
      question: "Are the speaker holes separate elements?",
      answer: "No. The case is painted once into an off-screen canvas, and every hole is then erased from it with the `destination-out` blend mode. Each frame the cone is drawn first and the case is laid over it, so the cone shows only through the holes at the cost of one image copy.",
    },
    {
      question: "Can I play a real stream when a station locks?",
      answer: "The `here` value in the component is the station under the needle, or null. Watch it in an effect and start or stop an `audio` element there. Browsers only allow playback after a click or key press, so begin from the power key or the first drag.",
    },
    {
      question: "Why is the medium wave row squeezed towards one end?",
      answer: "On a set with a mechanical tuning capacitor the frequency does not rise evenly with the turn of the knob, so the low numbers are spread out and the high ones bunch together. The row is printed on a logarithmic scale to copy that. It is decoration here: only the FM row is tuned.",
    },
    {
      question: "How do I add a sixth station?",
      answer: "Add an object to `stations` with a frequency between 87.5 and 108.5. A red wedge is printed on the dial for it, the keyboard seek keys include it, and the catch range applies to it with no other change. Keep neighbours at least one megahertz apart so their catch ranges do not overlap.",
    },
  ],
  related: ["stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob", "turntable-with-a-tonearm-you-lift-and-drop-onto-a-spinning-record"],
  tags: ["radio", "tuner", "slider", "canvas", "retro", "skeuomorphic", "dial"],
  height: 790,
  interactive: true,
};

export default meta;
