const meta = {
  slug: "rising-incense-smoke-background-with-curling-wisps-on-charcoal",
  category: "backgrounds",
  name: "Rising Incense Smoke",
  keyword: "smoke animation background",
  title: "",
  description: "",
  intro: "A single incense stick smoulders on charcoal and sends up a smooth thread of smoke that breaks into slow curls as it climbs and fades. The ember glows at the tip. It brings calm and a little ritual to tea rooms, candle and fragrance brands, yoga studios and meditation apps.",
  useWhen: [
    "A fragrance, tea or wellness brand wants motion that feels slow and deliberate.",
    "A dark hero needs one quiet moving element off to the side of the copy."
  ],
  customize: [
    "Lower `SETTINGS.curl` to 0.5 for a still room or raise it to 1.6 for a draughty one.",
    "Change `SETTINGS.rise` to 24 for a slower column.",
    "Tint the smoke with `SETTINGS.smoke`, for example `[200, 214, 224]` for a cooler blue-grey."
  ],
  accessibility: [
    "The smoke is pale and faint, so the cream heading keeps its contrast even where a wisp drifts past."
  ],
  faqs: [],
  related: [],
  tags: [
    "smoke",
    "incense",
    "canvas",
    "dark",
    "wisps"
  ],
  height: 640,
  section: true,
  collection: "animated-background",
  tech: "canvas",
  reducedMotion: "A finished column of smoke hangs in place above the glowing stick.",
  perf: "Around 900 soft sprites drawn per frame at reduced resolution, with a simple drift calculation for each."
};

export default meta;
