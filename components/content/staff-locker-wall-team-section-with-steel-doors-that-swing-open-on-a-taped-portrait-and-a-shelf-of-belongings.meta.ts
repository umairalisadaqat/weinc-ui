const meta = {
  slug: "staff-locker-wall-team-section-with-steel-doors-that-swing-open-on-a-taped-portrait-and-a-shelf-of-belongings",
  category: "content",
  name: "Staff Locker Wall Team Section with Steel Doors That Swing Open on a Taped Portrait and a Shelf of Belongings",
  keyword: "react team section 3d",
  title: "React 3D Team Section: Staff Locker Wall | We.Inc",
  description: "Team section drawn as a bank of steel lockers: each door swings open on a taped portrait and a shelf of belongings. Free React and Tailwind code, or HTML.",
  intro: "Four petrol blue lockers stand against a pale workshop wall, one for each person in a small pottery. Every door has pressed louvres top and bottom, a chrome card holder with a typed surname and number, a recessed pull and a brass padlock that rattles when the door moves. Two doors are open from the first frame. Behind each is a colour portrait taped to the back wall with two strips of masking tape, a handwritten strip with the person's name, a shelf holding a mug, books, a flask or a jar of tools, and an apron, tote, towel or bunch of keys on a hook that keeps swinging after the door has stopped. The open pairs swap by themselves until a visitor clicks a door. On a phone the wall stays large and slides sideways to whichever locker is in play, with two round buttons to walk along it.",
  useWhen: [
    "A workshop, kitchen, studio or gym wants its about page to feel like the back room instead of a grid of headshots.",
    "A team of three to six people each deserves a moment of attention, and one detail about what they keep at work says more than a job title.",
    "A careers page needs a warm, slightly funny object near the top to show what joining the crew looks like.",
    "A maker brand already photographs its people against bold coloured walls and wants those portraits to be discovered one at a time.",
  ],
  customize: [
    "People live in the `team` array. `plate` is the short text on the door card, `tape` is the handwritten line under the photograph, `shelf` picks two of `mug`, `books`, `flask` and `jar`, and `hung` picks `apron`, `tote`, `keys` or `towel`.",
    "`PAINT` and `PAINT_DARK` set the enamel. The door also carries its own three stop gradient (`#3d7a90`, `#2f6377`, `#27556a`), so change those together when you repaint.",
    "`SWING` is how far a door opens in degrees and `PEEK` is how far it lifts off the catch under a mouse. The bounce comes from `stiffness: 58` and `damping: 8.5` on the spring called `raw`.",
    "`SETS` lists which doors are open in each beat of the self running demo. The first row is what a visitor sees on arrival, so keep at least one `true` in it.",
    "Add a fifth person and the bank widens by `CELL`; raise `SCENE_W` by the same amount so the wall keeps its margins.",
  ],
  accessibility: [
    "Each locker is a list item with a real button laid over the door. The button has `aria-expanded` and a label that gives the locker number, the person's name and what they do, so the wall reads as a staff list without sight of it.",
    "Portraits carry their own alt text and the name strip under each one is live text, not part of the picture. Mugs, aprons, hinges and padlocks are hidden from assistive technology.",
    "The two round buttons step through the lockers one at a time, which is the only route to off screen lockers on a narrow phone, so keep them if you restyle the caption row.",
    "With reduced motion doors jump between shut and open with no swing, nothing rattles, and the automatic swapping never starts.",
  ],
  faqs: [
    {
      question: "How does a door open in real perspective without a 3D library?",
      answer: "Every locker sets `perspective: 1400` on its own list item, and the door inside is a `preserve-3d` block hinged with `transformOrigin: 0% 50%` and turned by `rotateY`. It has three faces: the painted front, a nine pixel folded edge stood at ninety degrees, and an inside face pushed back by that thickness and flipped, so past a quarter turn you see the mirror and the note stuck inside the door.",
    },
    {
      question: "Why does the door slam shut instead of bouncing through the frame?",
      answer: "The spring is deliberately under damped, so on the way shut its value dips below zero. That raw value is passed through a clamp before it becomes an angle, which means the door stops dead at the frame while the spring finishes its overshoot out of sight. The padlock is driven by the door's angular speed, so it kicks at exactly that moment.",
    },
    {
      question: "What keeps the apron swinging after the door has stopped?",
      answer: "The hanging item rotates about its hook on a second spring with very little damping (`damping: 3.2`). Its target is the door's velocity scaled down and reversed, so it is pushed while the door moves and then left to settle over a couple of seconds.",
    },
    {
      question: "Can more than one locker be open at once?",
      answer: "Yes. Clicking a door toggles only that door, so a visitor can open all four. The arrow buttons behave differently on purpose: they close everything else and open the next locker along, which suits a phone where only part of the wall is visible.",
    },
    {
      question: "Are the belongings images?",
      answer: "No. The mug, book stack, flask, tool jar, apron, tote, towel and keys are small inline SVGs with their own gradients, each given a unique gradient id from the locker index. To add another, write one more branch in `ShelfThing` or `HungThing` and add its name to the type above it.",
    },
  ],
  related: ["cork-board-testimonials-with-pinned-portrait-postcards-that-swing-unpin-and-turn-over-to-a-handwritten-note", "matchbox-card-with-a-drawer-that-slides-out-and-a-photo-print-that-stands-up-from-the-matches"],
  tags: ["team", "about", "3d", "door", "portrait", "spring", "object"],
  height: 704,
  section: true,
  interactive: true,
};

export default meta;
