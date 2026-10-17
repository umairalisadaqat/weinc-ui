const meta = {
  slug: "bronze-garden-sundial-whose-shadow-points-at-the-time-and-polished-arc-marks-opening-hours",
  category: "content",
  name: "Bronze Garden Sundial Whose Shadow Points at the Time and Polished Arc Marks Opening Hours",
  keyword: "opening hours component react",
  title: "React Opening Hours Component as a Sundial | We.Inc",
  description: "Opening hours drawn as a bronze sundial: the shadow falls on the current hour and a polished arc shows when you are open. Free React and HTML code to copy.",
  intro: "Opening hours shown on a garden sundial seen from straight above. A weathered bronze plate sits on a round limestone plinth, cut with hour lines from five in the morning to seven in the evening and Roman numerals around the edge. The fin in the middle throws a triangular shadow whose leading edge lies on the present time, worked out from the visitor's own clock. The stretch of the numeral ring that covers today's opening hours is polished bright, and the hours either side are left dark, so one look answers whether the shadow has reached the bright part yet. Move a mouse around the plate, or drag on a touch screen, and the sun moves with you: the shadow swings, the highlights on the rim and the stone turn to follow it, and the line underneath says whether the place is open at that hour. Seven small buttons switch the arc to another day of the week. Every nine seconds a cloud passes and the shadow goes soft for a moment. On a phone the dial is 330 pixels wide and the day buttons fit in one row.",
  useWhen: [
    "A cafe, garden centre, gallery or farm shop wants its hours to be the most memorable thing on the contact page.",
    "A footer or visit section needs to answer the question of being open right now without a table.",
    "A venue with different hours on different days wants visitors to check a day with one tap.",
    "An outdoor, heritage or botanical brand is looking for a centrepiece that matches its setting.",
  ],
  customize: [
    "`week` holds the hours, Monday first, as whole hours on a 24 hour clock. Give a closed day the same `open` and `close` and its arc disappears.",
    "`MOTTO` is engraved along the lower rim and `PLACE` is used in the labels read by screen readers.",
    "`LATITUDE` changes how the hour lines fan out. At 60 they spread wide, at 30 they bunch towards noon. `FIRST` and `LAST` set which hours are cut into the plate.",
    "The metal is the three colour stops inside `bronze`. Swap them for greys to get pewter, and change the `rgba(72,150,128, ...)` verdigris tint to suit.",
    "The stage colour is the `#1f3a2b` on the outer element. Use the same value in the focus ring offset classes so the ring keeps its gap.",
  ],
  accessibility: [
    "The dial is a `slider` from 5 to 19. Left and Right move the previewed time by a quarter of an hour, and Home or Escape returns to the present.",
    "Its `aria-valuetext` reads the day, the time and the verdict, for example Tue 14:30, Open until 17:00, so nothing depends on seeing the shadow.",
    "Each day is a button with `aria-pressed` and a full label such as Thu, 9:00 to 19:00.",
    "Reduced motion removes the spring and the passing cloud. The shadow is drawn in place and refreshed every twenty seconds.",
  ],
  faqs: [
    {
      question: "Is the shadow in the right place, or is it decoration?",
      answer: "The hour lines use the formula for a horizontal sundial: the tangent of the line's angle is the tangent of the hour angle times the sine of the latitude. The shadow's edge is laid along the line for the current time, so reading it against the numerals gives the same answer as the text.",
    },
    {
      question: "What does it show at night?",
      answer: "A sundial has nothing to say after dark. Outside the engraved hours the shadow rests on the next opening time and the line under the dial says so in words, next to the real time and whether the place is closed.",
    },
    {
      question: "Does it allow for time zones or daylight saving?",
      answer: "It reads the visitor's local clock and treats the numbers in `week` as local times. For a single shop that is nearly always what you want. If your visitors are spread across zones, convert the current time to the shop's zone before it reaches `nowHours`.",
    },
    {
      question: "Can a day have two opening periods, such as lunch and dinner?",
      answer: "Not as written. Each day has one `open` and one `close`. To add a break you would draw a second polished arc in the frame loop and extend `verdict` to check both ranges.",
    },
    {
      question: "Why do the highlights move when I move the shadow?",
      answer: "The shadow direction is the opposite of the sun's direction, so the same angle drives the bright edge of the stone, the lit side of the fin and the bands of light on the bronze. Keeping all of them tied to one value is what makes the plate read as metal under a moving light.",
    },
  ],
  related: ["lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put", "chalkboard-cafe-menu-where-a-felt-eraser-wipes-the-prices-and-chalk-writes-new-ones", "clocking-in-card-rack-team-section-where-a-time-card-slides-out-with-a-stapled-portrait-and-is-stamped-with-the-hour"],
  tags: ["opening hours", "sundial", "bronze", "canvas", "shadow", "skeuomorphic", "business hours"],
  height: 820,
  section: true,
  interactive: true,
};

export default meta;
