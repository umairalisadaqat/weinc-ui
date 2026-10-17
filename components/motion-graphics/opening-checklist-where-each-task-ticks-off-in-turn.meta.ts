export default {
  slug: "opening-checklist-where-each-task-ticks-off-in-turn",
  category: "motion-graphics",
  name: "Opening Checklist That Ticks Off in Turn",
  keyword: "animated checkmark",
  tags: ["animated checkmark", "task list", "checkbox animation", "success state", "svg stroke"],
  height: 540,
  collection: "animated-icons",
  tech: "script",
  support: "All current browsers",
  reducedMotion: "All four boxes show filled and ticked with the labels struck through, and toggling a box changes it instantly.",
  perf: "Each row runs one fill, one stroke draw and one strike line once on entry; after that only the toggled row transitions.",
  intro: "A cafe's morning checklist that completes itself when it scrolls into view: each box fills forest green, its tick draws, and a thin line strikes through the task, one row after the next, before a summary line confirms the list is done. The boxes are real checkboxes, so staff can untick and retick a task and the summary keeps count.",
  customize: [
    "Set `--m3tsk-gap` to change how far apart the rows tick during the entrance.",
    "Recolour ticked boxes and the summary with `--m3tsk-accent`.",
    "Edit the four `<li>` rows; keep the `--i` index on each so the stagger follows the new order.",
  ],
  accessibility: [
    "Each task is a native checkbox inside its label, so it toggles with Space and reads its state aloud; the summary is a status region that announces the new count after every change.",
  ],
  useWhen: [
    "An onboarding list, shift checklist or setup wizard should show progress being completed rather than only listing it.",
  ],
  faqs: [],
  related: [],
  title: "",
  description: "",
} satisfies UiMeta;
