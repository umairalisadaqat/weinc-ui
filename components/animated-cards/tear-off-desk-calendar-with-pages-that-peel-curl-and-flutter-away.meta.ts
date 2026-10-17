const meta = {
  slug: "tear-off-desk-calendar-with-pages-that-peel-curl-and-flutter-away",
  category: "animated-cards",
  name: "Tear-Off Desk Calendar with Pages That Peel, Curl and Flutter Away",
  keyword: "react tear off calendar animation",
  title: "React Tear Off Calendar Animation in 3D | We.Inc",
  description: "Tear-off day calendar: drag a page up and it curls off the pad in 3D, rips at the binding and flutters away to show tomorrow. Free React and HTML to copy.",
  intro: "A block calendar stapled to a dark green backing card that hangs from a brass nail. The top page carries a huge day number, the weekday in red and a one-line note. Pull it up from the bottom and the paper bends in a real curve, built from eighteen thin strips hinged to each other, with the underside showing and a shadow falling on the page below. Let go past halfway and it rips free, spins and drops out of view. Left alone it tears a page every few seconds. The whole object is 288 pixels wide, so it fits a phone screen without scaling.",
  useWhen: [
    "A countdown to a launch, a wedding or a sale where each tear brings the date closer.",
    "The date block on an events page or a daily specials board for a cafe.",
    "A habit or journalling app that wants a physical way to move to the next day.",
    "A quiet hero object for a stationery shop, a print studio or a planner brand.",
  ],
  customize: [
    "Set the first date in `START` (`month` counts from 0, so 9 is October). Every page after it is worked out from that.",
    "The line at the foot of each page comes from the `notes` array, used in order.",
    "Page size is `PAGE_W` and `PAGE_H`. Keep `STRIPS` at 12 or more or the curl starts to look faceted.",
    "How far the page folds back before it rips is `PEEL_DEG`, and `BAND` is how many strips share the bend: lower it for a tighter roll.",
    "The red is `#c8371f` (binding, weekday, weekend numbers) and the card is the green gradient that starts `#2e3a33`.",
  ],
  accessibility: [
    "The pad is one real button whose label names the date it will tear off, and Enter or Space tears a page without any dragging.",
    "A polite live region reads out the date now on top after each tear.",
    "With reduced motion on, nothing tears by itself and pressing the button swaps the date with no curl or fall.",
  ],
  faqs: [
    { question: "How is the paper curl made without WebGL?", answer: "The page is cut into eighteen horizontal strips, each a child of the one above and hinged on its top edge. Every strip turns a few degrees with `rotateX`, and because the turns add up down the chain the sheet bends in a smooth arc. Each strip shows its own slice of the same page." },
    { question: "Why does the back of the page look different from the front?", answer: "Each strip has two faces with `backface-visibility: hidden`. The back one is plain paper, and both get a dark overlay whose strength follows the strip's angle, which is what reads as light falling across a bend." },
    { question: "Can I stop it tearing pages by itself?", answer: "Yes. The timer lives in one effect that sets a timeout and an interval. Delete that effect, or start `touched` as true, and the calendar waits for the visitor." },
    { question: "Can it show today's real date?", answer: "Replace `START` with values read from `new Date()` inside an effect after the first render. Reading the clock during render would make the server and browser output disagree." },
    { question: "Does dragging work on touch screens?", answer: "It uses pointer events with pointer capture and `touch-action: none` on the pad, so a finger drag lifts the page and the screen does not scroll while you hold it." },
    { question: "How heavy is it to run?", answer: "Nothing animates while the page lies flat. During a tear one animation frame loop writes eighteen transforms and a few opacities, then stops." },
  ],
  related: ["clear-acrylic-id-passes-in-a-slotted-block-that-lift-out-and-turn-with-neon-edges-and-a-floating-print", "engraved-steel-membership-card-that-turns-on-its-edge-and-catches-a-fixed-lamp-in-its-lettering", "hanging-photo-mobile-with-balanced-wire-arms-and-prints-that-turn-in-the-air"],
  tags: ["calendar", "paper", "tear", "page curl", "3d", "drag"],
  height: 660,
  section: true,
  interactive: true,
};

export default meta;
