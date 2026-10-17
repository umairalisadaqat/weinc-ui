const meta = {
  slug: "moon-phase-dial-date-picker-with-an-enamel-day-ring-you-turn-and-a-cratered-moon-lit-for-that-night",
  category: "dashboard",
  name: "Moon Phase Dial Date Picker with an Enamel Day Ring You Turn and a Cratered Moon Lit for That Night",
  keyword: "moon phase date picker react",
  title: "React Date Picker with a Moon Phase Dial | We.Inc",
  description: "Date picker built as a moon phase dial: turn the enamel day ring under a lens and a cratered moon is relit for that night. Free React and HTML to copy.",
  intro: "A date picker for anything that happens after dark. The days of the month are painted round a blue enamel ring that you turn with a finger, and whichever day sits under the steel lens at the top is the one chosen. Behind a crystal in the middle hangs the moon as it will look that evening. It is not a picture with a black circle slid across it: the surface is a small height map with dark plains, a couple of hundred craters and one bright rayed crater, and each pixel is lit again whenever the date moves, so crater rims catch the sun along the edge of the shadow the way they do through binoculars. The ring resists leaving a day, drops into the next, and keeps coasting if you flick it. Weekends are lettered in gold. The dial scales down to a 360 pixel phone with the readout and the month arrows below it.",
  useWhen: [
    "Bookings depend on how bright the night is: stargazing sessions, night kayaking, astrophotography workshops, lantern walks.",
    "A fishing, tide or gardening calendar wants the phase beside the date instead of in a separate table.",
    "A campsite or observatory page needs one memorable control in place of a grid of thirty numbered squares.",
    "A watch, jewellery or homeware brand wants an instrument-like picker that matches the product.",
  ],
  customize: [
    "`CAPTION` is the short line above the dial. `HOUR` is the local hour the moon is calculated for, 21 by default.",
    "`BRIGHT` chooses where the dial opens: the next evening at least that far through the lunar month. Use 0.5 to open on the coming full moon.",
    "The enamel is the three stops of the `en` gradient in `paintRing` plus `#1c3690` behind the lens. Deep green works with `#0b2e22`, `#17604a` and `#0e4233`.",
    "Weekend lettering is `#f0c987`. Change the test `wd === 0 || wd === 6` to mark closed days or sold out dates instead.",
    "`AUTOPLAY` set to false stops the dial stepping through nights before anyone touches it.",
  ],
  accessibility: [
    "The dial is one `slider` that reports the day of the month, with a value text giving the full date, the phase name and the percentage lit.",
    "Left and Right change the day and roll over month ends, Page Up and Page Down move a week, Home and End go to the first and last day of the month shown.",
    "Previous month and Next month are separate labelled buttons, and the readout between them is a polite live region.",
    "Reduced motion removes the opening demonstration and the spring: the ring and the moon jump to each new date.",
  ],
  faqs: [
    {
      question: "How accurate is the phase?",
      answer: "It uses the mean length of a lunar month, 29.530589 days, counted from a known new moon in January 2000. The real moon runs a little ahead of or behind that average, so a quarter or a full moon can be out by up to about half a day. That is fine for showing how bright a night will be and not good enough for eclipse timing.",
    },
    {
      question: "How is the moon drawn?",
      answer: "When the component mounts it builds a height map on a disc, stamps craters into it, and turns the slopes into a surface direction for every pixel. Drawing a phase is then one multiply and add per pixel against the direction of the sun, written straight into an ImageData buffer.",
    },
    {
      question: "Is relighting every pixel slow?",
      answer: "The moon is about 190 thousand pixels on a high density screen and the loop runs only while the date is changing. When the ring is at rest nothing is recalculated and the animation frame loop stops.",
    },
    {
      question: "Why is the dark part of the moon still faintly visible?",
      answer: "That is earthshine, sunlight bounced off the Earth onto the night side. It is added as a small blue term so a new moon reads as a dim ball instead of a hole in the sky.",
    },
    {
      question: "How do I get the chosen date out?",
      answer: "The `off` state is the number of days from today, and `date` is the matching Date object built from it. Pass a callback into the component and call it wherever `setOff` is called.",
    },
    {
      question: "Does it show the southern hemisphere view?",
      answer: "As written the waxing moon is lit from the right, which is the northern view. Flip the sign of `lx` in `shadeMoon` and the light comes from the left as it does south of the equator.",
    },
  ],
  related: ["brass-orrery-schedule-viewer-with-stone-planets-on-geared-arms-that-swing-under-a-due-pointer", "lathe-turned-metal-dial-switch-with-detents-and-light-that-stays-put"],
  tags: ["moon phase", "date picker", "dial", "enamel", "canvas", "calendar", "skeuomorphic"],
  height: 780,
  interactive: true,
};

export default meta;
