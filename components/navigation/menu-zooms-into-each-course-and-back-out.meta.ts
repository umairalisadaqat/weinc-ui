const meta = {
  slug: "menu-zooms-into-each-course-and-back-out",
  category: "navigation",
  name: "Menu Zooms Into Each Course and Back Out",
  keyword: "zoom page transition",
  title: "",
  description: "",
  intro: "A deep navy restaurant site whose menu page opens each course with a zoom: the list swells and fades as if you leaned in, and the course page settles from slightly small. Returning to the menu plays the zoom in reverse, so depth always tells you whether you went into a detail or came back out.",
  useWhen: [
    "A list that opens into detail pages and back, such as a menu, a catalogue or a set of case studies, where in and out should feel different.",
  ],
  customize: [
    "Change the `1.12` and `.9` scales in the four `w6zom` keyframes for a deeper or flatter zoom.",
    "Swap `--w6zom-navy`, `--w6zom-cream` and `--w6zom-brass` on `.w6zom` to match another dining room.",
    "Edit the `DEMO` list in the script to change or stop the automatic tour.",
  ],
  accessibility: [
    "A course page puts focus on its dish name; going back to the menu puts focus on the course row you came from.",
    "With reduced motion the zoom is skipped and the new page shows straight away.",
  ],
  faqs: [],
  related: [],
  tags: ["zoom transition", "view transitions", "list to detail", "restaurant menu"],
  height: 600,
  section: true,
  interactive: true,
  collection: "page-transitions",
  tech: "script",
  support: "All current browsers; instant swap in older ones",
  reducedMotion: "Courses and the menu replace each other instantly with no scaling or fading.",
  perf: "Two snapshots of the page area scale and fade for about half a second; the menu costs nothing while it sits still.",
};

export default meta;
