export default {
  slug: "type-and-delete-phrase-loop-with-natural-typing-rhythm",
  category: "text-effects",
  name: "Type and Delete Loop with Natural Rhythm",
  keyword: "typewriter effect javascript",
  title: "",
  description: "",
  intro: "A plant nursery headline on deep forest green where the second line types, holds, backspaces and types the next ending. The rhythm is uneven on purpose: letters arrive with a little jitter, commas and hyphens earn a longer beat, and now and then it hesitates between words. Deleting starts slow and then runs. Every ending is ghosted in the same grid cell, so the box never changes size.",
  useWhen: [
    "One headline has to speak to several kinds of visitor, and you want each ending to be read in full before the next arrives.",
    "A mechanical, evenly spaced typewriter feels too robotic for a warm brand.",
  ],
  customize: [
    "Edit PHRASES in the script and keep one hidden tdl-ghost span per phrase in the markup, so the reserved box fits the longest ending.",
    "Raise HOLD_MS to give each finished phrase more reading time, or lower BASE_MS for quicker typing.",
    "Change the background radial gradient and --tdl-accent together; the italic ending is the only coloured text.",
  ],
  accessibility: [
    "Screen readers get one hidden sentence listing all three endings, while the typed line and caret are aria-hidden so changes are never announced.",
  ],
  faqs: [],
  related: [],
  tags: ["typewriter effect", "type and delete", "rotating headline", "javascript"],
  height: 560,
  collection: "typing-animation-css",
  tech: "css",
  reducedMotion: "The first ending is shown complete with a still caret, and the script never starts.",
  perf: "One text node updated by a timer roughly every 50ms while typing; the loop waits whenever the headline is off screen.",
} satisfies UiMeta;
