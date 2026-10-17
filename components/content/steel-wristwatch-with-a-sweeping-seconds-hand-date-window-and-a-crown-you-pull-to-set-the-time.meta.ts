const meta = {
  slug: "steel-wristwatch-with-a-sweeping-seconds-hand-date-window-and-a-crown-you-pull-to-set-the-time",
  category: "content",
  name: "Steel Wristwatch with a Sweeping Seconds Hand, Date Window and a Crown You Pull to Set the Time",
  keyword: "react analog watch face",
  title: "React Analog Watch Face with a Working Crown | We.Inc",
  description: "Wristwatch on a canvas: a sunburst dial, a sweeping seconds hand, a live date window and a crown you pull out to set the time. Free React and HTML to copy.",
  intro: "A steel watch on a tan leather strap, laid flat on a pale grey surface and running on your device's clock. The orange seconds hand moves eight small steps a second, which is how a mechanical movement sweeps, and the window at three o'clock shows today's date. The blue dial is a sunburst: its bright rays follow the light instead of the hands, so as the pointer crosses the watch the rays swing round, the polished bezel changes and a pale band slides over the sapphire glass. Click the crown and it springs out on its stem, the seconds hand stops, and dragging in circles over the dial winds the minute hand forwards or backwards, with the hour hand and the date following. Click the crown again and the watch runs on from the time you chose. The same time is written in digits below, with the day and month. On phones the watch shrinks to fit the width and the strap fades out at both ends.",
  useWhen: [
    "A watch, jewellery or accessories shop wants a hero object that is alive when the page opens.",
    "An about or contact section shows the studio's local time in a way people look at twice.",
    "A product page explains how something mechanical is adjusted and wants visitors to try it.",
    "A portfolio needs a centrepiece that proves canvas drawing skill without any image files.",
  ],
  customize: [
    "`DIAL_DARK` and `DIAL_LIGHT` are the two ends of the sunburst. `#0f2a1d` with `#3f8f63` gives a green dial, `#1a1a1c` with `#77777c` a grey one.",
    "`STRAP` is the leather colour. `#1b1b1d` reads as black calfskin; the stitching colour is the `#efe2c8` stroke inside `strap`.",
    "`ACCENT` paints the seconds hand. `BEATS` is its steps per second: 1 turns it into a quartz tick, 8 is a common mechanical rate.",
    "To show another city, start `offset` in the `live` ref at that city's difference from the visitor in milliseconds, for example `2 * 3600000`.",
    "The two small lines of dial text are plain strings next to the comment about the emblem. Replace them with your own wording or remove them.",
  ],
  accessibility: [
    "The crown is a real button with `aria-pressed` and a label that changes between pull out and push in, so its state is spoken.",
    "While the crown is out the dial becomes a focusable slider: arrow keys move one minute, Page Up and Page Down one hour. It leaves the tab order again when the crown goes in.",
    "The time and date are real text in a `time` element under the watch, and the status beside the date is a polite live region.",
    "Reduced motion removes the crown spring, the drifting light and the sweep. The hands then update twice a second.",
  ],
  faqs: [
    {
      question: "Why does the seconds hand stop when the crown is pulled?",
      answer: "Watchmakers call it hacking: pulling the crown halts the movement so the time can be set to the second. Here the displayed time is frozen in a ref while the crown is out, and pushing it in stores the difference from the real clock so the watch keeps running from there.",
    },
    {
      question: "How does the sunburst dial work?",
      answer: "It is a conic gradient with sixteen uneven stops centred on the dial, painted once in colour and once as a white glaze. The gradient's start angle is the light angle, so moving the light rotates the rays while the printed track, markers and hands stay where they are.",
    },
    {
      question: "Does the date change if I wind past midnight?",
      answer: "Yes. Winding edits a full timestamp, not just an angle, so every drawn value comes from one `Date`. Turn the hands through twelve at night and the window shows the next day, and the text below agrees.",
    },
    {
      question: "What are the reflections on the glass made of?",
      answer: "Three layers clipped to the crystal: a linear gradient band with two hard edges that slides with the light, a soft violet bloom on the opposite side like an anti-reflective coating, and two short arcs at the rim. None of them use an image.",
    },
    {
      question: "Is there a maker's name on the dial?",
      answer: "No. A small two-tone lozenge stands where a logo would be, so you can ship it without borrowing anyone's mark. Draw your own text at the same spot with `fillText` if you have a brand.",
    },
  ],
  related: ["mechanical-stopwatch-with-a-crown-you-press-a-ticking-sweep-hand-and-a-flyback-reset", "brass-pendulum-wall-clock-that-beats-once-a-second-in-true-time-and-throws-a-moving-shadow"],
  tags: ["watch", "analog clock", "canvas", "sunburst", "date window", "skeuomorphic", "live time"],
  height: 780,
  interactive: true,
};

export default meta;
