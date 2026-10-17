const meta = {
  slug: "dawn-blur-fade-word-by-word-reveal",
  category: "text-effects",
  name: "Dawn Blur Fade Word by Word",
  keyword: "blur text reveal",
  title: "",
  description: "",
  intro: "Words of a centred serif headline drift up out of a soft focus one after another over a pale sunrise gradient, then the subline follows. After a long rest they dissolve upward together and the line forms again. Fits wellness, travel and hospitality heroes where the motion should feel slow and warm.",
  useWhen: ["A calm hero line on a booking, retreat or spa page."],
  customize: ["Raise `--bfw-blur` for a foggier start, or lower it toward 6px for a crisper one.", "Change `--bfw-stagger` to set how quickly words follow each other.", "Repaint the sky by editing the three gradients on `.bfw-root`; keep the lower part light so the dark text stays readable."],
  accessibility: ["Screen readers get the headline from a hidden span while the animated word pieces are hidden from them."],
  faqs: [],
  related: [],
  tags: ["blur text animation", "word by word reveal", "fade in text css", "hero headline animation"],
  height: 523,
  section: true,
  collection: "text-reveal-animation",
  tech: "css",
  reducedMotion: "The headline and subline appear sharp and still with no blur or fade.",
  perf: "Blur filters on about ten words while they enter; filters cost more than transforms, so keep it to one headline.",
};

export default meta;
