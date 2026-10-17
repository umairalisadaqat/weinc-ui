const meta = {
  slug: "data-corruption-text-resolving-into-headline",
  category: "text-effects",
  name: "Data Corruption Text Resolving",
  keyword: "text scramble glitch effect",
  title: "",
  description: "",
  intro: "A monospace headline on a deep navy grid that arrives as scrambled symbols and repairs itself from left to right in about a second and a half. It then holds clean for several seconds before a scatter of characters breaks again and the repair repeats. Because every glyph is the same width, the line never shifts while it changes, which makes it a good fit for backup, security and data tools.",
  useWhen: [
    "The headline is literally about recovery, verification or decryption and the motion should tell that story.",
    "You want a scramble effect that keeps layout perfectly stable on phones, where the line wraps onto three rows.",
  ],
  customize: [
    "Tune the rhythm with `RESOLVE_MS`, `HOLD_MS` and `BREAK_MS` at the top of the component or script.",
    "Swap the noise characters in `NOISE`; stick to plain ASCII so every symbol keeps the monospace width.",
    "Recolour clean and broken characters through the `data-state` rules, or `--w10dcr-clean` and `--w10dcr-noise` in the HTML version.",
  ],
  accessibility: [
    "Screen readers get the finished sentence once from a hidden copy, never the random symbols. Reduced motion skips the scramble entirely and shows the clean headline.",
  ],
  faqs: [],
  related: [],
  tags: ["text scramble effect", "data corruption text", "glitch text", "decrypt animation", "monospace headline"],
  height: 620,
  section: true,
  collection: "glitch-text-effect",
  tech: "css",
  reducedMotion: "The clean headline is shown from the start, with no scrambled characters at any point.",
  perf: "A throttled loop rewrites about thirty single-character spans roughly eighteen times a second, and stops off screen.",
};

export default meta;
