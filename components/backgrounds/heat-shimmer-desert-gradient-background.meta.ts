const meta = {
  slug: "heat-shimmer-desert-gradient-background",
  category: "backgrounds",
  name: "Heat Shimmer Desert Gradient",
  keyword: "animated gradient background",
  title: "",
  description: "",
  intro: "A bleached sky fades into hot sand, and along the horizon the air wobbles: distant mesas bend, and a pale mirage of them floats on the ground below. The wobble is an SVG displacement filter fed by turbulence whose frequency slowly breathes, applied only to the horizon group so the sky and type stay sharp. Suits travel, outdoor gear, summer events and anything about heat.",
  useWhen: [
    "A light, sunlit hero should feel hot, and a plain sand gradient is not saying enough.",
    "You want a gradient scene where only one band moves, keeping the headline area completely calm.",
  ],
  customize: [
    "Raise `BEND` (the displacement `scale`) from 10 to 16 for a stronger mirage, or drop it to 5 for a faint quiver.",
    "Change `SHIMMER` from `8s` to `14s` to slow the breathing of the heat.",
    "Recolour the sand through the three stops in `hts-ground`; a grey set turns it into a salt flat at noon.",
  ],
  accessibility: [
    "Dark brown text rests on the pale upper sky, far from the moving band, with contrast well above 4.5 to 1.",
    "The SVG and grain sit inside one `aria-hidden` wrapper that does not catch clicks.",
  ],
  faqs: [],
  related: [],
  tags: ["heat haze", "mirage", "svg filter", "desert", "warm gradient"],
  height: 640,
  section: true,
  collection: "animated-gradient-background",
  tech: "css",
  reducedMotion: "The SVG animation is paused at its first frame, leaving a sharp, still horizon with its mirage.",
  perf: "One SVG displacement filter re-renders the horizon band each frame, a moderate paint cost kept to that strip and paused off screen.",
};

export default meta;
