const meta = {
  slug: "rolling-odometer-number-counter-with-digit-drums",
  category: "text-effects",
  name: "Rolling Odometer Number Counter",
  keyword: "animated number counter javascript",
  title: "Rolling Odometer Number Counter in React and HTML | We.Inc",
  description:
    "Free rolling odometer number counter: digit drums that carry like a real meter, start when scrolled into view and keep the final figure readable. React or HTML.",
  intro:
    "A mileage reading built like a real odometer: shaded drums behind a brass bezel, with an ivory tenths wheel at the end. The tenths spin freely while each drum to the left only turns as the one beside it rolls past nine, so carries look mechanical rather than random. On phones the whole meter scales with the screen width and stays on one line.",
  useWhen: [
    "The number is a running total of distance, hours or units and you want it to read like a physical meter.",
    "A courier, cycling club, fleet or charity ride page needs one proud figure near the top that people remember.",
    "You want a counter that still looks finished as a still picture, since the drums at rest are a design of their own.",
  ],
  customize: [
    "Set `VALUE` and `WHOLE_DRUMS` together; the drum count must cover every whole digit of the figure.",
    "Swap the bezel colours in the `from-[#c9a76a] via-[#8c6b37]` gradient, or `--odo-brass-1` and `--odo-brass-2` in the plain version.",
    "Lengthen the roll with `DURATION`; four seconds or more reads as a slow, heavy mechanism.",
    "Drop the tenths wheel by removing the last `<Drum light />` and the decimal point beside it, then format the hidden text with no decimals.",
  ],
  accessibility: [
    "Screen readers get a single hidden sentence, 48,306.4 miles, while the drums are aria-hidden; the replay control is a real button with a focus ring.",
    "With reduced motion switched on, the drums are drawn straight at the final reading and the frame loop never starts.",
    "The figure is in the markup before any script runs, so a visitor without JavaScript still sees the number.",
  ],
  faqs: [
    {
      question: "How does the odometer decide when a drum should turn?",
      answer:
        "The value is turned into tenths. The last drum follows that number directly, so it spins all the time. Every other drum shows its digit and only adds a fraction when all the digits to its right are in their final step before rolling over, which is exactly how geared wheels carry.",
    },
    {
      question: "Why do the digits not jump in width while counting?",
      answer:
        "Each drum is a fixed width box holding a strip of eleven digits, zero to nine and a closing zero, and the strip is moved with a transform. The box never resizes, so neighbouring drums and the bezel stay perfectly still.",
    },
    {
      question: "Does the counter start before anyone can see it?",
      answer:
        "No. An IntersectionObserver starts the roll when about a third of the section is on screen, pauses it if the visitor scrolls away mid roll and picks up where it left off on return.",
    },
    {
      question: "Can I feed it a live number instead of a fixed one?",
      answer:
        "Yes. Keep the drum maths and call it with the new value from your data, easing from the old reading to the new one. Because the carry logic works on any value, small updates roll only the drums that need to move.",
    },
    {
      question: "Will it work with other number formats?",
      answer:
        "The group and decimal marks come from Intl.NumberFormat, so they follow the locale you pass. A locale that groups digits differently may need the separator position adjusted.",
    },
  ],
  related: [
    "cinema-marquee-headline-with-letter-tiles-that-slide-along-rails-and-chasing-bulbs",
    "css-text-effects-and-hover-animations-collection-with-copyable-css-for-every-effect",
  ],
  tags: ["odometer counter", "rolling digits", "number counter animation", "digit drum"],
  height: 553,
  interactive: true,
  section: true,
  collection: "number-counter-animation",
  standalone: true,
  tech: "css",
  reducedMotion: "The drums sit still on the final reading and the replay button does nothing.",
  perf: "Six translated digit strips updated by one short requestAnimationFrame run; no layout work per frame.",
};

export default meta;
