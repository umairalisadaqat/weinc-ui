const meta = {
  slug: "expanding-travel-destination-photo-panels",
  category: "galleries",
  name: "Expanding Travel Destination Photo Panels",
  keyword: "expanding image panels",
  title: "",
  description: "",
  intro: "A row of five travel photos where one route sits open and the rest wait as narrow numbered strips with their region written up the side. Resting the mouse on a strip, tabbing to it or tapping it slides the layers across so that trip opens, and its title, length and price rise in underneath. On phones the strips stack top to bottom.",
  useWhen: [
    "A tour operator or travel journal wants every trip visible at once without a carousel hiding most of them.",
    "A homepage band needs to show four to six places with short, scannable details for each.",
  ],
  customize: [
    "Change the closed strip width with `--c` on `.w5trv-stage`, and keep `--n` equal to the number of panels.",
    "Edit trips in the `TRIPS` array (React) or the repeated `.w5trv-panel` blocks (HTML), raising `--i` by one for each.",
    "Slow or speed the slide with the `.75s` on `.w5trv-panel`; the caption waits `.3s` before it fades in.",
  ],
  accessibility: [
    "Each strip is a real button with aria-expanded and a hidden label naming the place and trip, and focusing it opens it, so the whole row works with Tab alone.",
    "Links inside closed panels are taken out of the tab order until their panel opens; with reduced motion the panels switch instantly.",
  ],
  faqs: [],
  related: [],
  tags: ["expanding panels", "image accordion", "travel gallery", "hover gallery", "photo panels"],
  height: 748,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Panels open instantly on hover, focus or tap with no sliding, and every caption stays readable.",
  perf: "Only transforms and opacity change when a panel opens, and nothing runs between interactions.",
};

export default meta;
