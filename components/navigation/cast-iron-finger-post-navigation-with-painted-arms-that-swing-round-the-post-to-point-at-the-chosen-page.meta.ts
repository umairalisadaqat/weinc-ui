const meta = {
  slug: "cast-iron-finger-post-navigation-with-painted-arms-that-swing-round-the-post-to-point-at-the-chosen-page",
  category: "navigation",
  name: "Cast Iron Finger Post Navigation with Painted Arms That Swing Round the Post to Point at the Chosen Page",
  keyword: "signpost navigation menu react",
  title: "React Signpost Navigation Menu in CSS 3D | We.Inc",
  description: "Signpost menu with painted arms on a cast iron post: the one you pick swings round the post in 3D to point the way. Copy the React code or HTML free.",
  intro: "A site menu built as a country finger post. Four white arms with black raised lettering are clamped to a banded post by iron collars. Three of them point left at slightly different angles, the way a real post never quite lines up, and the arm for the current page points right. Choose another and it comes round the front of the post towards you, foreshortens, overshoots and settles, while the old one swings back to join the rest. Every arm is a true two-sided object in CSS 3D, so the back carries the same name and reads correctly when it faces you. The paint darkens as an arm turns away from the sun and a bar of gloss slides along it. Hovering an arm leans it towards you before you commit. On a phone the post narrows to a 372 pixel layout with shorter arms and smaller type, and each arm stays close to 50 pixels tall for a thumb.",
  useWhen: [
    "A small studio, inn, farm shop or walking guide has four or five top-level pages and wants the menu to be the first thing people remember.",
    "A landing page needs a playful chooser between a handful of destinations instead of a row of text links.",
    "A 404 page should offer the main routes out, and a signpost says that better than a paragraph.",
    "A portfolio opens on a single object and lets the visitor pick a direction from it.",
  ],
  customize: [
    "`places` holds the arms: `label` is painted on, `miles` is the small figure near the point and `note` is the line in the pill underneath. Five entries fit if you lower `pitch` in `layoutFor` to about 70.",
    "`AWAY` lists the resting angle of each unchosen arm in degrees, where 180 is flat left. Keep them within 25 of 180 or the names become hard to read.",
    "`PAINT` and `INK` recolour the arms and the lettering together. `#f2c230` with `#15171a` gives a yellow footpath sign.",
    "`SPRING.drag` decides how long an arm rocks after it arrives. 5.4 gives two visible swings, 9 lands with one, 14 stops dead.",
    "`perspective: 1500` on the scene sets how strongly an arm grows as it passes the front. Use 900 for a more dramatic lens.",
  ],
  accessibility: [
    "The arms are ordinary links in a list inside a `nav` landmark, and the chosen one carries `aria-current=\"page\"`. The copy painted on the back of each arm is hidden from assistive technology so names are read once.",
    "Tab reaches the arms from top to bottom. A focused arm shows an orange ring that turns with it and leans forward the same way it does under a pointer.",
    "The pill under the post is a polite live region that reads the new page name and its note after each choice.",
    "With reduced motion the arms jump straight to their final angles, the breeze is off and the self-running demo does not start.",
  ],
  faqs: [
    {
      question: "How do the arms stay readable from behind?",
      answer: "Each link holds two faces placed back to back with `backface-visibility: hidden`. The rear face is turned 180 degrees and has its own mirrored finger shape, so when an arm points left you are looking at the back plate with the name the right way round and the point on the left.",
    },
    {
      question: "Why does a chosen arm come round the front and not the back?",
      answer: "Angles run from 0 (flat right) through 90 (pointing at you) to about 180 (left). The spring only ever travels between those values, so the arm passes the near side of the post, where perspective makes the swing easy to see.",
    },
    {
      question: "How do I connect it to real routes?",
      answer: "Give each entry in `places` an `href`, pass it to the anchor and remove `e.preventDefault()` from the click handler. Set the starting arm from the current path so the post already points the right way when the page loads.",
    },
    {
      question: "Is anything drawn on a canvas?",
      answer: "No. The post, collars, bolts and arms are elements with gradients, and the paint grain is one small inline noise image. A single animation frame loop writes a rotation and two custom properties per arm.",
    },
    {
      question: "Can the arms point at more than two sides?",
      answer: "Yes. Resting angles are free, so an arm at 150 leans towards the viewer and one at 215 leans away. The chosen arm always returns to 0. If you want it to face a different way, change the value returned by `goal` for the chosen index.",
    },
  ],
  related: ["brass-lift-floor-indicator-navigation-with-an-arrow-that-sweeps-an-enamel-dial-between-sections", "shop-door-open-closed-enamel-sign-toggle-that-spins-on-its-chain-and-rings-a-brass-bell"],
  tags: ["signpost", "navigation", "menu", "3d", "spring", "skeuomorphic", "wayfinding"],
  height: 660,
  interactive: true,
};

export default meta;
