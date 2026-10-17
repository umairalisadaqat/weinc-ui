const meta = {
  slug: "expanding-team-portrait-panels-with-bios",
  category: "galleries",
  name: "Expanding Team Portrait Panels With Bios",
  keyword: "expanding team cards",
  title: "",
  description: "",
  intro: "An about-page block for a small studio: a short pitch on the left and four portrait strips on the right. Closed strips sit in muted grey with initials and a name, and the open one turns to full colour with a white bio card that settles in after the slide. Phones get the same strips stacked as rows.",
  useWhen: [
    "A practice of three to six people wants faces to lead the team section instead of a grid of small headshots.",
    "Each person needs a sentence and a contact link, but not a whole profile page.",
  ],
  customize: [
    "Swap people in the `PEOPLE` array or the `.w5tem-panel` blocks, and set `--n` on `.w5tem-stage` to match the count.",
    "Make closed strips wider or narrower with `--c`, and move the face inside each photo with `object-position` on `.w5tem-media img`.",
    "Remove `.w5tem-mono` if you would rather keep closed portraits in colour.",
  ],
  accessibility: [
    "Every portrait strip is a button announcing the person and role, with aria-expanded set on the open one, and its contact link only joins the tab order when visible.",
  ],
  faqs: [],
  related: [],
  tags: ["team section", "expanding cards", "portrait gallery", "about page", "image accordion"],
  height: 720,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Portraits switch at once with no slide or fade, and the open bio card is shown in place.",
  perf: "Opening a portrait changes transforms and opacity on four layers; there is no loop or scroll work.",
};

export default meta;
