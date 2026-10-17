export default {
  slug: "tilt-card-with-a-moving-glare-layer",
  category: "animated-buttons",
  name: "Tilt Card With a Moving Glare Layer",
  keyword: "3d tilt card hover glare",
  tags: ["tilt card", "3d hover", "glare effect", "membership card", "perspective"],
  height: 403,
  section: true,
  collection: "hover-effects",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "The card rests at a fixed, gentle angle with a soft highlight in one corner and never follows the pointer.",
  perf: "A frame loop writes two rotations, one translate and one opacity, and it stops while the section is off screen.",
  intro: "A graphite membership card for a climbing gym that tips toward the mouse in 3D, with a soft white highlight sliding across its face like light on a real card. Only a few degrees of rotation are used, so it stays readable. At rest it rocks in a slow figure-of-eight, and on touch screens it keeps that slow rock since there is no pointer to follow.",
  customize: [
    "Set `MAX_TILT` for the angle at the card's edge and `GLARE` for how bright the highlight gets.",
    "Change `--w3tlt-depth` (perspective) for a flatter or more dramatic tilt.",
  ],
  accessibility: [
    "The card is a single link with an aria-label that states the plan and price, and its visible text is hidden from screen readers to avoid reading it twice.",
  ],
  useWhen: [
    "Showing a membership, gift or loyalty card where a physical feel helps, beside the text that explains it.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
