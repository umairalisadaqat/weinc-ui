const meta = {
  slug: "photo-booth-team-strips-that-feed-out-of-chrome-slots-in-four-clunks-then-hang-and-swing-on-the-panel",
  category: "content",
  name: "Photo Booth Team Strips That Feed out of Chrome Slots in Four Clunks Then Hang and Swing on the Panel",
  keyword: "photo booth strip react component",
  title: "React Photo Booth Strip Team Section | We.Inc",
  description: "Team section drawn as a photo booth panel: each slot feeds out a strip of poses for one person, which then hangs and swings. Free React and HTML to copy.",
  intro: "A brushed steel fascia runs across a near black booth panel with five delivery slits cut into it. Above each slit a first name and a job are engraved, with a small lamp beside them. From every slit hangs a glossy strip of four colour photographs of that person, cut from two sittings at different crops, with a name, a role and a serial number printed in the white foot. The strips are loose paper: they drift a degree or two in a draught, and a pointer dragged through them knocks them aside so they swing back like pendulums. Press a strip and it drops out of the picture, the lamp lights, and a fresh one feeds out one frame at a time with the poses in a new order. The booth reprints people by itself until somebody touches it. On a phone the panel stays large and two round buttons slide along it.",
  useWhen: [
    "A studio, agency or shop with a handful of people wants a team block that shows several expressions of each person instead of one stiff headshot.",
    "An event, wedding or party site needs a photo booth motif that actually behaves like paper coming out of a machine.",
    "An about page sits on a dark background and needs one bright, physical object to carry the names and faces.",
    "A portfolio has two or three frames from the same sitting per subject and wants to use all of them in a small space.",
  ],
  customize: [
    "Each entry in `people` has two `shots` and four `poses`. A pose picks a shot and gives `at` (the focal point), `zoom` and an optional `flip`, which is how two photographs become four different frames. `tone` is the colour shown before a picture loads.",
    "`STRIP_W`, `FRAME_H`, `GAP` and `FOOT` size the paper, and `PITCH` is the distance between slots. With six people raise `SCENE_W` by one `PITCH`.",
    "`PULL` is how strongly a strip returns to plumb and `DRAG` is the air resistance. Lower `DRAG` towards 0.4 for strips that swing for a long time, or raise it past 2 for heavy card.",
    "The panel colour is `bg-[#131110]` plus the radial gradient over it, and the steel is the `steel` constant. The paper tint is `#f4efe3` on the strip itself.",
    "The order and pace of the self running reprints are the `order` array and the 4600 millisecond interval in the last timer effect.",
  ],
  accessibility: [
    "The row of strips is a list, and each one has a real button over it whose label names the person, gives their role and says that pressing prints the strip again.",
    "Only the first frame cut from each sitting carries alt text. The repeated crops have empty alt so a screen reader hears two descriptions per person, not four.",
    "Names and roles are live text twice, engraved on the fascia and printed on the strip foot, so nothing depends on reading the photographs.",
    "With reduced motion no animation loop is started: strips hang straight and still, and pressing one swaps the order of its frames at once.",
  ],
  faqs: [
    {
      question: "How do the strips swing?",
      answer: "Every strip is a damped pendulum with an angle and an angular speed, stepped in one `requestAnimationFrame` loop that writes a `rotate` straight to the element. Two slow sine waves with a different phase per strip act as a draught. A pointer moving through a strip adds to its speed in proportion to how far the pointer travelled and how low on the paper it was, so a flick near the bottom sends it further than a brush near the slot.",
    },
    {
      question: "Why does a new strip come out in jerks?",
      answer: "A booth advances its paper one exposure at a time. While a strip is in `feed` mode a counter goes from one to four with a pause of about a third of a second between steps, and the paper eases to a quarter, a half, three quarters and then its full length. Each step also nudges the angle so the tongue of paper twitches.",
    },
    {
      question: "How is the paper hidden while it is still inside the machine?",
      answer: "Each strip lives in a wrapper positioned exactly at its slit with `clip-path: inset(0px -500px -900px -500px)`. That cuts off everything above the slit and nothing to the sides or below, so the strip can swing wide and fall off the bottom but can never be seen above the fascia.",
    },
    {
      question: "Do I need four photographs of every person?",
      answer: "No, two are enough and one will do. Point all four poses at the same shot and vary `zoom` between about 1.2 and 2.6 with a different `at` each time. Ask for the image at 900 pixels wide when a pose zooms past 2 so the crop stays sharp.",
    },
    {
      question: "Does the loop run while the section is off screen?",
      answer: "It stops. An `IntersectionObserver` and the page visibility event both gate the next frame request, and the loop restarts with a fresh clock when the booth comes back into view so nothing lurches.",
    },
  ],
  related: ["staff-locker-wall-team-section-with-steel-doors-that-swing-open-on-a-taped-portrait-and-a-shelf-of-belongings", "instant-camera-that-ejects-photos-you-shake-to-develop"],
  tags: ["team", "photo booth", "physics", "pendulum", "portrait", "about", "object"],
  height: 726,
  section: true,
  interactive: true,
};

export default meta;
