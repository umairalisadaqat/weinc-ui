const meta = {
  slug: "expanding-bread-recipe-step-panels-with-notes",
  category: "galleries",
  name: "Expanding Bread Recipe Step Panels With Notes",
  keyword: "expanding step cards",
  title: "",
  description: "",
  intro: "A baking school's four-step method laid out as paper strips, each marked with a large step number, a one-word name and how long it takes. The open step lifts its paper cover to show a photo beside a short page of instructions and a tip, and Back and Next buttons walk through the method in order. Phones stack the strips with the photo above the text.",
  useWhen: [
    "A recipe, a craft method or an onboarding guide has a handful of steps that read best one at a time.",
    "You want the whole sequence visible at a glance while only one step is read in full.",
  ],
  customize: [
    "Rewrite the method in `STEPS`; each entry has a one-word strip label, a title, a time, the instructions and a tip.",
    "Change the photo to text balance with the `grid-template-columns` on `.w5brd-body`.",
    "Recolour the numbers and buttons by replacing `#a3401c`, and the paper with `#f8f1e7`.",
  ],
  accessibility: [
    "Each strip is a button naming its step number and title, with aria-expanded, and the Step N of 4 counter is a polite live region that reports changes from the Back and Next buttons.",
  ],
  faqs: [],
  related: [],
  tags: ["recipe steps", "process steps", "expanding panels", "how it works", "step by step"],
  height: 796,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Steps change instantly with the paper cover removed at once and the notes already in place.",
  perf: "Each step change animates transforms and opacity on four panels and then the page is idle.",
};

export default meta;
