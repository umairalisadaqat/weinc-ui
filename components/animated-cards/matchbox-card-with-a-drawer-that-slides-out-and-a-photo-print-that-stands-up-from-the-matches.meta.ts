const meta = {
  slug: "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches",
  category: "animated-cards",
  name: "Matchbox Card with a Drawer That Slides out and a Photo Print That Stands up from the Matches",
  keyword: "css 3d box drawer card",
  title: "React 3D Card with a Drawer: Matchbox | We.Inc",
  description: "3D card built as a matchbox: drag the drawer out of its sleeve and a photo print stands up from a bed of matches. Free React and Tailwind code, or HTML.",
  intro: "A matchbox lying on a dark green table, seen from above and to one side. The sleeve has a photograph on its lid inside a red printed rule, a brown striker strip down the long side with a few strike marks, and a pale rim where the card is cut at the mouth. A moment after load the drawer slides out toward you on a spring. Inside is a tray of seventeen wooden matches with red heads, and lying on them a white bordered print, which swings up on its near edge and wobbles to a stop facing you. The shadow inside the sleeve stays behind as the tray leaves it. You can drag the drawer yourself, let go half way and it will finish the trip in whichever direction you were heading. On a phone the box is scaled down as one object.",
  useWhen: [
    "A restaurant, bar or hotel wants a keepsake object on the page that hides a second image, such as a menu photo or an invitation.",
    "A product reveal needs two beats, first the package and then what is inside, without a modal or a second screen.",
    "A wedding or event site wants a playful save the date that guests open by hand.",
    "A photographer or small press sells limited prints and wants each one presented as a boxed object.",
  ],
  customize: [
    "All words and both pictures live in the `box` object: `name`, `number` and `line` are printed on the lid, `cover` is the lid photograph and `print` is the card inside. Each `tone` is the colour shown until its picture arrives.",
    "`W`, `DP` and `H` are the length, depth and height of the sleeve. `TRAY_H` must stay below `H`, and `MATCH_Z` sets how full the tray looks.",
    "`RED` colours the printed rule, the round number seal, the small type and the outer end of the drawer. `PAPER` is the card stock. The table is `bg-[#0f3a30]` plus the radial gradient behind it.",
    "`OUT` is how far the drawer travels and `LIFT` is the angle in degrees the print stands at. Keep `CARD_L` shorter than `OUT` or the print will hit the sleeve as it rises.",
    "`TURN` and `TIP` are the resting camera angles. They are also used to work out which way a drag should move the drawer, so change them there and nowhere else.",
  ],
  accessibility: [
    "The lid is a real button with `aria-expanded`. Enter or Space slides the drawer out or back, and the label says which will happen and names the box.",
    "Dragging is an extra, not the only route: everything a drag does can be done with that one button, and a tap on the drawer without moving also toggles it.",
    "The print carries the only alt text for the inside photograph and the lid carries the other. Matches, striker strip and shadows are decoration and are hidden from assistive technology.",
    "With reduced motion the box is drawn already open with the print standing, the timer never runs and pressing the lid switches between the two states with no travel.",
  ],
  faqs: [
    {
      question: "How is the box given real depth?",
      answer: "Each surface is its own flat element inside a `preserve-3d` parent: lid, two long sides and a mouth rim for the sleeve, then a floor, four walls, a bed of matches and the print for the tray. Sides are stood up with `rotateX(-90deg)` about their bottom edge and ends with `rotateY(90deg)`. The browser sorts them by depth, so the tray really passes inside the sleeve.",
    },
    {
      question: "How does a sideways drag know which way the drawer runs?",
      answer: "The drawer moves along the long axis of the box, which on screen points down and to the right because of the camera angles. The code turns `TURN` and `TIP` into that screen direction once, then projects every pointer movement onto it. Pulling along the box moves the drawer one for one, and movement across it is ignored.",
    },
    {
      question: "What makes the print wobble when it stands up?",
      answer: "Its angle follows a spring with low damping, set by `stiffness: 90` and `damping: 11`. The spring is told to rise once the drawer passes four fifths of its travel and to fall as soon as it comes back under that mark, so the print is always flat before it reaches the sleeve.",
    },
    {
      question: "Are the matches images?",
      answer: "No. Each stick is a rounded strip with a four stop wood gradient running across it and a drop shadow, and each head is an ellipse filled with a radial gradient that has an off centre highlight. Small fixed offsets and tilts in the `matches` list stop them lining up too neatly.",
    },
    {
      question: "Can I put something other than a print inside?",
      answer: "Yes. The hinged element is an ordinary block, so a discount code, a short note or a small product shot can replace the image and caption. Keep it to the same `CARD_W` by `CARD_L` footprint so it clears the tray walls.",
    },
  ],
  related: ["vinyl-record-sleeve-gallery-where-the-disc-slides-out-and-spins-beside-its-cover", "mirror-ball-on-a-chain-that-throws-drifting-flecks-of-coloured-light-across-a-portrait-print", "open-passport-card-whose-visa-pages-collect-inked-entry-stamps-and-turn-over-when-the-spread-is-full"],
  tags: ["3d", "card", "box", "drawer", "drag", "reveal", "photo"],
  height: 704,
  section: true,
  interactive: true,
};

export default meta;
