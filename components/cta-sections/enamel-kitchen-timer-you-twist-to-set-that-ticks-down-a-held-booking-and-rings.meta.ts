const meta = {
  slug: "enamel-kitchen-timer-you-twist-to-set-that-ticks-down-a-held-booking-and-rings",
  category: "cta-sections",
  name: "Enamel Kitchen Timer You Twist to Set That Ticks Down a Held Booking and Rings",
  keyword: "react countdown timer dial",
  title: "React Countdown Timer Dial You Twist to Set | We.Inc",
  description: "Countdown drawn as a wind-up kitchen timer: twist to set the minutes, watch it tick back to zero, then it shakes and rings. Free React and HTML to copy.",
  intro: "A mechanical kitchen timer on a tomato red worktop, counting down how long a reservation is being held. The body is cream enamel with a chrome collar. The white cap carries a printed scale from 0 to 55 and a red bar to grip, and the number under the fixed red mark at the top is the minutes left. When the section appears the cap winds itself to fifteen through a click for each minute, then creeps back in real time with a small kick every second, the way a clockwork escapement lets go. Grab the cap anywhere and turn it to choose another time. Let go on zero, or wait it out, and the timer shudders, throws ring marks off both shoulders and plays a short bell. The time left is also written under the timer in minutes and seconds beside a single button. Reflections on the chrome and the glaze stay with the room while the cap turns, and lean towards the pointer. The timer is 330 pixels across on a phone and 540 on a desktop.",
  useWhen: [
    "A checkout holds seats, a table, a room or a basket for a fixed time and the visitor should feel the clock without being shouted at.",
    "A recipe or cooking page wants a timer that visitors actually set and use.",
    "A booking flow needs one friendly object on the confirmation step instead of a red warning banner.",
    "A food or homeware brand wants a playful centrepiece for a limited order window that has a real end.",
  ],
  customize: [
    "`HOLD_MINUTES` is the time the timer winds to on arrival and `MAX_MINUTES` is the last number a visitor can turn it to.",
    "`GRIP` colours the bar, the index mark and the last five minutes of the scale. The worktop is the `#bf3a22` on the outer element and its gradient.",
    "The words under the timer and on the button are in `copy`. Change `holding` to whatever is being kept, such as Basket reserved.",
    "The bell is off as shipped: set `SOUND` to `true` to add it. The pitch of the bell is the three frequencies in `bell`.",
    "Wire it to a real hold by passing your expiry time into `start`, and call your own release function at the top of `finish`.",
  ],
  accessibility: [
    "The timer is a `slider` from 0 to 55 minutes. Arrow keys add or remove a minute, End winds it fully and Home sets it to zero, which rings it.",
    "Its `aria-valuetext` reads the minutes and seconds left, and the visible countdown is a `role=\"timer\"` element, so it is not announced every second.",
    "The timer is silent as shipped. If you switch the bell on with the `SOUND` constant, it still never plays unless the visitor has turned or keyed the timer first.",
    "Reduced motion skips the winding, the ticking kick and the shake. The cap is redrawn once a second at the right angle.",
  ],
  faqs: [
    {
      question: "Is the countdown accurate if the tab is in the background?",
      answer: "Yes. Setting the timer stores the moment it should ring, and every frame works out the time left from the system clock. A tab that was asleep for a minute wakes up showing a minute less, and rings at once if the moment has passed.",
    },
    {
      question: "Why does it only ring out loud after I touch it?",
      answer: "Browsers block audio that starts without a gesture from the visitor, and a page that makes noise by itself is unwelcome anyway. The shake and the ring marks always show. The sound is added only when the visitor has interacted with the timer.",
    },
    {
      question: "Can visitors set seconds as well as minutes?",
      answer: "The cap clicks to whole minutes, as the real object does. For a finer scale, change `DEG` so one click is worth less time and print more numbers on the cap to match.",
    },
    {
      question: "Is a countdown on a checkout honest?",
      answer: "It is when the hold is real. Use this where your booking system does release the seats or stock at that moment, and set the timer from the server's expiry time. Do not use it to invent a deadline that does not exist.",
    },
    {
      question: "How is the click of each minute done?",
      answer: "While the cap is being turned, a sine curve is taken away from the raw angle, so the cap hangs back as it leaves a minute mark and jumps forward as it reaches the next. The same curve shapes the self-winding at the start.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "film-clapperboard-call-to-action-with-sticks-that-snap-shut-chalked-scene-details-and-a-running-timecode-countdown", "split-flap-station-board-countdown-that-clatters-down-to-a-launch-date"],
  tags: ["timer", "countdown", "kitchen timer", "dial", "canvas", "booking", "skeuomorphic"],
  height: 780,
  section: true,
  interactive: true,
};

export default meta;
