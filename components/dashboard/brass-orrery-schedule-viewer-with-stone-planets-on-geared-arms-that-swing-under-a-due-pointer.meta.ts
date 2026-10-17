const meta = {
  slug: "brass-orrery-schedule-viewer-with-stone-planets-on-geared-arms-that-swing-under-a-due-pointer",
  category: "dashboard",
  name: "Brass Orrery Schedule Viewer with Stone Planets on Geared Arms That Swing Under a Due Pointer",
  keyword: "recurring schedule widget react",
  title: "React Recurring Schedule Widget as an Orrery | We.Inc",
  description: "Schedule widget drawn as a brass orrery: each repeating job is a stone planet, due when it swings under the pointer. React code and HTML, free to copy.",
  intro: "A recurring schedule shown as a tabletop orrery seen from above. Every repeating job is a polished stone ball on its own brass arm, and the length of its cycle sets how fast that arm goes round: the weekly ball laps the plate thirteen times while the quarterly one goes round once. A job falls due at the moment its ball passes under the blued steel pointer at twelve o'clock, and the red jewel in the pointer's foot lights for that day. Grab the plate anywhere and turn it. One lap of your hand moves the date by a week, the silvered year ring creeps round so the pointer always reads the chosen date, and a throw keeps coasting before the nearest day catches it. The four tiles underneath say how many days each job has left and jump the mechanism to its next date. On a phone the instrument shrinks to the screen width and the tiles fold into two rows.",
  useWhen: [
    "A team dashboard has a handful of repeating duties with different rhythms and a table of dates hides how they line up.",
    "A subscription, maintenance or billing product wants to show when each renewal cycle next comes round.",
    "A studio or agency site needs one hero object that explains its working cadence without a paragraph.",
    "A planning screen should let someone scrub forward through the coming weeks and watch deadlines collide.",
  ],
  customize: [
    "`cycles` is the schedule. Each entry has a `name`, a period in days as `every`, any past or future due date as `first`, a `stone` (moonstone, carnelian, malachite or lapis) and the tile colour `dot`.",
    "`TURN` is how many days one lap of the pointer moves. Set it to 1 for fine control or 30 to sweep through months.",
    "`CRUISE` is the self-running speed in days per second before anyone touches it. The first drag, key press or tile click stops it for good, and 0 keeps the mechanism parked on today from the start.",
    "The lacquer colour is the three stops of the `lac` gradient. `#3a1418`, `#24090c` and `#120304` turn the navy field oxblood.",
    "`orbit(i)` spaces the arms 34 pixels apart from a radius of 100. Tighten the gap to 27 if you add a fifth cycle.",
  ],
  accessibility: [
    "The instrument is a focusable `slider` whose value is the number of days from today. Left and Right move one day, Page Up and Page Down a week, Home returns to today.",
    "Its `aria-valuetext` reads the full date followed by every job and the days it has left, so nothing depends on seeing where a ball sits.",
    "Each tile is a real button with a spoken label that states the cycle length and the wait, and the date line is a polite live region.",
    "Under reduced motion the cruise never starts and every jump lands at once with the jewel already set.",
  ],
  faqs: [
    {
      question: "How does a ball know when its job is due?",
      answer: "The angle of arm `i` is the chosen day minus that job's next due day, divided by its period, times a full circle. That expression is zero exactly on a due date, which puts the ball at the top under the pointer, and it grows by one lap for every period that passes.",
    },
    {
      question: "Why does the brass keep its bright streaks while the gears spin?",
      answer: "The wheels, collars and rim are filled with a conic gradient pinned to the lamp direction, and only the tooth outline rotates. Turned brass is the same at every angle around its axis, so a real wheel shows fixed bands of light with teeth running through them.",
    },
    {
      question: "Do the small wheels really mesh with the big one?",
      answer: "They are phased to. The centre wheel has 48 teeth and each pinion has 15 at the same tooth pitch, and the pinion angle is the wheel angle times minus 48 over 15 plus a half tooth offset, so a tooth always sits in a gap where they touch.",
    },
    {
      question: "Can I use monthly cycles that follow the calendar instead of a fixed count of days?",
      answer: "Not with this maths, which assumes even periods. For true calendar months, compute the next due date in your own code and feed the component a period equal to the days between the last and next occurrence.",
    },
    {
      question: "What are the brass pins set into each orbit?",
      answer: "One pin marks one day of that cycle, or one week on cycles longer than 28 days, and the larger pin at the top is the due position. Counting pins from a ball round to the pointer gives the same number the tile shows.",
    },
  ],
  related: ["brass-aneroid-barometer-gauge-with-blued-needle-and-a-set-hand-that-marks-the-target", "bronze-garden-sundial-whose-shadow-points-at-the-time-and-polished-arc-marks-opening-hours"],
  tags: ["orrery", "schedule", "brass", "gears", "canvas", "recurring", "calendar", "skeuomorphic"],
  height: 800,
  interactive: true,
};

export default meta;
