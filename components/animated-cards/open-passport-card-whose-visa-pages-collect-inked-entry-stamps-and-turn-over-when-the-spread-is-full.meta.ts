const meta = {
  slug: "open-passport-card-whose-visa-pages-collect-inked-entry-stamps-and-turn-over-when-the-spread-is-full",
  category: "animated-cards",
  name: "Open Passport Card Whose Visa Pages Collect Inked Entry Stamps and Turn over When the Spread Is Full",
  keyword: "passport stamp animation react",
  title: "React Passport Stamp Animation Card | We.Inc",
  description: "Passport card whose visa pages collect entry stamps in uneven ink, dip under each hit and turn over when the spread is full. Free React and HTML to copy.",
  intro: "An open passport lying on a dark teal desk, tipped away from you, with a burgundy cover showing as a thin leather border and the other pages stacked at each side. Both visa pages are printed with crossing wave lines and a lobed rosette. Three border stamps are already there. A moment after load more arrive: a soft shadow closes on the spot, the booklet dips, and a round, boxed, oval or eight sided mark is left behind in blue, red, green, black or violet ink that looks wet for a second and then dries paler. After eight stamps the right hand leaf lifts and turns across the stitching to a clean spread. Click anywhere on a page to place the next stamp exactly there. On a phone the booklet scales down whole and the button stays under your thumb.",
  useWhen: [
    "A travel company wants to show the places a tour covers as stamps collected in order, in place of a bulleted itinerary.",
    "A loyalty or challenge page awards a mark per visit, lesson or purchase and needs a satisfying way to add each one.",
    "A language school, visa service or relocation firm wants one recognisable object at the top of a page with no stock photograph.",
    "A personal site lists countries lived or worked in and wants the list to feel collected over time.",
  ],
  customize: [
    "Each border post is one line in `entries`: `place`, `kind` (`round`, `box`, `oval` or `octagon`), the big `word`, a `date`, the small `office` line and `ink` as red, green and blue numbers.",
    "`SLOTS` lists where unaimed stamps land on the left and right page with a tilt in degrees, and `ORDER` is the sequence they fill in. `START` is how many are present when the booklet first appears.",
    "`PER_SPREAD` is the count that triggers a page turn. Raise it and add matching rows to `SLOTS` and `ORDER` for a busier spread.",
    "The cover is `bg-[#641826]`, the paper is `bg-[#efe6d0]` and the desk is `bg-[#12343b]` plus its radial gradient. The two stroke colours inside `Printing` set the tint of the security pattern.",
    "`TIP` and `TURN` are the resting camera angles. The name printed in each page header is `ISSUER`.",
  ],
  accessibility: [
    "A real button at the lower right adds the next stamp and names the place it will be from, so aiming with a mouse is never required.",
    "Every impression is an image with alt text giving the word, the place and the date, and a polite live region reads the same details as each one lands.",
    "Wave lines, rosette, stitching, shadows and paper grain are hidden from assistive technology.",
    "With reduced motion the spread is shown already holding eight stamps, new ones appear without the shadow or the dip, and a full spread swaps to a clean one with no turning leaf.",
  ],
  faqs: [
    {
      question: "How is the uneven ink made?",
      answer: "Each die is drawn once on a small canvas in solid black: rings, rules, lettering set round an arc, a tiny aircraft. The code then walks the pixels and thins the ink with two layers of smooth noise, a random lean so one side prints fainter, and a fine speckle for paper tooth. The result is saved as an image address and reused, so a stamp costs nothing after the first paint.",
    },
    {
      question: "Why do new stamps look darker at first?",
      answer: "The image starts with a `filter` of extra saturation, lower brightness and a half pixel blur, then eases to none over a second and a half. It is also set to `mix-blend-multiply`, so the printed wave lines stay visible through the ink the way they would on paper.",
    },
    {
      question: "How does the page turn work?",
      answer: "While a turn runs, a third leaf is drawn over the right page and rotated about the fold with `rotateY` from 0 to minus 180 degrees. Its front face carries the stamped page and its back face the next blank left page, each with `backface-visibility: hidden`. When it lands the state moves on one spread and the extra leaf is removed.",
    },
    {
      question: "Can a stamp be placed at a point I choose in code?",
      answer: "Yes. Call `stamp` with a `side` of `L` or `R` and `x` and `y` in page pixels, where a page is 300 by 426. The point is clamped so the impression stays clear of the header and the page number.",
    },
    {
      question: "Is there a limit on stamps per spread?",
      answer: "Aimed clicks may add up to four more than `PER_SPREAD`. After that the next press turns the leaf instead, and stamps on pages that have turned out of sight are dropped from state.",
    },
  ],
  related: ["rubber-stamp-and-ink-pad-that-stamps-a-document-status-with-ink-that-thins-until-it-is-inked-again", "boarding-pass-call-to-action-that-tears-along-its-perforation-when-you-book-and-drops-the-stub", "leather-luggage-tag-on-a-buckled-strap-with-rope-physics-you-can-drag-and-fling"],
  tags: ["passport", "stamp", "ink", "page turn", "3d", "card", "travel", "canvas"],
  height: 770,
  section: true,
  interactive: true,
};

export default meta;
