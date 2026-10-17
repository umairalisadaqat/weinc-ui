const meta = {
  slug: "brass-armillary-sphere-background-with-nested-rings-that-turn-about-a-tilted-axis-and-catch-the-lamp",
  category: "backgrounds",
  name: "Brass Armillary Sphere Background with Nested Rings That Turn About a Tilted Axis and Catch the Lamp",
  keyword: "3d rings background react canvas",
  title: "React Canvas Background: Turning 3D Brass Rings | We.Inc",
  description: "Canvas background of a brass armillary sphere whose inner rings revolve on a tilted axis while highlights slide round. Free React code and HTML to copy.",
  intro: "A full-bleed backdrop with one object in it: an armillary sphere, the ringed model of the sky that sat on astronomers' desks before telescopes. A wide engraved horizon ring and an upright meridian ring stay fixed to a turned brass stand. Inside them a cage of nine hoops (equator, ecliptic, two tropics, two polar circles and two colures) revolves slowly about an axis leaning at the latitude you set, round a blue enamel ball. Nothing here is an image or a 3D library. Every hoop is a strip of small flat faces drawn on a plain 2D canvas, sorted back to front, and each face is coloured by what a mirror at that angle would reflect of a lamp, a rim light and a red floor. Move the pointer and the viewpoint drifts; drag sideways and the cage spins with your hand and coasts. The scene resizes with its container and keeps the sphere whole on a narrow phone.",
  useWhen: [
    "A planetarium, observatory, museum or science festival page wants an opening screen with an instrument in it instead of stock stars.",
    "A consultancy, fund or law firm needs a slow, expensive-looking backdrop behind a short line of text.",
    "A book, podcast or course about navigation, astronomy or the history of science needs cover art that moves.",
    "A sign-in or holding page should have something worth watching while keeping the foreground almost empty.",
  ],
  customize: [
    "`LATITUDE` leans the polar axis: 90 stands it upright like a spinning top, 0 lays it flat on the horizon ring.",
    "`SPIN` is the idle speed of the inner cage in radians per second. A negative value turns it the other way and 0 leaves only the camera drift.",
    "`hoops` lists every ring with its radius `R`, half thickness `a`, half width `b` and segment count `N`. Delete the last two entries to drop the colures for a lighter cage.",
    "`stops` is the metal ramp from shadow to glare. Swap it for greys such as `[18,20,24]`, `[90,96,106]`, `[170,176,186]`, `[232,236,242]`, `[255,255,255]` to cast the sphere in steel.",
    "The backdrop is the `radial-gradient` on the root element, and the pink in `pool` is the light it throws on the floor. Change both together.",
  ],
  accessibility: [
    "The canvas is marked `aria-hidden` because it carries no information. The two caption lines are ordinary text over it at better than 7 to 1 contrast.",
    "Pointer movement and dragging only change the view, so nothing is lost on a keyboard or a screen reader.",
    "With reduced motion one still frame is drawn and neither the idle turn nor the pointer drift runs.",
    "On touch screens the sphere does not capture drags, so the page scrolls normally through it.",
  ],
  faqs: [
    {
      question: "How does a 2D canvas draw solid rings that pass in front of and behind each other?",
      answer: "Each hoop is cut into 30 to 72 segments, and each segment has four flat faces: outside, inside and two edges. Faces pointing away from the viewer are thrown out, the rest are sorted by depth and filled from far to near. With faces this small the sorting errors that painter's ordering can produce are too small to notice.",
    },
    {
      question: "Why does it look like metal and not like yellow plastic?",
      answer: "Plastic is shaded by how much a surface faces the light. Polished metal is shaded by what it reflects, so the code mirrors the view direction about each face and looks up a small made-up room: one hard lamp, one softer rim light and a dim floor. A second term adds the long streak that circular brushing leaves along a ring.",
    },
    {
      question: "How heavy is it?",
      answer: "About 2,500 small quads are transformed and roughly half are filled per frame, with colours taken from a table of 96 prepared strings. The loop pauses when the element leaves the viewport or the tab is hidden, and the canvas never exceeds two device pixels per CSS pixel.",
    },
    {
      question: "Can I put a headline over it?",
      answer: "Yes. Add your content in an absolutely positioned layer above the canvas, as the caption is. For a long headline, move the sphere aside by changing `cx = W / 2` in `resize` to `W * 0.7` and keep the text on the left.",
    },
    {
      question: "Are the rings in the right places?",
      answer: "They follow the real layout. The tropics sit 23.44 degrees either side of the equator, the polar circles the same distance from the poles, and the ecliptic band is tilted by that angle so it touches both tropics. The engraved divisions are decorative and are not a working scale.",
    },
  ],
  related: ["brass-orrery-schedule-viewer-with-stone-planets-on-geared-arms-that-swing-under-a-due-pointer", "moon-phase-dial-date-picker-with-an-enamel-day-ring-you-turn-and-a-cratered-moon-lit-for-that-night"],
  tags: ["armillary", "brass", "3d", "rings", "canvas", "background", "astronomy"],
  height: 760,
  section: true,
};

export default meta;
