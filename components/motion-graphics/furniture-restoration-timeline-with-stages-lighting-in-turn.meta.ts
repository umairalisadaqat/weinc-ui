const meta = {
  "slug": "furniture-restoration-timeline-with-stages-lighting-in-turn",
  "category": "motion-graphics",
  "name": "Restoration Timeline With Stages Lighting Up",
  "keyword": "animated diagram",
  "title": "",
  "description": "",
  "intro": "A process timeline for a furniture restorer's services page. A brass line runs along the rail at an even pace and each stage's node lights as the line reaches it, with its day range appearing underneath, until all five are lit. On phones the rail turns vertical and fills downward beside the stages.",
  "useWhen": [
    "Setting expectations for a job that runs in stages over days or weeks, such as a restoration, a build or an onboarding plan."
  ],
  "customize": [
    "Change the line and node colour with `--m6tml-brass` and the headings with `--m6tml-navy`.",
    "Add or remove a stage in the list and in the column count, then space the `.m6tml-k` delays evenly across the 1.1s fill.",
    "Edit the day ranges and descriptions in each list item."
  ],
  "accessibility": [
    "The stages are an ordered list with headings, so the order and timings are read without the rail, which is hidden from screen readers."
  ],
  "faqs": [],
  "related": [],
  "tags": [
    "timeline",
    "process diagram",
    "steps",
    "services page"
  ],
  "height": 560,
  "collection": "animated-charts",
  "tech": "css",
  "support": "All current browsers",
  "reducedMotion": "The rail is filled and every stage is lit with its days and description showing.",
  "perf": "One line scales and five nodes and labels fade on the compositor over about 1.5 seconds, then nothing moves."
} satisfies UiMeta;

export default meta;
