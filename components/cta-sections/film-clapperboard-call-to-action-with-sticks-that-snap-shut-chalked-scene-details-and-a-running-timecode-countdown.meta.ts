const meta = {
  slug: "film-clapperboard-call-to-action-with-sticks-that-snap-shut-chalked-scene-details-and-a-running-timecode-countdown",
  category: "cta-sections",
  name: "Film Clapperboard Call to Action with Sticks That Snap Shut, Chalked Scene Details and a Running Timecode Countdown",
  keyword: "react clapperboard countdown",
  title: "React Clapperboard Countdown Call to Action | We.Inc",
  description: "Clapperboard on a canvas: the stick snaps shut, chalk dust jumps and a timecode window counts down frame by frame. Copy the React code or the HTML free.",
  intro: "A film slate photographed from above on a sheet of saffron paper. The board is black with hand painted white rules, printed labels for production, roll, scene, take, director, camera and date, and every value written in chalk with the grit and eraser haze that chalk leaves behind. A steel hinge joins two striped sticks. The top one is held open at an angle, then falls under its own weight, bounces once on the lower stick, shakes the whole board and knocks a line of dust loose. From that moment a red seven segment window in the bottom corner counts down in hours, minutes, seconds and frames. When it reaches zero the digits blink, the stick lifts, the take number is rubbed out and the next one is written in. One dark pill link sits in the corner for the action you want from the visitor. On a phone the slate shrinks to fit the width and the stub of chalk beside it is left out.",
  useWhen: [
    "A film festival, premiere or screening page needs one object that says cinema and carries a single booking link.",
    "A video production studio wants a closing block on its showreel page that visitors can play with before they get in touch.",
    "A course or webinar starts at a set moment and you want a short, theatrical countdown instead of a row of number boxes.",
    "A product launch video is about to go live and the page needs something to press while people wait.",
  ],
  customize: [
    "The `SLATE` object holds every chalked value. Change `production`, `roll`, `scene`, `director`, `camera` and `date`, and set `take` to the number the slate starts on.",
    "`COUNT_FROM` is the length of the countdown in seconds and `FPS` is the frame rate shown in the last two digits. Use 25 or 30 if that is what you shoot at.",
    "`OPEN` is the angle the top stick rests at and `FIRST_CLAP_MS` is how long the demo waits before its first clap. The number 2600 inside `tick` is the pull that drops the stick: raise it for a harder snap.",
    "The table colour is the three stops of the radial gradient in `build` plus `bg-[#deaa3c]` on the section. Swap them for a pale grey or a deep green and change the two ring offset classes to match.",
    "`LED` colours the timecode digits and their glow. The link text and its `href` are in the last `a` element.",
  ],
  accessibility: [
    "The canvas is hidden from assistive technology. A transparent `button` lies over the slate, so Enter or Space claps the sticks, and its label reads out the production, scene and current take.",
    "A polite live region announces when a take is marked and when the sticks reopen. The running digits are never announced, because they change twenty four times a second.",
    "With reduced motion nothing falls or shakes and the loop does not run. Pressing the slate switches between sticks shut and sticks open with the next take number.",
    "Caption text is dark brown on the saffron ground and the link is cream on near black, both above 4.5 to 1. Keep that in mind if you change the table colour.",
  ],
  faqs: [
    {
      question: "How does the stick fall instead of just rotating?",
      answer: "Its angle and its turning speed are two numbers updated every frame. While it drops, a constant pull is added to the speed, so it accelerates the way a hinged bar does. When the angle reaches zero the speed is reversed and cut to about a fifth, which gives one small bounce before it settles.",
    },
    {
      question: "Why does the handwriting look like chalk and not like a font?",
      answer: "Each word is drawn twice with a small offset on a scratch canvas, then hundreds of tiny dots and short scratches are erased from it before it is stamped on the board. Soft pale ellipses are painted under the writing as eraser haze, thickest in the take box where the number keeps changing.",
    },
    {
      question: "Which font is used for the chalk?",
      answer: "No font is downloaded. The list in `CHALK_FONT` starts with a chalk style face that ships with macOS and iOS, then falls back to common handwriting faces on Windows and Android, and finally to the browser's generic cursive. The grit effect is applied to whichever one is found.",
    },
    {
      question: "Can the countdown run to a real date?",
      answer: "Yes. In `draw`, the value `rem` is the number of seconds left. Replace it with the difference between your date and `Date.now()` divided by 1000, and fill the first four digits with hours and minutes instead of the fixed zeros in `txt`.",
    },
    {
      question: "Does it make a clap sound?",
      answer: "No. The piece is silent, which is what most pages need. If you want a sound, play a short audio buffer inside the `clap` function, and only after the visitor has pressed the slate at least once, since browsers block audio before a click.",
    },
  ],
  related: ["cinema-marquee-headline-with-letter-tiles-that-slide-along-rails-and-chasing-bulbs", "stereo-vu-meter-pair-with-needle-ballistics-backlit-faces-and-drive-knob"],
  tags: ["clapperboard", "film slate", "countdown", "timecode", "canvas", "cinema", "chalk"],
  height: 700,
  section: true,
  interactive: true,
};

export default meta;
