const meta = {
  slug: "turntable-with-a-tonearm-you-lift-and-drop-onto-a-spinning-record",
  category: "app-ui",
  name: "Turntable with a Tonearm You Lift and Drop onto a Spinning Record",
  keyword: "react turntable record player",
  title: "React Turntable Record Player with a Tonearm | We.Inc",
  description: "Record player seen from above on a canvas: drag the headshell to lift the tonearm, drop it onto a track and the platter spins up. Free React and HTML code.",
  intro: "A record deck seen from straight above, on a pale powder-coated plinth. A black pressing with five bands of groove turns on an aluminium platter with strobe marks round its rim, and a straight tonearm with an orange cartridge rides the first track. Take the headshell and the arm rises off the vinyl, its shadow sliding away from it, then follows your hand in an arc round its pivot. Let go over the record and a cueing damper sets the stylus down slowly where you left it. Let go past the edge and the arm swings home to its rest while the platter coasts to a stop. The start button and the 33 and 45 key work too, and the motor takes a moment to bring the platter up to speed. It makes no sound. Left alone it steps through the tracks so the page is never still. The plinth scales as one piece and stays fully usable at 360 pixels.",
  useWhen: [
    "A record shop, label or listening bar wants its landing page to open on the object itself.",
    "An album or mix page needs a track picker that feels like putting a needle down.",
    "You want a playful hero for a music app where the only copy is the name of the song.",
    "A portfolio piece or case study about audio hardware needs something visitors can handle.",
  ],
  customize: [
    "`tracks` is the list of titles. The grooves are divided into that many bands and the arm keys step through them, so four or seven entries work as they are.",
    "`record.label` and `record.ink` colour the paper label and its print. `ACCENT` colours the cartridge, the three lamps and the focus ring.",
    "`SIDE_SECONDS` is how long the stylus takes to travel from the first groove to the run-out. Set it to the real length of your audio if you connect a player.",
    "The plinth colour is the three stops of the `coat` gradient. For a black deck use `#2a2b2e`, `#1d1e21` and `#141416`, and darken the stage classes on the outer `div` to match.",
    "Arm feel lives in the frame loop: `46` and `12.5` are the spring and damping of the swing, and `0.35 + s.h * 2.2` is how slowly the cueing damper lets the stylus down.",
  ],
  accessibility: [
    "The drawing is hidden from screen readers. Start and speed are real buttons with `aria-pressed`, and the tonearm is a `slider` whose value text is the track title or the armrest.",
    "With the tonearm focused, Right or Up moves the stylus one track towards the label, Left or Down moves it back out, Home returns it to the rest and End goes to the last track.",
    "The caption is a polite live region that says whether the deck is playing, cueing or stopped and which title is under the stylus.",
    "Under reduced motion nothing spins or glides: the arm is redrawn directly at its new position and the automatic tour of the tracks is switched off.",
  ],
  faqs: [
    {
      question: "How does the stylus land on the right track?",
      answer: "The arm is a fixed length swinging about a fixed pivot, so the distance from stylus to spindle follows from the arm angle by the cosine rule. `rOf` does that sum and `phiOf` does the reverse. A track is then a range of radii, the same way it is on vinyl.",
    },
    {
      question: "Why does the shine on the record not rotate?",
      answer: "Grooves are circles round the spindle, so a spinning record looks the same at every angle except for its label. The two bright wedges come from the lamp and stay put. The code adds a small sway tied to the rotation, which reads as the slight warp that pressed vinyl always has.",
    },
    {
      question: "Can it control a real audio element?",
      answer: "Yes. `report` runs whenever the state or track changes, so call `audio.play()` or `audio.pause()` there and set `currentTime` from the track index. To make the arm follow playback, set `s.target` from `audio.currentTime` in place of the fixed crawl in the frame loop.",
    },
    {
      question: "What makes the arm look lifted?",
      answer: "Three things change together as it rises: the whole arm is drawn about two percent larger, its shadow moves further down and right, and the shadow gets softer. A top view has no other way to show height, and the eye reads that combination without being told.",
    },
    {
      question: "Does dragging the arm scroll the page on a phone?",
      answer: "No. Only the round handle over the headshell captures touches, with `touch-none` set on it, so the rest of the deck still lets the page scroll under a finger.",
    },
  ],
  related: ["stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["turntable", "vinyl", "record player", "tonearm", "canvas", "music", "drag"],
  height: 720,
  interactive: true,
};

export default meta;
