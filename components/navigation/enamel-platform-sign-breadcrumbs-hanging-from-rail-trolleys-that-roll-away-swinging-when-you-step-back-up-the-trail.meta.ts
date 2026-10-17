const meta = {
  slug: "enamel-platform-sign-breadcrumbs-hanging-from-rail-trolleys-that-roll-away-swinging-when-you-step-back-up-the-trail",
  category: "navigation",
  name: "Enamel Platform Sign Breadcrumbs Hanging from Rail Trolleys That Roll Away Swinging When You Step Back Up the Trail",
  keyword: "animated breadcrumb react",
  title: "React Animated Breadcrumb of Hanging Signs | We.Inc",
  description: "Breadcrumb trail of enamel signs on rail trolleys: step back a level and the deeper signs roll away, swinging on their chains. Free React and HTML code.",
  intro: "A breadcrumb trail hung like the direction signs under a station canopy. Every level is a blue vitreous enamel plate with a white keyline and an arrow, hanging by a short chain from a two-wheeled trolley on a steel rail. The page you are on shows its cream side with maroon lettering and a small red line that says so. Click an earlier level and three things happen in order: the deeper signs set off along the rail, far end first, and their plates lag behind the trolleys and swing; the wheels turn as they go; and the sign you chose spins half a turn on its swivel to show cream. A button under the wall brings the full trail rolling back in, and each plate swings forward as its trolley brakes. Below 760 pixels the trail hangs from two rails, three signs over two, at a size where every plate is still a 56 pixel target.",
  useWhen: [
    "A shop with deep categories wants the path above a product to be something people enjoy using, not grey text with slashes.",
    "A museum, archive or transport site already borrows from signage and needs its page furniture to match.",
    "A documentation or course site wants going up a level to feel like a physical step back.",
    "A product page hero has room for one moving object and the category path is the natural candidate.",
  ],
  customize: [
    "`trail` is the list of levels in order. The widths are worked out from the letter count, so longer names make wider plates. Keep the total under about 60 characters for one rail.",
    "`BLUE`, `CREAM` and `MAROON` set the two enamel colours and the lettering on the current page. `#1f5c3a` in place of the blue gives a green heritage line.",
    "`SWING.reach` decides how far a moving trolley throws its sign. 205 gives a swing of roughly 25 degrees at full speed. 90 is slapstick and 500 is barely a tremor.",
    "`SWING.drag` is how quickly the swinging dies away. Raise it from 1.05 to 3 if you want the row to settle in under a second.",
    "The two stagger values in `go`, 120 and 170 milliseconds, space out departures and arrivals. Set both to 0 and the signs move as one block.",
  ],
  accessibility: [
    "The markup is the standard pattern: a `nav` labelled Breadcrumb, an ordered list, a link per level and `aria-current=\"page\"` on the last one still hanging.",
    "Signs that have rolled away are marked `aria-hidden`, taken out of the tab order and made invisible, so nobody can land on a level that is no longer in the path.",
    "The path is repeated as plain text under the wall in a polite live region, which is what a screen reader hears after each step.",
    "With reduced motion nothing rolls, swings or spins. Plates change side and leave the rail instantly and the demo stays off.",
  ],
  faqs: [
    {
      question: "What makes the signs swing when the trolleys move?",
      answer: "Each plate is a pendulum whose pivot is the trolley. The trolley's acceleration is fed into the pendulum equation as a sideways force, so a plate lags when its trolley sets off and swings ahead when it stops, exactly as a hanging weight does on a moving hook.",
    },
    {
      question: "Why does the current page show a different colour?",
      answer: "Every plate has two faces, blue on the front and cream on the back, and hangs from a swivel. Whichever level is current is turned 180 degrees with a spring, so the colour change is a movement you can follow, not a restyle.",
    },
    {
      question: "How do I wire this to a real path?",
      answer: "Build `trail` from your route segments, give each link its real `href`, and remove `e.preventDefault()`. On a real navigation the page reloads with a shorter trail, so you can also delete the rehang button and the demo.",
    },
    {
      question: "Does it handle a very long page title?",
      answer: "Plate width grows with the label, so a long final title can push the row past the wall. Truncate the last label to around 20 characters, or add it as a sixth entry on the second rail by editing `rows` in `layoutFor`.",
    },
    {
      question: "How heavy is it?",
      answer: "There is no canvas. Five list items each receive one transform and four custom properties per frame, and the chain and plaster grain are two tiny inline images. The loop pauses when the wall is off screen or the tab is hidden.",
    },
  ],
  related: ["cast-iron-finger-post-navigation-with-painted-arms-that-swing-round-the-post-to-point-at-the-chosen-page", "pull-down-wall-chart-tabs-on-spring-rollers-that-snap-up-to-uncover-the-chart-hanging-behind", "ring-binder-tabs-with-coloured-index-dividers-that-turn-over-chrome-rings-to-open-each-section"],
  tags: ["breadcrumb", "enamel", "signs", "pendulum", "physics", "navigation", "skeuomorphic"],
  height: 640,
  interactive: true,
};

export default meta;
