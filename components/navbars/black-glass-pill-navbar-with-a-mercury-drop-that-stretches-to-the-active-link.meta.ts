const meta = {
  slug: "black-glass-pill-navbar-with-a-mercury-drop-that-stretches-to-the-active-link",
  category: "navbars",
  name: "Black Glass Pill Navbar with a Mercury Drop That Stretches to the Active Link",
  keyword: "liquid metal navbar react",
  title: "React Pill Navbar with a Liquid Metal Marker | We.Inc",
  description: "Pill navbar where a drop of liquid metal marks the current page and stretches into a thread as it travels. Free React code and an HTML version to copy.",
  intro: "A floating menu shaped as a shallow steel tray lined with black glass. The page you are on is marked by a puddle of mercury lying under its label. Pick another link and the puddle does not slide as a block. Its front runs ahead, the body thins into a neck, and two small beads are left behind that roll after it and melt back in. The metal is a mirror, so it is drawn by working out where each point of its surface faces and what a studio would show there: a pale ceiling on the flat top, a dark line at the shoulder, a square lamp on the upper left. Labels switch from pale to ink only while metal is beneath them. Five links share the tray equally, and the tray narrows to 344 pixels on phones with a shorter height.",
  useWhen: [
    "A studio, label or portfolio site has five or fewer top pages and wants its header to be the one object people remember.",
    "A dark product page for audio gear, watches or cars needs a menu that matches polished hardware in the photographs.",
    "A one-page site jumps between sections and the marker should visibly travel, so visitors see how far apart two sections are.",
    "A launch page needs a single interactive toy above the fold that still does a real job.",
  ],
  customize: [
    "`links` is the menu. Short single words work best because the puddle is sized from the slot width, not from the word.",
    "`BRIGHT` and `DEEP` are the two ends of the reflection. Swap them for `[255, 214, 150]` and `[40, 18, 4]` to turn mercury into molten gold.",
    "The four spring pairs in `frame` (`300, 21` down to `36, 8.6`) set how far the body and its beads separate. Raise the last two stiffness values toward 120 and the drop stays in one piece.",
    "Drop size is `H * 0.33` in `paint`. The tray height is `h-[60px] sm:h-[90px]` on the inner element and everything scales from it.",
    "The lamp is the line commented as the softbox. Its four pairs of numbers are the left, right, top and bottom edges of the reflected square.",
  ],
  accessibility: [
    "The tray is a `nav` landmark holding a list of anchors, and the chosen one has `aria-current=\"page\"`. The canvas is hidden from assistive technology.",
    "Each label colour is set from how much metal is under it, so text stays pale on black and dark on silver through the whole move. Recheck this if you darken `BRIGHT`.",
    "Tab reaches every link and Enter follows it. The focus ring is drawn inside the slot in sky blue so the rounded tray never clips it.",
    "Under reduced motion the puddle is placed at the new link in one step, with no neck, no stray beads and no self-running tour.",
  ],
  faqs: [
    {
      question: "How is the liquid shape made without WebGL?",
      answer: "Every canvas pixel adds up three simple fields: one around the line between the front and back of the body, and one around each bead. Where the sum passes one, there is metal. Because the fields add, two shapes that come close grow a bridge between them, which is what makes the beads merge instead of overlapping.",
    },
    {
      question: "Why does it look like metal and not grey plastic?",
      answer: "Plastic is shaded by how much light lands on it. A mirror is shaded by what it points at. The code turns the field into a height, takes the slope, reflects the line of sight off it and looks the result up in a tiny invented room. The hard dark band near the edge is the horizon of that room.",
    },
    {
      question: "Is it heavy to run?",
      answer: "Only the columns near the metal are computed, at two canvas pixels per screen pixel, and nothing is drawn once the springs have settled. The loop also stops while the menu is off screen or the tab is in the background.",
    },
    {
      question: "Can I use real routes instead of the placeholder links?",
      answer: "Yes. Give each entry in `links` a path, set it as the `href`, and derive `active` from your router's current location. Remove the `preventDefault` call in the click handler so the browser or your router follows the link.",
    },
    {
      question: "What happens when the tray is resized?",
      answer: "A resize observer measures the tray again, rebuilds the buffers and recentres the drop on the current link. The drop and its beads are sized from the tray height, so a taller tray gets a bigger puddle with no other edits.",
    },
  ],
  related: ["soft-silicone-pill-navbar-with-a-glowing-ball-rolling-under-the-rubber", "navbar-with-liquid-stretch-highlight-and-inverting-labels"],
  tags: ["navbar", "pill", "mercury", "liquid metal", "canvas", "metaballs", "chrome"],
  height: 640,
  interactive: true,
};

export default meta;
