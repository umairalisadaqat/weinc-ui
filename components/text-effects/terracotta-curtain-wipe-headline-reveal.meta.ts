const meta = {
  slug: "terracotta-curtain-wipe-headline-reveal",
  category: "text-effects",
  name: "Terracotta Curtain Wipe Headline",
  keyword: "text reveal animation",
  title: "",
  description: "",
  intro: "A three line serif headline where a block of clay colour sweeps across each line, and the words are there when it leaves. The lines follow each other a beat apart, rest for several seconds, then the curtain closes back over them before the next pass. Suits craft, studio and editorial landing pages.",
  useWhen: ["A short, confident statement split across two or three lines that deserves a theatrical entrance."],
  customize: ["Set `--cmw-clay` to recolour the curtain block and `--cmw-sand` for the page behind it.", "Change `--cmw-cycle` to lengthen the rest between passes; the sweep keeps the same share of the cycle.", "Edit the percentages in `cmw-curtain` if you want the reveal to play once: stop at the 15% frame and drop `infinite`."],
  accessibility: ["The headline text is ordinary text in an h1, never split into letters, so it is read once in full."],
  faqs: [],
  related: [],
  tags: ["mask reveal text", "curtain wipe animation", "css text reveal", "headline animation"],
  height: 620,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "The headline sits fully visible and the curtain block stays parked out of view.",
  perf: "Two transform and opacity animations per line on the compositor; the script only pauses them off screen.",
};

export default meta;
