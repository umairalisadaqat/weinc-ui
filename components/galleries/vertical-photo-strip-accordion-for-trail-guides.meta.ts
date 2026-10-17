const meta = {
  slug: "vertical-photo-strip-accordion-for-trail-guides",
  category: "galleries",
  name: "Vertical Photo Strip Accordion for Trail Guides",
  keyword: "vertical image accordion",
  title: "",
  description: "",
  intro: "Four hiking routes stacked as tinted photo rows, each showing its name, length and grade. The open row grows into a full photograph with a short description, three trail numbers and a map link, while the others slide down to wait underneath. Because it never turns sideways, the same layout works unchanged on a narrow phone screen.",
  useWhen: [
    "Most of your visitors arrive on phones and a sideways row of strips would be too thin to read.",
    "Each option needs a few numbers beside its photo, such as a route, a tour or a class level.",
  ],
  customize: [
    "Change the closed row height with `--c` on `.w5trl-stage`, and the open photo grows to fill whatever is left of the stage height.",
    "Lighten or darken the closed tint with the alpha in `.w5trl-bar`'s background.",
    "Add or remove trails in `TRAILS`, then set `--n` to the new count.",
  ],
  accessibility: [
    "Rows are buttons with aria-expanded that name the trail, length and grade, so a screen reader user can compare routes before opening one.",
    "The numbers sit in a real description list, and the map link is only tabbable inside the open row.",
  ],
  faqs: [],
  related: [],
  tags: ["vertical accordion", "image accordion", "mobile gallery", "hiking", "photo strips"],
  height: 788,
  section: true,
  interactive: true,
  collection: "expanding-cards",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "Rows open in one step without sliding, and the trail details are shown straight away.",
  perf: "A row change moves four layers with transforms and fades two overlays; nothing runs in between.",
};

export default meta;
