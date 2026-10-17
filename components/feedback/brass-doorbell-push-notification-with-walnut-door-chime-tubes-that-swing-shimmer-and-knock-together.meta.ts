const meta = {
  slug: "brass-doorbell-push-notification-with-walnut-door-chime-tubes-that-swing-shimmer-and-knock-together",
  category: "feedback",
  name: "Brass Doorbell Push Notification with Walnut Door Chime Tubes That Swing, Shimmer and Knock Together",
  keyword: "react notification bell animation",
  title: "React Notification Animation: Doorbell Chimes | We.Inc",
  description: "Press an ivory bell push and brass chime tubes are struck in turn, swing and collide. A canvas notification piece with free React code and an HTML version.",
  intro: "A way to announce that something has arrived, built as a hallway door chime. Three polished brass tubes of different lengths hang on cords below a walnut cover, with a round brass bell push beside them. Press the ivory button and it sinks into its ring, then a hidden hammer hits the short tube, the middle one and the long one a third of a second apart. Each tube is a pendulum with its own period, so they start together and drift out of step until two of them touch, trade speed and ring again. While a tube is sounding its reflections blur from side to side. Their shadows on the blue wall swing with them. Every press also puts the next message in the caption underneath. It ships silent. The scene is 340 by 400 pixels on a phone and 544 by 640 on wider screens.",
  useWhen: [
    "A dashboard or admin screen should mark a new order, booking or message with more ceremony than a red dot.",
    "A landing page for a delivery, hospitality or front desk product wants a hero object that visitors can ring.",
    "A waiting screen needs something calm to watch that also reacts when the awaited thing happens.",
    "You are showing a queue of short alerts one at a time and want each to arrive with a physical cue.",
  ],
  customize: [
    "`callers` is the list of messages, shown one per ring and repeated from the top. `DOOR` is the label in front of them.",
    "`chimes` sets the tubes: change a `length` to retune the swing, or add a fourth entry and a fourth index to `ORDER`. Each extra tube widens the walnut cover by `SPACING`.",
    "`BEAT` is the gap between hammer strokes and `KICK` is their strength. 0.5 and 0.2 give a slow, gentle ding dong.",
    "Set `SOUND` to true to play a short sine note for each stroke using the `note` frequencies. It only ever starts from a press, never from the demo.",
    "`SELF_RING` is how often the piece rings by itself for show, in seconds. Use 0 on a real page so the tubes move only when your event fires.",
  ],
  accessibility: [
    "The bell push is a real `button` with a spoken name, placed exactly over the drawn one. Enter and Space ring it and show the button going in.",
    "The caption is a polite live region. Only rings made by a person change it, so the self-running demo never interrupts a screen reader.",
    "No sound is produced unless you turn `SOUND` on in the code, and then only after the visitor presses the button.",
    "If the visitor has asked for less motion the tubes hang still. A press still advances the message, so nothing is lost.",
  ],
  faqs: [
    {
      question: "How do I ring it from my own code when a notification arrives?",
      answer: "Call the same `ring` function the button uses. It adds one to the count, which selects the message, and tells the canvas to queue the three hammer strokes. Pass your own text in by replacing the `callers` lookup with a state value.",
    },
    {
      question: "Why do the tubes end up knocking into each other?",
      answer: "A longer pendulum swings more slowly. All three are pushed the same way, so after a second or two the short tube is coming back while the long one is still going out. The loop checks the gap between neighbours at the height of the shorter one and, when it closes, swaps most of their speed.",
    },
    {
      question: "Is the sound a recording?",
      answer: "No. With `SOUND` on, each stroke starts two sine oscillators through the Web Audio API, the note and a quieter overtone, and fades them over about two seconds. There are no audio files to host.",
    },
    {
      question: "Can visitors play with the tubes directly?",
      answer: "Yes. Sweep a mouse or a finger across a tube and it is pushed in that direction, harder the faster you go. That makes no entry in the caption, because nobody pressed the bell.",
    },
    {
      question: "How is the wood drawn?",
      answer: "The cover is painted once into a spare canvas: a brown gradient, seventy wavy grain lines from a fixed random seed, a darker falloff at both ends to bow the front, a gloss along the top edge and three dark slots. Each frame copies that image.",
    },
  ],
  related: ["brass-dolly-light-switch-toggle-on-a-fluted-rose-that-snaps-over-and-lights-a-filament-wall-lamp", "round-wall-thermostat-slider-with-a-turning-copper-bezel-and-a-glass-face-that-glows-from-blue-to-amber"],
  tags: ["doorbell", "notification", "chime", "brass", "canvas", "pendulum", "alert"],
  height: 720,
  interactive: true,
};

export default meta;
