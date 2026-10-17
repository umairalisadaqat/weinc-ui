const meta = {
  slug: "ink-cloud-blooming-in-water-background",
  category: "backgrounds",
  name: "Ink Cloud Blooming in Water",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "Drops of indigo, sepia and teal ink open in pale water, spread into feathered clouds and thin out until a new drop lands somewhere else. Each colour absorbs light the way pigment does, so overlapping clouds deepen rather than glow. The blooms gather on the right on wide screens and rise from the bottom on phones, leaving the headline on clean paper. Good for art schools, tea rooms, stationers and calm editorial pages.",
  useWhen: [
    "A light page wants slow, organic movement that looks painted rather than digital.",
    "The brand is about making things by hand: calligraphy, ceramics, printmaking or watercolour classes.",
  ],
  customize: [
    "Change the three `INKS` colours; earthy pigments look right, while pure bright colours look like dye in a glass.",
    "Lengthen `LIFE` from 16 to 24 seconds for blooms that open more slowly and linger.",
    "Move the starting points in `SPOTS` if your headline sits on the right; values are fractions of the width and height.",
    "Lower `STRENGTH` from 1.7 to 1.2 for paler washes behind busier layouts.",
  ],
  accessibility: [
    "Blooms are steered away from the text block and capped in darkness, keeping the dark navy copy above 4.5 to 1.",
    "The canvas and grain are `aria-hidden` and pass every click through to the page.",
  ],
  faqs: [],
  related: [],
  tags: ["ink", "watercolour", "canvas", "organic", "light background"],
  height: 600,
  section: true,
  collection: "animated-gradient-background",
  tech: "canvas",
  reducedMotion: "One painted frame of three soft ink clouds stays on the paper with no further movement.",
  perf: "A 140 pixel wide canvas recomputes five blooms per frame, around a millisecond, and the loop stops off screen.",
};

export default meta;
