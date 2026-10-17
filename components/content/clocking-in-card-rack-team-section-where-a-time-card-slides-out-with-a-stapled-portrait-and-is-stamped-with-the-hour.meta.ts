const meta = {
  slug: "clocking-in-card-rack-team-section-where-a-time-card-slides-out-with-a-stapled-portrait-and-is-stamped-with-the-hour",
  category: "content",
  name: "Clocking in Card Rack Team Section Where a Time Card Slides out with a Stapled Portrait and Is Stamped with the Hour",
  keyword: "tailwind team section with portraits",
  title: "Tailwind Team Section: Time Card Rack | We.Inc",
  description: "Team section of manila time cards in a steel rack: pull one and it slides out with a stapled portrait and the hour stamped in. Free React and HTML code.",
  intro: "A hammered green steel card rack hangs on an oxide red wall with six manila time cards tiered in its pockets, so only the top strip of each shows: a coloured band, a name in typewriter capitals and a job. One card is already out, enlarged and slightly crooked beside the rack. It carries a colour portrait stapled at two corners, a line for department, starting year and week, and a printed grid of days with clocking times struck in violet ink, each a little off square. A moment after a card comes to rest the real time on the visitor's own clock is stamped into today's row. Choosing another card sends the first one back up, over and down into its pocket while the new one lifts and slides out from behind the cards in front of it. On a phone the rack and the card shrink together and two arrow buttons walk through the staff.",
  useWhen: [
    "A bakery, workshop, cafe or factory shop wants its people page to look like the wall by the back door.",
    "Six to eight staff need a name, a role and one good photograph each, with only one person in focus at a time.",
    "A brand with a printed, utilitarian look (manila, typewriter capitals, rubber stamps) needs a team block that matches its packaging.",
    "A shift based business wants to hint at opening hours and early starts without writing a paragraph about them.",
  ],
  customize: [
    "Staff live in the `staff` array, top pocket first. `band` is the coloured strip across the head of the card, `week` holds three pairs of in and out times, and `dept` and `since` fill the line under the portrait.",
    "`TIER` is how much of each card shows in the rack and `LIP` is the steel edge of a pocket. Raising `TIER` to 70 gives room for a third line of text on the visible strip.",
    "`SHOW_X`, `SHOW_Y` and `SHOW_SCALE` place and size the card that is out. `LIFT` is how far a card rises before it is allowed to move sideways.",
    "The wall is `bg-[#a8452f]` with a radial gradient, the card stock is `#e7d2a0`, the printed rules use `RULE` and the stamped times use `INK`.",
    "To stop stamping the visitor's local time, replace the `clock()` call with a fixed string such as the hour your shop opens.",
  ],
  accessibility: [
    "The rack is a list of six cards, and each card has a button with `aria-pressed` whose label gives the name, the job and whether the card is already out.",
    "The clocking grid is a real table with column and row headers, so the days and times are read in order by a screen reader.",
    "Focus on a card in the rack lifts it a few pixels, the same response a mouse gets, and the caption under the scene is a polite live region that announces the person now showing.",
    "With reduced motion the cards swap places with no travel, the stamp appears without its strike, and the automatic cycle is switched off.",
  ],
  faqs: [
    {
      question: "How does a card come out from behind the others without clipping tricks?",
      answer: "The cards and pocket lips are drawn in document order from the top pocket down, so each card is naturally painted under everything in front of it. A card leaving the rack keeps that place in the order while it rises by `LIFT` and travels sideways, which is why you see it pass behind the lower cards and the front panel. It only grows once it is clear of the rack.",
    },
    {
      question: "Where does the stamped time come from?",
      answer: "From `new Date()` in the browser at the moment the card settles, formatted as hours and minutes. It is stored per card in the `stamps` object, so a card pulled a second time keeps the time it was first struck with, as a real card would.",
    },
    {
      question: "Why do the printed times look uneven?",
      answer: "Each one is passed through a small `wobble` function that turns its position on the card into a fixed offset, rotation and opacity, and a blurred copy sits just behind it like a second strike. The values are derived, not random, so the card looks identical on every render and on the server.",
    },
    {
      question: "How is the cut corner made?",
      answer: "The stock has a `clip-path` polygon that removes an eighteen pixel triangle from the bottom left, the notch a time recorder uses to know which way round a card is. Because a clip removes box shadows too, the shadow is a `drop-shadow` filter on the wrapper and follows the cut.",
    },
    {
      question: "Can the rack hold more than six cards?",
      answer: "Yes. Every extra entry adds one pocket and the rack grows by `TIER`. Past eight, raise `SCENE_H` by the same amount or lower `TIER`, and check that `SHOW_Y` plus the enlarged card height still clears the bottom of the rack.",
    },
  ],
  related: ["staff-locker-wall-team-section-with-steel-doors-that-swing-open-on-a-taped-portrait-and-a-shelf-of-belongings", "photo-booth-team-strips-that-feed-out-of-chrome-slots-in-four-clunks-then-hang-and-swing-on-the-panel"],
  tags: ["team", "about", "time card", "portrait", "stamp", "rack", "object"],
  height: 730,
  section: true,
  interactive: true,
};

export default meta;
